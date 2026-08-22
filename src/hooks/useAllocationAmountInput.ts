import { useCallback, useState } from 'react';

/**
 * Ignore mount / programmatic TextInput onChangeText until the field is focused.
 */
export function useAllocationAmountInput(
  tokenId: string,
  onChange: (tokenId: string, value: string) => void,
): {
  onFocus: () => void;
  onBlur: () => void;
  onChangeText: (value: string) => void;
} {
  const [focused, setFocused] = useState(false);

  const onFocus = useCallback(() => {
    setFocused(true);
  }, []);

  const onBlur = useCallback(() => {
    setFocused(false);
  }, []);

  const onChangeText = useCallback(
    (value: string) => {
      if (!focused) {
        return;
      }
      onChange(tokenId, value);
    },
    [focused, onChange, tokenId],
  );

  return { onFocus, onBlur, onChangeText };
}
