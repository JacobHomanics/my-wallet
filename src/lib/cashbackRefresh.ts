import {
  isRewardToken,
  REWARD_TOKEN_ADDRESS,
  REWARD_TOKEN_NETWORK,
} from '@/lib/rewardToken';
import { fetchErc20Balance } from '@/lib/send/fetchErc20Balance';
import { waitForErc20BalanceAtMost } from '@/lib/send/waitForErc20Balance';
import type { OwnedToken } from '@/lib/alchemy/fetchTokensByAddress';

function wholePointsToRaw(whole: bigint, decimals: number): bigint {
  return whole * 10n ** BigInt(decimals);
}

/** Wait for reward token balance to reflect a redemption, then refresh balances. */
export async function refreshBalancesAfterRedemption(params: {
  tokens: readonly OwnedToken[];
  holder: string;
  pointsWhole: bigint;
  refresh: () => void;
  poll: () => void;
}): Promise<void> {
  params.refresh();

  const rewardToken = params.tokens.find((token) =>
    isRewardToken(token.network, token.tokenAddress),
  );

  let balanceBefore = rewardToken?.rawBalance ?? null;
  const decimals = rewardToken?.decimals ?? 18;

  if (balanceBefore == null) {
    try {
      balanceBefore = await fetchErc20Balance({
        network: REWARD_TOKEN_NETWORK,
        tokenAddress: REWARD_TOKEN_ADDRESS,
        holder: params.holder,
      });
    } catch {
      params.poll();
      return;
    }
  }

  const pointsRaw = wholePointsToRaw(params.pointsWhole, decimals);
  if (balanceBefore <= pointsRaw) {
    params.poll();
    return;
  }

  try {
    await waitForErc20BalanceAtMost({
      network: REWARD_TOKEN_NETWORK,
      tokenAddress: REWARD_TOKEN_ADDRESS,
      holder: params.holder,
      maxRaw: balanceBefore - pointsRaw,
      timeoutMs: 45_000,
    });
  } catch {
    // Indexer may lag; still run a final refresh below.
  }

  params.poll();
}
