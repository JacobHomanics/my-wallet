import { Platform } from 'react-native';

type WebMouseDownProps = {
  onMouseDown?: (event: { preventDefault(): void }) => void;
};

/**
 * Prevents a focused TextInput from blurring before Pressable onPress on web.
 */
export function webPressableMouseDownProps(): WebMouseDownProps {
  if (Platform.OS !== 'web') {
    return {};
  }

  return {
    onMouseDown: (event) => {
      event.preventDefault();
    },
  };
}
