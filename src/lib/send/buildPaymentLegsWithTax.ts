import {
  estimateTokenAmountUsd,
  formatRawTokenBalance,
  parseUsdAmountToTokenRaw,
  type OwnedToken,
} from '@/lib/alchemy/fetchTokensByAddress';
import { getNetworkChain } from '@/lib/alchemy/networks';
import {
  baseSelfGasLegCount,
  totalSelfGasReserveRaw,
} from '@/lib/send/gasReserves';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';
import { isBaseGasPaymentToken, isGasToken } from '@/lib/strategies/gasTokens';
import { isStablecoin } from '@/lib/strategies/stablecoins';
import { computeTaxUsd, getTaxConfig } from '@/lib/tax';

export type PaymentSendLeg = {
  token: PaymentAllocation['token'];
  recipient: string;
  amountRaw: bigint;
  amountFormatted: string;
  /** True when this leg pays the app tax wallet. */
  isTax: boolean;
};

export type TaxFundingPick = {
  token: OwnedToken;
  amountRaw: bigint;
  amountFormatted: string;
  usd: number;
};

export type BuildPaymentLegsWithTaxParams = {
  allocations: readonly PaymentAllocation[];
  ethereumRecipient: string;
  solanaRecipient: string;
  /** Full wallet balances used to fund a single tax transfer. */
  spendableTokens?: readonly OwnedToken[];
  taxEvmAddress?: string;
  taxSolanaAddress?: string;
  taxRate?: number;
};

/**
 * Prefer a single tax funding token: stables first, then non-gas, then gas;
 * break ties by higher USD balance.
 */
export function compareTaxFundingPreference(
  a: OwnedToken,
  b: OwnedToken,
): number {
  const aStable = isStablecoin(a) ? 0 : 1;
  const bStable = isStablecoin(b) ? 0 : 1;
  if (aStable !== bStable) {
    return aStable - bStable;
  }
  const aGas = isGasToken(a) ? 1 : 0;
  const bGas = isGasToken(b) ? 1 : 0;
  if (aGas !== bGas) {
    return aGas - bGas;
  }
  return (b.usdValue ?? 0) - (a.usdValue ?? 0);
}

/**
 * Picks one token that can cover `taxUsd` from leftover balance after reserves.
 * Returns null when no single token can fund the tax alone.
 */
export function pickTaxFundingToken(
  candidates: readonly OwnedToken[],
  taxUsd: number,
  reservedRawByTokenId: ReadonlyMap<string, bigint> = new Map(),
  options?: { skipSelfGasReserve?: boolean },
): TaxFundingPick | null {
  if (!(taxUsd > 0) || candidates.length === 0) {
    return null;
  }

  const ranked = [...candidates].sort(compareTaxFundingPreference);

  for (const token of ranked) {
    if (token.usdValue == null || token.usdValue <= 0 || token.rawBalance <= 0n) {
      continue;
    }

    const reserved = reservedRawByTokenId.get(token.id) ?? 0n;
    if (reserved >= token.rawBalance) {
      continue;
    }
    const gasReserve =
      options?.skipSelfGasReserve || !isBaseGasPaymentToken(token)
        ? 0n
        : totalSelfGasReserveRaw(
            token,
            baseSelfGasLegCount({
              hasMerchantLeg: reserved > 0n,
              hasTaxLeg: true,
            }),
          );
    const availableRaw =
      token.rawBalance > reserved + gasReserve
        ? token.rawBalance - reserved - gasReserve
        : 0n;
    const availableUsd = estimateTokenAmountUsd(token, availableRaw);
    if (availableUsd == null || availableUsd + 0.005 < taxUsd) {
      continue;
    }

    // Price against full token, then clamp to leftover.
    const amountRaw = parseUsdAmountToTokenRaw(String(taxUsd), token);
    if (amountRaw == null || amountRaw <= 0n) {
      continue;
    }
    const clamped = amountRaw > availableRaw ? availableRaw : amountRaw;
    if (clamped <= 0n) {
      continue;
    }

    const usd = estimateTokenAmountUsd(token, clamped) ?? taxUsd;
    return {
      token,
      amountRaw: clamped,
      amountFormatted: formatRawTokenBalance(clamped, token.decimals),
      usd,
    };
  }

  return null;
}

function reservedRawFromAllocations(
  allocations: readonly PaymentAllocation[],
): Map<string, bigint> {
  const reserved = new Map<string, bigint>();
  for (const leg of allocations) {
    if (leg.amountRaw <= 0n) {
      continue;
    }
    reserved.set(
      leg.token.id,
      (reserved.get(leg.token.id) ?? 0n) + leg.amountRaw,
    );
  }
  return reserved;
}

/**
 * Merchant legs unchanged; tax is one extra transfer on a single preferred
 * token (stable > non-gas > gas) so multi-token payments don't create N tax txs.
 */
export function buildPaymentLegsWithTax(
  params: BuildPaymentLegsWithTaxParams,
): PaymentSendLeg[] {
  const tax = getTaxConfig();
  const rate = params.taxRate ?? tax.sponsoredRate;
  const taxEvm = (params.taxEvmAddress ?? tax.evmAddress).trim();
  const taxSolana = (params.taxSolanaAddress ?? tax.solanaAddress).trim();

  const legs: PaymentSendLeg[] = [];
  let merchantUsd = 0;

  for (const allocation of params.allocations) {
    if (allocation.amountRaw <= 0n) {
      continue;
    }

    const chain = getNetworkChain(allocation.token.network);
    const merchantRecipient =
      chain === 'solana'
        ? params.solanaRecipient.trim()
        : params.ethereumRecipient.trim();

    legs.push({
      token: allocation.token,
      recipient: merchantRecipient,
      amountRaw: allocation.amountRaw,
      amountFormatted: allocation.amountFormatted,
      isTax: false,
    });
    merchantUsd += allocation.usd;
  }

  const taxUsd = computeTaxUsd(merchantUsd, rate);
  if (!(taxUsd > 0)) {
    return legs;
  }

  const reserved = reservedRawFromAllocations(params.allocations);
  const allocationTokens = params.allocations
    .filter((leg) => leg.amountRaw > 0n)
    .map((leg) => leg.token);
  const spendable = params.spendableTokens ?? [];
  const funding =
    pickTaxFundingToken(allocationTokens, taxUsd, reserved) ??
    pickTaxFundingToken(
      spendable.filter(
        (token) => !allocationTokens.some((item) => item.id === token.id),
      ),
      taxUsd,
      reserved,
    );
  if (!funding) {
    return legs;
  }

  const chain = getNetworkChain(funding.token.network);
  const taxRecipient = chain === 'solana' ? taxSolana : taxEvm;
  if (!taxRecipient) {
    return legs;
  }

  legs.push({
    token: funding.token,
    recipient: taxRecipient,
    amountRaw: funding.amountRaw,
    amountFormatted: funding.amountFormatted,
    isTax: true,
  });

  return legs;
}

/**
 * Resolves the single-token tax funding pick for UI / balance checks.
 * Prefers payment allocation tokens, then other spendable balances.
 */
export function resolveTaxFunding(
  allocations: readonly PaymentAllocation[],
  spendableTokens: readonly OwnedToken[],
  taxUsd: number,
): TaxFundingPick | null {
  if (!(taxUsd > 0)) {
    return null;
  }

  const reserved = reservedRawFromAllocations(allocations);
  const allocationTokens = allocations
    .filter((leg) => leg.amountRaw > 0n)
    .map((leg) => leg.token);
  const extras = spendableTokens.filter(
    (token) => !allocationTokens.some((item) => item.id === token.id),
  );

  return (
    pickTaxFundingToken(allocationTokens, taxUsd, reserved) ??
    pickTaxFundingToken(extras, taxUsd, reserved)
  );
}

/** Shrink one preferred token so merchant allocation leaves room for tax. */
export function reserveTaxHeadroomOnTokens(
  tokens: readonly OwnedToken[],
  taxUsd: number,
): OwnedToken[] {
  if (!(taxUsd > 0) || tokens.length === 0) {
    return [...tokens];
  }

  const funding = pickTaxFundingToken(tokens, taxUsd, new Map(), {
    skipSelfGasReserve: true,
  });
  if (!funding) {
    return [...tokens];
  }

  return tokens.map((token) => {
    if (token.id !== funding.token.id) {
      return token;
    }
    const merchantMax = token.rawBalance - funding.amountRaw;
    if (merchantMax <= 0n) {
      return {
        ...token,
        rawBalance: 0n,
        usdValue: 0,
      };
    }
    const usdScale =
      token.usdValue != null && token.rawBalance > 0n
        ? Number(merchantMax) / Number(token.rawBalance)
        : 1;
    return {
      ...token,
      rawBalance: merchantMax,
      usdValue:
        token.usdValue != null ? token.usdValue * usdScale : token.usdValue,
    };
  });
}
