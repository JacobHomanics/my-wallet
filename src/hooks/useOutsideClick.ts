import { useEffect, type RefObject } from 'react';
import { Platform } from 'react-native';

/**
 * Calls `callback` when a click/tap occurs outside `ref` (web only).
 */
export function useOutsideClick(
  ref: RefObject<Element | null>,
  callback: () => void,
) {
  useEffect(() => {
    if (Platform.OS !== 'web') {
      return;
    }

    const handleOutsideClick = (event: MouseEvent) => {
      if (!(event.target instanceof Element)) {
        return;
      }

      if (ref.current && !ref.current.contains(event.target)) {
        callback();
      }
    };

    document.addEventListener('click', handleOutsideClick);
    return () => {
      document.removeEventListener('click', handleOutsideClick);
    };
  }, [ref, callback]);
}
