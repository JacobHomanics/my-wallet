import { useCallback, useEffect, useRef, useState } from 'react';
import { Platform, Share } from 'react-native';
import * as Clipboard from 'expo-clipboard';

import { useThemeColors } from '@/hooks/useThemeColors';

const CLIPBOARD_RESET_MS = 2000;

function isShareCancelled(error: unknown): boolean {
  if (!(error instanceof Error)) {
    return false;
  }

  const message = error.message.toLowerCase();
  return (
    error.name === 'AbortError' ||
    message.includes('cancel') ||
    message.includes('dismiss')
  );
}

async function shareUrl(url: string): Promise<'shared' | 'copied' | 'cancelled'> {
  if (Platform.OS === 'web') {
    try {
      if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
        await navigator.share({ url });
        return 'shared';
      }
    } catch (error) {
      if (isShareCancelled(error)) {
        return 'cancelled';
      }
    }

    await Clipboard.setStringAsync(url);
    return 'copied';
  }

  try {
    await Share.share(
      Platform.OS === 'ios'
        ? { url }
        : { message: url, title: 'Share link' },
      { dialogTitle: 'Share link' },
    );
    return 'shared';
  } catch (error) {
    if (isShareCancelled(error)) {
      return 'cancelled';
    }
    throw error;
  }
}

/**
 * Opens the native share sheet for a receive or request payment URL.
 * Falls back to copying the link on web browsers without Web Share.
 */
export function useShareReceiveLink(url: string | null) {
  const colors = useThemeColors();
  const [copied, setCopied] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const onShare = useCallback(() => {
    if (!url) {
      return;
    }

    void (async () => {
      const result = await shareUrl(url);
      if (result !== 'copied') {
        return;
      }

      setCopied(true);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        setCopied(false);
      }, CLIPBOARD_RESET_MS);
    })();
  }, [url]);

  return {
    onShare,
    disabled: !url,
    copied,
    icon: copied ? ('checkmark' as const) : ('share-outline' as const),
    accessibilityLabel: copied ? 'Link copied' : 'Share link',
    color: copied ? colors.success : colors.primary,
  };
}
