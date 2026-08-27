import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

/**
 * Native stub — the headless onramp mounts Stripe DOM elements (web only).
 */
export function StripeHeadlessOnrampScreen() {
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const goHome = usePopToHome();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.topBar}>
        <BackButton accessibilityLabel="Back to home" onPress={goHome} />
        <Text style={styles.topBarTitle}>Deposit</Text>
        <View style={styles.topBarSpacer} />
      </View>
      <Text style={styles.message}>
        Headless Stripe deposits are available on web for now.
      </Text>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
      paddingHorizontal: 16,
    },
    topBar: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingBottom: 8,
      minHeight: 44,
    },
    topBarTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '600',
      color: c.text,
    },
    topBarSpacer: {
      width: 40,
    },
    message: {
      marginTop: 32,
      fontSize: 15,
      lineHeight: 22,
      color: c.textMuted,
      textAlign: 'center',
    },
  });
}
