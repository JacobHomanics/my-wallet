import { useCallback, useMemo, useState } from 'react';

import {
  formatRawTokenBalance,
  parseTokenAmountToRaw,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { isValidRecipientAddress } from '@/lib/validation';

export type SendFormState = {
  selectedToken: OwnedToken | null;
  recipient: string;
  amount: string;
  chain: 'ethereum' | 'solana' | null;
  amountRaw: bigint | null;
  recipientValid: boolean;
  amountValid: boolean;
  exceedsBalance: boolean;
  canContinue: boolean;
  setSelectedTokenId: (tokenId: string | null) => void;
  setRecipient: (value: string) => void;
  setAmount: (value: string) => void;
  setMaxAmount: () => void;
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
  initialTokenId?: string | null,
): SendFormState {
  const [selectedTokenId, setSelectedTokenId] = useState<string | null>(
    initialTokenId ?? null,
  );
  const [recipient, setRecipientState] = useState('');
  const [amount, setAmountState] = useState('');

  const selectedToken = useMemo(() => {
    if (!selectedTokenId) {
      return null;
    }
    return tokens.find((token) => token.id === selectedTokenId) ?? null;
  }, [selectedTokenId, tokens]);

  const chain = selectedToken
    ? getNetworkChain(selectedToken.network)
    : null;

  const amountRaw = useMemo(() => {
    if (!selectedToken || !amount.trim()) {
      return null;
    }
    return parseTokenAmountToRaw(amount, selectedToken.decimals);
  }, [amount, selectedToken]);

  const recipientValid = useMemo(() => {
    if (!chain || !recipient.trim()) {
      return false;
    }
    return isValidRecipientAddress(recipient, chain);
  }, [chain, recipient]);

  const exceedsBalance = useMemo(() => {
    if (!selectedToken || amountRaw == null) {
      return false;
    }
    return amountRaw > selectedToken.rawBalance;
  }, [amountRaw, selectedToken]);

  const amountValid =
    amountRaw != null && amountRaw > 0n && !exceedsBalance;

  const canContinue = Boolean(selectedToken) && recipientValid && amountValid;

  const setRecipient = useCallback((value: string) => {
    setRecipientState(value);
  }, []);

  const setAmount = useCallback((value: string) => {
    setAmountState(sanitizeAmountInput(value));
  }, []);

  const setMaxAmount = useCallback(() => {
    if (!selectedToken) {
      return;
    }
    setAmountState(
      formatRawTokenBalance(
        selectedToken.rawBalance,
        selectedToken.decimals,
        selectedToken.decimals,
      ),
    );
  }, [selectedToken]);

  return {
    selectedToken,
    recipient,
    amount,
    chain,
    amountRaw,
    recipientValid,
    amountValid,
    exceedsBalance,
    canContinue,
    setSelectedTokenId,
    setRecipient,
    setAmount,
    setMaxAmount,
  };
}
