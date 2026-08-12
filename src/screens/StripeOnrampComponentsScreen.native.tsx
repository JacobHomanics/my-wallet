import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { usePopToHome } from '@/hooks/usePopToHome';

/**
 * Native stub — Privy fiat onramp with Stripe Embedded Components is web-only.
 */
export function StripeOnrampComponentsScreen() {
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
        Card deposits via Privy are available on web for now.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
    color: '#14532d',
  },
  topBarSpacer: {
    width: 40,
  },
  message: {
    marginTop: 32,
    fontSize: 15,
    lineHeight: 22,
    color: '#374151',
    textAlign: 'center',
  },
});
