import { useEffect, useMemo, useState } from 'react';

import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';
import { fetchGasFeeEstimates } from '@/lib/send/fetchGasFeeEstimates';
import {
  applyGasReserves,
  totalSpendableUsd,
  type NetworkGasFeeEstimate,
} from '@/lib/send/gasReserves';
import { isGasToken } from '@/lib/strategies/gasTokens';

const EMPTY_ESTIMATES = new Map<string, NetworkGasFeeEstimate>();

/**
 * Token balances with native gas reserved so Available Balance and allocation
 * reflect what can actually be sent (fees left on-chain for each potential leg).
 */
export function useSpendableTokens(tokens: OwnedToken[]): {
  spendableTokens: OwnedToken[];
  availableUsd: number | null;
  gasEstimatesReady: boolean;
} {
  const networksKey = useMemo(() => {
    const networks = [
      ...new Set(
        tokens
          .filter((token) => token.rawBalance > 0n)
          .map((token) => token.network),
      ),
    ].sort();
    return networks.join('|');
  }, [tokens]);

  const forTokenTransferByNetwork = useMemo(() => {
    const map = new Map<string, boolean>();
    for (const token of tokens) {
      if (token.rawBalance <= 0n) {
        continue;
      }
      if (!isGasToken(token)) {
        map.set(token.network, true);
      } else if (!map.has(token.network)) {
        map.set(token.network, false);
      }
    }
    return map;
  }, [tokens]);

  const [feeEstimates, setFeeEstimates] =
    useState<Map<string, NetworkGasFeeEstimate>>(EMPTY_ESTIMATES);
  const [gasEstimatesReady, setGasEstimatesReady] = useState(false);

  useEffect(() => {
    if (!networksKey) {
      setFeeEstimates(EMPTY_ESTIMATES);
      setGasEstimatesReady(true);
      return;
    }

    const networks = networksKey.split('|').filter(Boolean);
    const controller = new AbortController();
    setGasEstimatesReady(false);

    void (async () => {
      const estimates = await fetchGasFeeEstimates({
        networks,
        forTokenTransferByNetwork,
        signal: controller.signal,
      });
      if (controller.signal.aborted) {
        return;
      }
      setFeeEstimates(estimates);
      setGasEstimatesReady(true);
    })();

    return () => {
      controller.abort();
    };
  }, [forTokenTransferByNetwork, networksKey]);

  const spendableTokens = useMemo(
    () => applyGasReserves(tokens, feeEstimates),
    [feeEstimates, tokens],
  );

  const availableUsd = useMemo(
    () => totalSpendableUsd(spendableTokens),
    [spendableTokens],
  );

  return {
    spendableTokens,
    availableUsd,
    gasEstimatesReady,
  };
}
