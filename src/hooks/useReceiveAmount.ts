import { useCallback, useMemo, useState } from 'react';

import { useFiatDisplay } from '@/hooks/useFiatDisplay';

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

export type ReceiveAmountState = {
  amount: string;
  amountValid: boolean;
  canContinue: boolean;
  setAmount: (value: string) => void;
};

/** Amount entry for the request payment flow. */
export function useReceiveAmount(initialAmount = ''): ReceiveAmountState {
  const { parseDisplayInputToUsd } = useFiatDisplay();
  const [amount, setAmountState] = useState(initialAmount);

  const setAmount = useCallback((value: string) => {
    setAmountState(sanitizeAmountInput(value));
  }, []);

  const amountValid = useMemo(() => {
    const usd = parseDisplayInputToUsd(amount);
    return usd != null && usd > 0;
  }, [amount, parseDisplayInputToUsd]);

  return {
    amount,
    amountValid,
    canContinue: amountValid,
    setAmount,
  };
}
