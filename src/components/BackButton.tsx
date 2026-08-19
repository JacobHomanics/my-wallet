import { IconButton } from '@/components/IconButton';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '@/navigation/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type BackButtonProps = {
  onPress?: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
};

export function BackButton({
  onPress,
  accessibilityLabel = 'Go back',
  disabled = false,
}: BackButtonProps) {
  const colors = useThemeColors();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const isDesktopWeb = useIsDesktopWeb();

  if (isDesktopWeb) {
    return null;
  }

  return (
    <IconButton
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      hitSlop={12}
      icon="chevron-back"
      iconSize={28}
      color={colors.primary}
      onPress={() => {
        if (onPress) {
          onPress();
          return;
        }
        navigation.goBack();
      }}
    />
  );
}
