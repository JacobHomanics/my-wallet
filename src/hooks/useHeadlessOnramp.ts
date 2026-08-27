import { useAction } from 'convex/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import type {
  CollectPaymentMethodOnCompletionRequest,
  KycInfo,
  OnrampCoordinator,
} from '@stripe/crypto';

import { useConvexUserId } from '@/hooks/useConvexUserId';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { useOnrampVaultDepositCompletion } from '@/hooks/useOnrampVaultDepositCompletion';
import { useUserWallets } from '@/hooks/useUserWallets';
import type { OnrampDestinationNetwork } from '@/lib/onrampSettings';
import { fetchClientIp } from '@/lib/stripe/clientIp';
import {
  getHeadlessOnrampCoordinator,
  toCryptoNetwork,
} from '@/lib/stripe/loadHeadlessOnramp';
import { api } from '../../convex/_generated/api';

/**
 * Steps of the headless purchase, in the order Stripe requires them.
 *
 * The step is derived from what the *server* knows about the Link customer
 * (KYC state, registered wallets), never from local optimism — a reload mid
 * flow has to land the user back where they actually are.
 */
export type HeadlessOnrampStep =
  | { kind: 'loading' }
  | { kind: 'unavailable'; reason: string }
  | { kind: 'email' }
  | { kind: 'register'; email: string }
  | { kind: 'authenticating' }
  | { kind: 'kyc' }
  | { kind: 'wallet' }
  | { kind: 'payment' }
  | { kind: 'amount'; paymentTokenId: string; paymentLabel: string | null }
  | { kind: 'confirming' }
  | { kind: 'tracking'; stripeSessionId: string };

export type RegistrationInput = {
  phone: string;
  country: string;
  fullName: string;
};

export type KycInput = {
  givenName: string;
  surname: string;
  dateOfBirth: string;
  line1: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  ssn: string;
};

const KYC_PASSED_STATUSES = new Set(['passed', 'verified', 'completed']);

function toDateOfBirth(value: string): KycInfo['date_of_birth'] {
  const [year, month, day] = value.split('-').map((part) => Number(part));
  if (!year || !month || !day) {
    throw new Error('Enter your date of birth as YYYY-MM-DD.');
  }
  return { year, month, day };
}

function describePaymentMethod(
  request: CollectPaymentMethodOnCompletionRequest,
): string | null {
  const details = request.paymentMethodDetails;
  if (!details) {
    return null;
  }
  if (details.type === 'card') {
    return `${details.card.brand} ···· ${details.card.last4}`;
  }
  return `${details.us_bank_account.bank_name ?? 'Bank'} ···· ${details.us_bank_account.last4}`;
}

function isAchToken(
  request: CollectPaymentMethodOnCompletionRequest,
): boolean {
  return request.paymentMethodDetails?.type === 'us_bank_account';
}

/**
 * ACH debits need an online mandate: the payer's IP and user agent at the
 * moment of acceptance. Card payments need none.
 */
async function buildAchMandate(
  isAch: boolean,
): Promise<{ ipAddress: string; userAgent: string } | undefined> {
  if (!isAch) {
    return undefined;
  }
  const ipAddress = await fetchClientIp();
  if (!ipAddress) {
    throw new Error(
      'Could not record bank debit authorization. Try again, or pay by card.',
    );
  }
  return {
    ipAddress,
    userAgent:
      typeof navigator === 'undefined' ? 'unknown' : navigator.userAgent,
  };
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error && error.message ? error.message : fallback;
}

export type HeadlessOnrampFlow = {
  step: HeadlessOnrampStep;
  error: string | null;
  isBusy: boolean;
  /** Ref callback for the host of the Link authentication modal element. */
  setAuthContainer: (node: HTMLDivElement | null) => void;
  /** Ref callback for the host of the payment method collection element. */
  setPaymentContainer: (node: HTMLDivElement | null) => void;
  destinationNetwork: OnrampDestinationNetwork;
  submitEmail: (email: string) => Promise<void>;
  submitRegistration: (input: RegistrationInput) => Promise<void>;
  submitKyc: (input: KycInput) => Promise<void>;
  submitAmount: (sourceAmount: string) => Promise<void>;
  dismissError: () => void;
};

/**
 * Drives the headless Crypto Onramp purchase.
 *
 * Every network call that needs the Link OAuth token runs in Convex; the
 * browser only ever handles the coordinator's own UI elements and the resulting
 * ids, so a compromised client cannot spend a user's Link session.
 */
export function useHeadlessOnramp(params: {
  ethereumAddress: string | null;
  onSessionStarted: (stripeSessionId: string) => void;
}): HeadlessOnrampFlow {
  const { ethereumAddress, onSessionStarted } = params;
  const { userId } = useConvexUserId();
  const { selectedNetwork } = useOnrampSettings();
  const { wallets } = useUserWallets();
  const { willAutoDepositToVault, getPriorBaseUsdcBalanceRaw } =
    useOnrampVaultDepositCompletion();

  const createLinkAuthIntent = useAction(api.linkAuth.createLinkAuthIntent);
  const saveLinkAuthSession = useAction(api.linkAuth.saveLinkAuthSession);
  const getCustomerState = useAction(api.linkAuth.getCustomerState);
  const createSession = useAction(api.onrampHeadless.createSession);
  const checkoutSession = useAction(api.onrampHeadless.checkoutSession);

  const [step, setStep] = useState<HeadlessOnrampStep>({ kind: 'loading' });
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const coordinatorRef = useRef<OnrampCoordinator | null>(null);
  const authContainerRef = useRef<HTMLDivElement | null>(null);
  const paymentContainerRef = useRef<HTMLDivElement | null>(null);
  const emailRef = useRef<string>('');
  const isAchRef = useRef(false);

  const destinationNetwork = selectedNetwork.id;

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const coordinator = await getHeadlessOnrampCoordinator();
      if (cancelled) {
        return;
      }
      if (!coordinator) {
        setStep({
          kind: 'unavailable',
          reason:
            'Stripe is not configured. Add EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY to enable deposits.',
        });
        return;
      }
      coordinatorRef.current = coordinator;
      setStep({ kind: 'email' });
    })();
    return () => {
      cancelled = true;
      coordinatorRef.current?.destroy();
      coordinatorRef.current = null;
    };
  }, []);

  // Callback refs, not ref objects: the screen hands Stripe a mount point
  // without ever reading a ref during render.
  const setAuthContainer = useCallback((node: HTMLDivElement | null) => {
    authContainerRef.current = node;
  }, []);

  const setPaymentContainer = useCallback((node: HTMLDivElement | null) => {
    paymentContainerRef.current = node;
  }, []);

  const requireCoordinator = useCallback((): OnrampCoordinator => {
    const coordinator = coordinatorRef.current;
    if (!coordinator) {
      throw new Error('Stripe is still loading. Try again in a moment.');
    }
    return coordinator;
  }, []);

  /**
   * Ask the server what this Link customer still owes us, and park the user on
   * the first unmet requirement.
   */
  const advanceFromCustomerState = useCallback(async () => {
    if (!userId) {
      throw new Error('Sign in to continue.');
    }
    const state = await getCustomerState({ userId });
    if (state.status === 'unauthenticated') {
      setStep({ kind: 'email' });
      return;
    }

    if (!KYC_PASSED_STATUSES.has(state.customer.kycStatus)) {
      setStep({ kind: 'kyc' });
      return;
    }

    if (!ethereumAddress) {
      throw new Error('No Ethereum wallet available to deposit into.');
    }
    const address = ethereumAddress.trim().toLowerCase();
    const registered = state.customer.wallets.some(
      (wallet) => wallet.address.trim().toLowerCase() === address,
    );
    if (registered) {
      setStep({ kind: 'payment' });
      return;
    }

    // Registering the user's existing Privy wallet is a Stripe-side
    // prerequisite for a session, so it happens inline here rather than in an
    // effect watching the step — the caller already owns the busy/error state.
    setStep({ kind: 'wallet' });
    await requireCoordinator().registerWalletAddress(
      ethereumAddress,
      toCryptoNetwork(destinationNetwork),
    );
    setStep({ kind: 'payment' });
  }, [
    destinationNetwork,
    ethereumAddress,
    getCustomerState,
    requireCoordinator,
    userId,
  ]);

  const runStep = useCallback(async (work: () => Promise<void>) => {
    setIsBusy(true);
    setError(null);
    try {
      await work();
    } catch (caught) {
      setError(errorMessage(caught, 'Something went wrong. Try again.'));
    } finally {
      setIsBusy(false);
    }
  }, []);

  /** Mount Stripe's Link authentication modal and wait for its verdict. */
  const authenticate = useCallback(
    async (linkAuthIntentId: string) => {
      const coordinator = requireCoordinator();
      setStep({ kind: 'authenticating' });

      const result = await new Promise<{
        crypto_customer_id?: string;
        result: 'success' | 'abandoned' | 'declined';
      }>((resolve) => {
        void coordinator
          .authenticate(linkAuthIntentId, resolve)
          .then((element) => {
            if (element && authContainerRef.current) {
              authContainerRef.current.innerHTML = '';
              authContainerRef.current.appendChild(element);
            }
          });
      });

      if (authContainerRef.current) {
        authContainerRef.current.innerHTML = '';
      }

      if (result.result !== 'success' || !result.crypto_customer_id) {
        setStep({ kind: 'email' });
        throw new Error(
          result.result === 'declined'
            ? 'Link could not verify that account.'
            : 'Link sign-in was cancelled.',
        );
      }

      if (!userId) {
        throw new Error('Sign in to continue.');
      }

      await saveLinkAuthSession({
        userId,
        linkAuthIntentId,
        cryptoCustomerId: result.crypto_customer_id,
      });
      await advanceFromCustomerState();
    },
    [advanceFromCustomerState, requireCoordinator, saveLinkAuthSession, userId],
  );

  const submitEmail = useCallback(
    async (email: string) => {
      await runStep(async () => {
        const trimmed = email.trim();
        emailRef.current = trimmed;
        const intent = await createLinkAuthIntent({ email: trimmed });
        if (intent.status === 'no_account') {
          setStep({ kind: 'register', email: trimmed });
          return;
        }
        await authenticate(intent.linkAuthIntentId);
      });
    },
    [authenticate, createLinkAuthIntent, runStep],
  );

  const submitRegistration = useCallback(
    async (input: RegistrationInput) => {
      await runStep(async () => {
        const coordinator = requireCoordinator();
        const email = emailRef.current;
        await coordinator.registerLinkUser(
          email,
          input.phone.trim(),
          input.country.trim().toUpperCase(),
          input.fullName.trim() || undefined,
        );
        const intent = await createLinkAuthIntent({ email });
        if (intent.status === 'no_account') {
          throw new Error(
            'Link did not finish creating that account. Try again.',
          );
        }
        await authenticate(intent.linkAuthIntentId);
      });
    },
    [authenticate, createLinkAuthIntent, requireCoordinator, runStep],
  );

  const submitKyc = useCallback(
    async (input: KycInput) => {
      await runStep(async () => {
        const coordinator = requireCoordinator();
        await coordinator.submitKycInfo({
          given_name: input.givenName.trim(),
          surname: input.surname.trim(),
          date_of_birth: toDateOfBirth(input.dateOfBirth.trim()),
          address: {
            line1: input.line1.trim(),
            city: input.city.trim(),
            state: input.state.trim(),
            postal_code: input.postalCode.trim(),
            country: input.country.trim().toUpperCase(),
          },
          id_number: { type: 'us_ssn', value: input.ssn.trim() },
        });
        await advanceFromCustomerState();
      });
    },
    [advanceFromCustomerState, requireCoordinator, runStep],
  );

  /** Mount Stripe's payment-method element once the wallet is registered. */
  useEffect(() => {
    if (step.kind !== 'payment') {
      return;
    }
    const container = paymentContainerRef.current;
    if (!container) {
      return;
    }
    const coordinator = coordinatorRef.current;
    if (!coordinator) {
      return;
    }

    let cancelled = false;
    container.innerHTML = '';
    void coordinator
      .collectPaymentMethod(
        {
          payment_method_types: ['card', 'us_bank_account'],
          wallets: { applePay: 'auto', googlePay: 'auto' },
        },
        (request) => {
          if (cancelled) {
            return;
          }
          isAchRef.current = isAchToken(request);
          setStep({
            kind: 'amount',
            paymentTokenId: request.cryptoPaymentToken,
            paymentLabel: describePaymentMethod(request),
          });
        },
      )
      .then((element) => {
        if (!cancelled) {
          container.appendChild(element);
        }
      })
      .catch((caught: unknown) => {
        setError(
          errorMessage(caught, 'Could not load payment methods. Try again.'),
        );
      });

    return () => {
      cancelled = true;
      container.innerHTML = '';
    };
  }, [step]);

  const submitAmount = useCallback(
    async (sourceAmount: string) => {
      if (step.kind !== 'amount') {
        return;
      }
      const { paymentTokenId } = step;

      await runStep(async () => {
        if (!userId || !ethereumAddress) {
          throw new Error('Sign in with a wallet to continue.');
        }
        const coordinator = requireCoordinator();
        const ethereumWallet = wallets.find(
          (wallet) => wallet.chain === 'ethereum',
        );

        // Only hand the server auto-deposit inputs when the user's settings
        // actually call for a vault deposit; otherwise the webhook must not
        // move funds after fulfillment.
        const autoDeposit =
          willAutoDepositToVault && ethereumWallet?.id
            ? {
                ethereumWalletId: ethereumWallet.id,
                priorBalanceRaw: getPriorBaseUsdcBalanceRaw().toString(),
              }
            : { ethereumWalletId: undefined, priorBalanceRaw: undefined };

        const session = await createSession({
          userId,
          walletAddress: ethereumAddress,
          sourceAmount,
          destinationNetwork,
          ...autoDeposit,
        });

        setStep({ kind: 'confirming' });

        const checkout = await coordinator.performCheckout(
          session.stripeSessionId,
          async (onrampSessionId) => {
            const confirmed = await checkoutSession({
              userId,
              stripeSessionId: onrampSessionId,
              paymentTokenId,
              mandate: await buildAchMandate(isAchRef.current),
            });
            return confirmed.clientSecret;
          },
        );

        if (!checkout.successful) {
          setStep({
            kind: 'amount',
            paymentTokenId,
            paymentLabel: step.paymentLabel,
          });
          throw new Error('Stripe could not complete the purchase.');
        }

        onSessionStarted(session.stripeSessionId);
        setStep({ kind: 'tracking', stripeSessionId: session.stripeSessionId });
      });
    },
    [
      checkoutSession,
      createSession,
      destinationNetwork,
      ethereumAddress,
      getPriorBaseUsdcBalanceRaw,
      onSessionStarted,
      requireCoordinator,
      runStep,
      step,
      userId,
      wallets,
      willAutoDepositToVault,
    ],
  );

  const dismissError = useCallback(() => setError(null), []);

  return {
    step,
    error,
    isBusy,
    setAuthContainer,
    setPaymentContainer,
    destinationNetwork,
    submitEmail,
    submitRegistration,
    submitKyc,
    submitAmount,
    dismissError,
  };
}
