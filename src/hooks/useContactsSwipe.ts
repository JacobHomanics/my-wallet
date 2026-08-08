import { useCallback, useRef } from 'react';
import type Swipeable from 'react-native-gesture-handler/Swipeable';

/**
 * Keep at most one contact row swipe-open at a time.
 */
export function useContactsSwipe() {
  const openRef = useRef<Swipeable | null>(null);
  const openIdRef = useRef<string | null>(null);

  const closeOpen = useCallback(() => {
    openRef.current?.close();
    openRef.current = null;
    openIdRef.current = null;
  }, []);

  const onRowOpen = useCallback((contactId: string, ref: Swipeable) => {
    if (openRef.current && openRef.current !== ref) {
      openRef.current.close();
    }
    openRef.current = ref;
    openIdRef.current = contactId;
  }, []);

  const onRowClose = useCallback((contactId: string) => {
    if (openIdRef.current === contactId) {
      openRef.current = null;
      openIdRef.current = null;
    }
  }, []);

  return {
    closeOpen,
    onRowOpen,
    onRowClose,
  };
}
