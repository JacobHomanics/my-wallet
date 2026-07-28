import { useCallback, useEffect, useMemo, useState } from 'react';

import {
  formatRawTokenBalance,
  formatUsdAmountInput,
  formatUsdValue,
  parseTokenAmountToRaw,
  parseUsdAmountToTokenRaw,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import { isValidRecipientAddress } from '@/lib/validation';

export type SendFormState = {
  selectedToken: OwnedToken | null;
  recipient: string;
  /** USD when the token is priced; otherwise token units. */
  amount: string;
  /** Token amount string for confirm / send (always token units). */
  tokenAmount: string | null;
  amountIsUsd: boolean;
  chain: 'ethereum' | 'solana' | null;
  amountRaw: bigint | null;
  recipientValid: boolean;
  amountValid: boolean;
  exceedsBalance: boolean;
  balanceHint: string | null;
  tokenAmountHint: string | null;
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

/** Prefer an explicit id, otherwise the highest-USD token. */
function pickDefaultTokenId(
  tokens: OwnedToken[],
  preferredId?: string | null,
): string | null {
  if (tokens.length === 0) {
    return null;
  }
  if (preferredId && tokens.some((token) => token.id === preferredId)) {
    return preferredId;
  }
  let best = tokens[0];
  let bestUsd = best.usdValue ?? -1;
  for (let i = 1; i < tokens.length; i += 1) {
    const token = tokens[i];
    const usd = token.usdValue ?? -1;
    if (usd > bestUsd) {
      best = token;
      bestUsd = usd;
    }
  }
  return best.id;
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

  useEffect(() => {
    const stillValid =
      selectedTokenId != null &&
      tokens.some((token) => token.id === selectedTokenId);
    if (stillValid) {
      return;
    }
    setSelectedTokenId(pickDefaultTokenId(tokens, initialTokenId));
  }, [initialTokenId, selectedTokenId, tokens]);

  const selectedToken = useMemo(() => {
    if (!selectedTokenId) {
      return null;
    }
    return tokens.find((token) => token.id === selectedTokenId) ?? null;
  }, [selectedTokenId, tokens]);

  const amountIsUsd = Boolean(
    selectedToken &&
      selectedToken.usdValue != null &&
      selectedToken.usdValue > 0,
  );

  const chain = selectedToken
    ? getNetworkChain(selectedToken.network)
    : null;

  const amountRaw = useMemo(() => {
    if (!selectedToken || !amount.trim()) {
      return null;
    }
    if (amountIsUsd) {
      return parseUsdAmountToTokenRaw(amount, selectedToken);
    }
    return parseTokenAmountToRaw(amount, selectedToken.decimals);
  }, [amount, amountIsUsd, selectedToken]);

  const tokenAmount = useMemo(() => {
    if (!selectedToken || amountRaw == null || amountRaw <= 0n) {
      return null;
    }
    return formatRawTokenBalance(
      amountRaw,
      selectedToken.decimals,
      selectedToken.decimals,
    );
  }, [amountRaw, selectedToken]);

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

  const balanceHint = useMemo(() => {
    if (!selectedToken) {
      return null;
    }
    if (amountIsUsd) {
      const usdLabel = formatUsdValue(selectedToken.usdValue);
      return usdLabel ? `Balance ${usdLabel}` : null;
    }
    return `Balance ${selectedToken.balanceFormatted} ${selectedToken.symbol}`;
  }, [amountIsUsd, selectedToken]);

  const tokenAmountHint = useMemo(() => {
    if (!amountIsUsd || !selectedToken || !tokenAmount) {
      return null;
    }
    return `≈ ${tokenAmount} ${selectedToken.symbol}`;
  }, [amountIsUsd, selectedToken, tokenAmount]);

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
    if (
      selectedToken.usdValue != null &&
      selectedToken.usdValue > 0
    ) {
      setAmountState(formatUsdAmountInput(selectedToken.usdValue));
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
    tokenAmount,
    amountIsUsd,
    chain,
    amountRaw,
    recipientValid,
    amountValid,
    exceedsBalance,
    balanceHint,
    tokenAmountHint,
    canContinue,
    setSelectedTokenId,
    setRecipient,
    setAmount,
    setMaxAmount,
  };
}
