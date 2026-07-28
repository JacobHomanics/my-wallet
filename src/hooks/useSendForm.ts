import { useCallback, useMemo, useState } from 'react';

import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
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
  chain: 'ethereum' | 'solana' | null;
  filledUsd: number;
  remainingUsd: number;
  canFulfill: boolean;
  recipient: string;
  recipientValid: boolean;
  amountValid: boolean;
  /** True when USD amount is set but holdings cannot cover it. */
  insufficientFunds: boolean;
  tokenAmountHint: string | null;
  canContinue: boolean;
  setRecipient: (value: string) => void;
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

function recipientChainHint(
  recipient: string,
): 'ethereum' | 'solana' | null {
  const trimmed = recipient.trim();
  if (!trimmed) {
    return null;
  }
  if (isValidRecipientAddress(trimmed, 'ethereum')) {
    return 'ethereum';
  }
  if (isValidRecipientAddress(trimmed, 'solana')) {
    return 'solana';
  }
  return null;
}

export function useSendForm(
  tokens: OwnedToken[],
  strategyId: PaymentStrategyId,
  preferredTokenId?: string | null,
): SendFormState {
  const [recipient, setRecipientState] = useState('');
  const [amount, setAmountState] = useState('');

  const usdAmount = useMemo(() => parseUsdInput(amount), [amount]);

  const chainFromRecipient = useMemo(
    () => recipientChainHint(recipient),
    [recipient],
  );

  const plan = useMemo(() => {
    if (usdAmount == null || usdAmount <= 0) {
      return {
        allocations: [] as PaymentAllocation[],
        filledUsd: 0,
        remainingUsd: 0,
        canFulfill: false,
        chain: chainFromRecipient,
      };
    }

    return allocatePaymentUsd({
      tokens,
      usdAmount,
      strategyId,
      chain: chainFromRecipient,
      preferredTokenId,
    });
  }, [chainFromRecipient, preferredTokenId, strategyId, tokens, usdAmount]);

  const chain = plan.chain;
  const allocations = plan.allocations;

  const recipientValid = useMemo(() => {
    if (!chain || !recipient.trim()) {
      return false;
    }
    return isValidRecipientAddress(recipient, chain);
  }, [chain, recipient]);

  const amountValid = usdAmount != null && usdAmount > 0;
  const insufficientFunds = amountValid && !plan.canFulfill;

  const canContinue =
    amountValid &&
    plan.canFulfill &&
    allocations.length > 0 &&
    recipientValid;

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

  const setRecipient = useCallback((value: string) => {
    setRecipientState(value);
  }, []);

  const setAmount = useCallback((value: string) => {
    setAmountState(sanitizeAmountInput(value));
  }, []);

  return {
    amount,
    allocations,
    chain,
    filledUsd: plan.filledUsd,
    remainingUsd: plan.remainingUsd,
    canFulfill: plan.canFulfill,
    recipient,
    recipientValid,
    amountValid,
    insufficientFunds,
    tokenAmountHint,
    canContinue,
    setRecipient,
    setAmount,
  };
}
