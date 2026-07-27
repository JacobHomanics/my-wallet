import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Shown after a successful send from the confirm screen.
 */
export function SentScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'sent'>>();
  const { hash, amount, symbol } = route.params;

  const onDone = useCallback(() => {
    navigation.navigate('index');
  }, [navigation]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          <View style={styles.topBarSpacer} />
          <Text style={styles.topBarTitle}>Sent</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.result}>
          <View style={styles.resultIcon}>
            <Ionicons name="checkmark-circle" size={48} color="#15803d" />
          </View>
          <Text style={styles.resultTitle}>Sent</Text>
          <Text style={styles.resultAmount}>
            {amount} {symbol}
          </Text>
          <Text style={styles.resultHash} selectable>
            {formatWalletAddress(hash, 10, 10)}
          </Text>
          <Pressable
            accessibilityRole="button"
            onPress={onDone}
            style={({ pressed }) => [
              styles.primaryButton,
              pressed && styles.primaryButtonPressed,
            ]}
          >
            <Text style={styles.primaryButtonText}>Done</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  topBarSpacer: {
    width: 44,
  },
  result: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
    alignItems: 'center',
  },
  resultIcon: {
    marginBottom: 16,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 8,
  },
  resultAmount: {
    fontSize: 17,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 12,
    fontVariant: ['tabular-nums'],
  },
  resultHash: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 32,
    fontVariant: ['tabular-nums'],
  },
  primaryButton: {
    alignItems: 'center',
    alignSelf: 'stretch',
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 10,
  },
  primaryButtonPressed: {
    opacity: 0.85,
  },
  primaryButtonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
});
