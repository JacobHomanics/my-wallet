import { Ionicons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSignUpLoginCallout } from '@/hooks/useSignUpLoginCallout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

type SignUpLoginBannerProps = {
  /** Extra bottom padding when the tab bar is hidden (stack screens). */
  includeBottomInset?: boolean;
};

/**
 * Full-width banner asking signed-out users to create an account.
 */
export function SignUpLoginBanner({
  includeBottomInset = false,
}: SignUpLoginBannerProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const { isAuthenticated, openLogin } = useSignUpLoginCallout();

  if (isAuthenticated) {
    return null;
  }

  return (
    <Pressable
      accessibilityLabel="Click here to Sign up / Login"
      accessibilityRole="button"
      onPress={openLogin}
      style={({ pressed }) => [
        styles.banner,
        includeBottomInset && {
          paddingBottom: Math.max(insets.bottom, 10),
        },
        pressed && styles.bannerPressed,
      ]}
    >
      <Ionicons name="log-in-outline" size={16} color={colors.primaryText} />
      <Text style={styles.title}>Click here to Sign up / Login</Text>
    </Pressable>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    banner: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: 8,
      width: '100%',
      paddingHorizontal: 16,
      paddingVertical: 10,
      backgroundColor: c.primary,
    },
    bannerPressed: {
      opacity: 0.88,
    },
    title: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primaryText,
    },
  });
}
