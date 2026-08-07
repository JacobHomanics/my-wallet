import { useCallback, useState } from 'react';

/**
 * Open / close state for the send recipient platform search modal.
 */
export function useRecipientSearchModal(initial = false) {
  const [searchOpen, setSearchOpen] = useState(initial);

  const openSearch = useCallback(() => {
    setSearchOpen(true);
  }, []);

  const closeSearch = useCallback(() => {
    setSearchOpen(false);
  }, []);

  return { searchOpen, openSearch, closeSearch };
}
