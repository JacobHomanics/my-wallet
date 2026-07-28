import {
  CHAIN_PRIORITY_CONFIG,
  getChainPriority,
  type ChainPriority,
} from '@/lib/config/chainPriority';

/**
 * Reads the app-wide EVM vs Solana priority from config.
 */
export function useChainPriority(): {
  priority: ChainPriority;
  config: typeof CHAIN_PRIORITY_CONFIG;
} {
  return {
    priority: getChainPriority(),
    config: CHAIN_PRIORITY_CONFIG,
  };
}
