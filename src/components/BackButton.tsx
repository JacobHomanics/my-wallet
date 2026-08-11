import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet } from 'react-native';

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import type { RootStackParamList } from '@/navigation/types';

type BackButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
};

export function BackButton({
  onPress,
  accessibilityLabel = 'Go back',
}: BackButtonProps) {
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel={accessibilityLabel}
      accessibilityRole="button"
      hitSlop={12}
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }
        navigation.goBack();
      }}
      style={({ pressed }) => [
        styles.backButton,
        pressed && styles.backButtonPressed,
      ]}
    >
      <Ionicons name="chevron-back" size={28} color="#D33D3D" />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonPressed: {
    opacity: 0.76,
  },
});
