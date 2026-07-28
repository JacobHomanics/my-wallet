import { useCallback, useMemo, useState } from 'react';

import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import {
  allocatePaymentUsd,
  parseUsdInput,
  type PaymentAllocation,
} from '@/lib/strategies/allocatePayment';
import type { PaymentStrategyId } from '@/lib/strategies';
import { isValidRecipientAddress } from '@/lib/validation';

export type SendFormState = {
  /** USD amount the user is trying to send. */
  amount: string;
  allocations: PaymentAllocation[];
  /** Chain families that appear in the current allocation. */
  chains: Array<'ethereum' | 'solana'>;
  needsEthereumRecipient: boolean;
  needsSolanaRecipient: boolean;
  filledUsd: number;
  remainingUsd: number;
  canFulfill: boolean;
  ethereumRecipient: string;
  solanaRecipient: string;
  ethereumRecipientValid: boolean;
  solanaRecipientValid: boolean;
  recipientsValid: boolean;
  amountValid: boolean;
  /** True when USD amount is set but holdings cannot cover it. */
  insufficientFunds: boolean;
  tokenAmountHint: string | null;
  canContinue: boolean;
  setEthereumRecipient: (value: string) => void;
  setSolanaRecipient: (value: string) => void;
  setAmount: (value: string) => void;
};

function sanitizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) {
    return cleaned;
  }
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, '')
  );
}

export function useSendForm(
  tokens: OwnedToken[],
  strategyId: PaymentStrategyId,
  preferredTokenId?: string | null,
): SendFormState {
  const [ethereumRecipient, setEthereumRecipientState] = useState('');
  const [solanaRecipient, setSolanaRecipientState] = useState('');
  const [amount, setAmountState] = useState('');

  const usdAmount = useMemo(() => parseUsdInput(amount), [amount]);

  const plan = useMemo(() => {
    if (usdAmount == null || usdAmount <= 0) {
      return {
        allocations: [] as PaymentAllocation[],
        filledUsd: 0,
        remainingUsd: 0,
        canFulfill: false,
        chains: [] as Array<'ethereum' | 'solana'>,
      };
    }

    return allocatePaymentUsd({
      tokens,
      usdAmount,
      strategyId,
      preferredTokenId,
    });
  }, [preferredTokenId, strategyId, tokens, usdAmount]);

  const allocations = plan.allocations;
  const chains = plan.chains;
  const needsEthereumRecipient = chains.includes('ethereum');
  const needsSolanaRecipient = chains.includes('solana');

  const ethereumRecipientValid = useMemo(() => {
    if (!needsEthereumRecipient) {
      return true;
    }
    return isValidRecipientAddress(ethereumRecipient, 'ethereum');
  }, [ethereumRecipient, needsEthereumRecipient]);

  const solanaRecipientValid = useMemo(() => {
    if (!needsSolanaRecipient) {
      return true;
    }
    return isValidRecipientAddress(solanaRecipient, 'solana');
  }, [needsSolanaRecipient, solanaRecipient]);

  const recipientsValid = ethereumRecipientValid && solanaRecipientValid;

  const amountValid = usdAmount != null && usdAmount > 0;
  const insufficientFunds = amountValid && !plan.canFulfill;

  const canContinue =
    amountValid &&
    plan.canFulfill &&
    allocations.length > 0 &&
    recipientsValid &&
    (!needsEthereumRecipient || ethereumRecipient.trim().length > 0) &&
    (!needsSolanaRecipient || solanaRecipient.trim().length > 0);

  const tokenAmountHint = useMemo(() => {
    if (!amountValid || allocations.length === 0) {
      return null;
    }
    if (allocations.length === 1) {
      const leg = allocations[0];
      return `≈ ${leg.amountFormatted} ${leg.token.symbol}`;
    }
    return allocations
      .map((leg) => `${leg.amountFormatted} ${leg.token.symbol}`)
      .join(' + ');
  }, [allocations, amountValid]);

  const setEthereumRecipient = useCallback((value: string) => {
    setEthereumRecipientState(value);
  }, []);

  const setSolanaRecipient = useCallback((value: string) => {
    setSolanaRecipientState(value);
  }, []);

  const setAmount = useCallback((value: string) => {
    setAmountState(sanitizeAmountInput(value));
  }, []);

  return {
    amount,
    allocations,
    chains,
    needsEthereumRecipient,
    needsSolanaRecipient,
    filledUsd: plan.filledUsd,
    remainingUsd: plan.remainingUsd,
    canFulfill: plan.canFulfill,
    ethereumRecipient,
    solanaRecipient,
    ethereumRecipientValid,
    solanaRecipientValid,
    recipientsValid,
    amountValid,
    insufficientFunds,
    tokenAmountHint,
    canContinue,
    setEthereumRecipient,
    setSolanaRecipient,
    setAmount,
  };
}

/** Recipient address for a payment leg based on its token chain. */
export function recipientForAllocation(
  allocation: PaymentAllocation,
  ethereumRecipient: string,
  solanaRecipient: string,
): string {
  return getNetworkChain(allocation.token.network) === 'solana'
    ? solanaRecipient.trim()
    : ethereumRecipient.trim();
}
