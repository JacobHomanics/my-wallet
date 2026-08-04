import { useCallback, useMemo, useState } from 'react';

import type { DisplayCurrencyOption } from '@/lib/displayCurrency';

/**
 * Search/filter state for the display currency picker.
 */
export function useDisplayCurrencyFilter(
  options: readonly DisplayCurrencyOption[],
) {
  const [query, setQuery] = useState('');

  const normalizedQuery = query.trim().toLowerCase();

  const filteredOptions = useMemo(() => {
    if (!normalizedQuery) {
      return options;
    }

    return options.filter((option) => {
      const haystacks = [
        option.label,
        option.code,
        option.description,
        option.id,
      ].map((value) => value.toLowerCase());

      return haystacks.some((value) => value.includes(normalizedQuery));
    });
  }, [normalizedQuery, options]);

  const clearQuery = useCallback(() => {
    setQuery('');
  }, []);

  return {
    query,
    setQuery,
    clearQuery,
    filteredOptions,
    hasActiveQuery: normalizedQuery.length > 0,
  };
}
