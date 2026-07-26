import { useState } from 'react';
import { Platform } from 'react-native';

export function useCopyToClipboard() {
  const [isCopiedToClipboard, setIsCopiedToClipboard] = useState(false);

  const copyToClipboard = async (text: string) => {
    if (Platform.OS !== 'web' || typeof navigator === 'undefined') {
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setIsCopiedToClipboard(true);
      setTimeout(() => {
        setIsCopiedToClipboard(false);
      }, 800);
    } catch (error) {
      console.error('Failed to copy text:', error);
    }
  };

  return { copyToClipboard, isCopiedToClipboard };
}
