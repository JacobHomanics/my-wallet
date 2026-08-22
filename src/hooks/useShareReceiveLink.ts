import { useCallback } from 'react';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Copy/share a receive or request payment URL from a header icon.
 */
export function useShareReceiveLink(url: string | null) {
  const colors = useThemeColors();
  const { copy, isCopied } = useCopyToClipboard();
  const copied = Boolean(url) && isCopied('url');

  const onShare = useCallback(() => {
    if (!url) {
      return;
    }
    void copy(url, 'url');
  }, [copy, url]);

  return {
    onShare,
    disabled: !url,
    copied,
    icon: copied ? ('checkmark' as const) : ('share-outline' as const),
    accessibilityLabel: copied ? 'Link copied' : 'Share link',
    color: copied ? colors.success : colors.primary,
  };
}
