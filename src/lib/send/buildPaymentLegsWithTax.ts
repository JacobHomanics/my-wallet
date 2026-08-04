import { getNetworkChain } from '@/lib/alchemy/networks';
import {
  estimateTokenAmountUsd,
  formatRawTokenBalance,
} from '@/lib/alchemy/fetchTokensByAddress';
import type { PaymentAllocation } from '@/lib/strategies/allocatePayment';
import { getTaxConfig, taxRawFromAmount } from '@/lib/tax';

export type PaymentSendLeg = {
  token: PaymentAllocation['token'];
  recipient: string;
  amountRaw: bigint;
  amountFormatted: string;
  /** True when this leg pays the app tax wallet. */
  isTax: boolean;
};

export type BuildPaymentLegsWithTaxParams = {
  allocations: readonly PaymentAllocation[];
  ethereumRecipient: string;
  solanaRecipient: string;
  taxEvmAddress?: string;
  taxSolanaAddress?: string;
  taxRate?: number;
};

/**
 * Expands merchant allocations into merchant + proportional tax transfer legs.
 * Tax is on top of the merchant amount (same token, rate% extra raw units).
 */
export function buildPaymentLegsWithTax(
  params: BuildPaymentLegsWithTaxParams,
): PaymentSendLeg[] {
  const tax = getTaxConfig();
  const rate = params.taxRate ?? tax.rate;
  const taxEvm = (params.taxEvmAddress ?? tax.evmAddress).trim();
  const taxSolana = (params.taxSolanaAddress ?? tax.solanaAddress).trim();

  const legs: PaymentSendLeg[] = [];

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

    const taxRaw = taxRawFromAmount(allocation.amountRaw, rate);
    if (taxRaw <= 0n) {
      continue;
    }

    const taxRecipient = chain === 'solana' ? taxSolana : taxEvm;
    if (!taxRecipient) {
      continue;
    }

    legs.push({
      token: allocation.token,
      recipient: taxRecipient,
      amountRaw: taxRaw,
      amountFormatted: formatRawTokenBalance(
        taxRaw,
        allocation.token.decimals,
      ),
      isTax: true,
    });
  }

  return legs;
}

/** USD value of tax that will be taken on top of these merchant allocations. */
export function taxUsdFromAllocations(
  allocations: readonly PaymentAllocation[],
  rate?: number,
): number {
  const resolvedRate = rate ?? getTaxConfig().rate;
  let total = 0;
  for (const leg of allocations) {
    if (leg.amountRaw <= 0n) {
      continue;
    }
    const taxRaw = taxRawFromAmount(leg.amountRaw, resolvedRate);
    if (taxRaw <= 0n) {
      continue;
    }
    const estimated = estimateTokenAmountUsd(leg.token, taxRaw);
    total += estimated ?? leg.usd * resolvedRate;
  }
  return total;
}
