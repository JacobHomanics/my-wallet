import { useCallback, useState } from 'react';

export type AllocationInputUnit = 'token' | 'usd';

/**
 * Toggle for whether allocation inputs are entered as token amounts or USD.
 */
export function useAllocationInputUnit(
  initial: AllocationInputUnit = 'token',
) {
  const [allocationInputUnit, setAllocationInputUnit] =
    useState<AllocationInputUnit>(initial);

  const toggleAllocationInputUnit = useCallback(() => {
    setAllocationInputUnit((unit) => (unit === 'token' ? 'usd' : 'token'));
  }, []);

  return {
    allocationInputUnit,
    setAllocationInputUnit,
    toggleAllocationInputUnit,
  };
}
