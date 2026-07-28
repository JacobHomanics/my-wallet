import { useCallback, useSyncExternalStore } from 'react';

import {
  CHAIN_PRIORITY_OPTIONS,
  DEFAULT_CHAIN_PRIORITY_ID,
  getChainPriorityOption,
  type ChainPriorityId,
  type ChainPriorityOption,
} from '@/lib/chainPriority';

type ChainPriorityListener = () => void;

let selectedChainPriorityId: ChainPriorityId = DEFAULT_CHAIN_PRIORITY_ID;
const listeners = new Set<ChainPriorityListener>();

function subscribe(listener: ChainPriorityListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): ChainPriorityId {
  return selectedChainPriorityId;
}

export function getChainPriorityId(): ChainPriorityId {
  return getSnapshot();
}

function setSelectedChainPriorityId(id: ChainPriorityId): void {
  if (id === selectedChainPriorityId) {
    return;
  }
  selectedChainPriorityId = id;
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * User preference for whether to prioritize EVM or Solana tokens.
 */
export function useChainPriority(): {
  options: readonly ChainPriorityOption[];
  selectedChainPriorityId: ChainPriorityId;
  selectedOption: ChainPriorityOption;
  setChainPriority: (id: ChainPriorityId) => void;
} {
  const selectedId = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getSnapshot,
  );

  const setChainPriority = useCallback((id: ChainPriorityId) => {
    setSelectedChainPriorityId(id);
  }, []);

  const selectedOption =
    getChainPriorityOption(selectedId) ??
    getChainPriorityOption(DEFAULT_CHAIN_PRIORITY_ID)!;

  return {
    options: CHAIN_PRIORITY_OPTIONS,
    selectedChainPriorityId: selectedOption.id,
    selectedOption,
    setChainPriority,
  };
}
