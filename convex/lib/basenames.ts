import { base } from "viem/chains";
import { normalize, toCoinType } from "viem/ens";

import { resolveEvmName, type EvmNameResolveResult } from "./evmNames";

const BASENAME_SUFFIX = ".base.eth";

export type BasenameResolveResult = EvmNameResolveResult;

export function normalizeBasename(value: string): string | null {
  const trimmed = value.trim().toLowerCase().replace(/^@/, "");
  if (!trimmed) {
    return null;
  }

  const withSuffix = trimmed.endsWith(BASENAME_SUFFIX)
    ? trimmed
    : `${trimmed}${BASENAME_SUFFIX}`;

  try {
    return normalize(withSuffix);
  } catch {
    return null;
  }
}

/** Resolve a Basename (name.base.eth) to a Base EVM address. */
export async function resolveBasename(
  value: string,
): Promise<BasenameResolveResult | null> {
  const normalized = normalizeBasename(value);
  if (!normalized) {
    return null;
  }

  return await resolveEvmName(normalized, {
    coinType: toCoinType(base.id),
  });
}
