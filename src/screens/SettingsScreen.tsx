import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { usePaymentStrategy } from '@/hooks/usePaymentStrategy';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useSignOut } from '@/hooks/useSignOut';
import { useUserWallets } from '@/hooks/useUserWallets';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { PaymentStrategy } from '@/lib/strategies';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { displayName } = useProfileIdentity();
  const { ready, wallets } = useUserWallets();
  const { signOut } = useSignOut();
  const { copy, isCopied } = useCopyToClipboard();
  const { strategies, selectedStrategy, selectedStrategyId, setStrategy } =
    usePaymentStrategy();
  const [strategyPickerOpen, setStrategyPickerOpen] = useState(false);

  const onSelectStrategy = useCallback(
    (strategy: PaymentStrategy) => {
      setStrategy(strategy.id);
      setStrategyPickerOpen(false);
    },
    [setStrategy],
  );

  const renderStrategy = useCallback(
    ({ item }: { item: PaymentStrategy }) => {
      const selected = item.id === selectedStrategyId;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => {
            onSelectStrategy(item);
          }}
          style={({ pressed }) => [
            styles.strategyOption,
            selected && styles.strategyOptionSelected,
            pressed && styles.strategyOptionPressed,
          ]}
        >
          <View style={styles.strategyOptionText}>
            <Text style={styles.strategyOptionLabel}>{item.label}</Text>
            <Text style={styles.strategyOptionDescription}>
              {item.description}
            </Text>
          </View>
          {selected ? (
            <Ionicons name="checkmark-circle" size={22} color="#0f172a" />
          ) : (
            <View style={styles.strategyOptionSpacer} />
          )}
        </Pressable>
      );
    },
    [onSelectStrategy, selectedStrategyId],
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Signed in as {displayName}.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strategy</Text>
        <Pressable
          accessibilityLabel={`Payment strategy ${selectedStrategy.label}`}
          accessibilityRole="button"
          onPress={() => {
            setStrategyPickerOpen(true);
          }}
          style={({ pressed }) => [
            styles.strategyRow,
            pressed && styles.strategyRowPressed,
          ]}
        >
          <View style={styles.strategyRowText}>
            <Text style={styles.strategyLabel}>{selectedStrategy.label}</Text>
            <Text style={styles.strategyDescription}>
              {selectedStrategy.description}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#94a3b8" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallets</Text>
        {!ready ? (
          <ActivityIndicator color="#0f172a" style={styles.loader} />
        ) : wallets.length === 0 ? (
          <Text style={styles.empty}>Creating your wallets…</Text>
        ) : (
          wallets.map((wallet) => {
            const walletKey = `${wallet.chain}-${wallet.address}`;
            const copied = isCopied(walletKey);

            return (
              <View key={walletKey} style={styles.walletRow}>
                <View style={styles.walletHeader}>
                  <Text style={styles.walletLabel}>{wallet.label}</Text>
                  <Pressable
                    accessibilityLabel={
                      copied ? 'Address copied' : `Copy ${wallet.label} address`
                    }
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => {
                      void copy(wallet.address, walletKey);
                    }}
                    style={({ pressed }) => [
                      styles.copyButton,
                      pressed && styles.copyButtonPressed,
                    ]}
                  >
                    <Ionicons
                      name={copied ? 'checkmark' : 'copy-outline'}
                      size={18}
                      color={copied ? '#15803d' : '#64748b'}
                    />
                  </Pressable>
                </View>
                <Text style={styles.walletAddress} selectable>
                  {formatWalletAddress(wallet.address)}
                </Text>
                <Text style={styles.walletFull} selectable>
                  {wallet.address}
                </Text>
              </View>
            );
          })
        )}
      </View>

      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void signOut();
        }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>

      <Modal
        animationType="slide"
        onRequestClose={() => {
          setStrategyPickerOpen(false);
        }}
        presentationStyle="pageSheet"
        visible={strategyPickerOpen}
      >
        <View
          style={[
            styles.modalContainer,
            { paddingTop: Math.max(insets.top, 12) },
          ]}
        >
          <View style={styles.modalTopBar}>
            <Text style={styles.modalTitle}>Select strategy</Text>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                setStrategyPickerOpen(false);
              }}
              style={({ pressed }) => [
                styles.modalClose,
                pressed && styles.modalClosePressed,
              ]}
            >
              <Ionicons name="close" size={22} color="#0f172a" />
            </Pressable>
          </View>

          <FlatList
            contentContainerStyle={styles.strategyList}
            data={[...strategies]}
            keyExtractor={(item) => item.id}
            renderItem={renderStrategy}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 420,
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  strategyRowPressed: {
    opacity: 0.85,
  },
  strategyRowText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  strategyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  strategyDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#94a3b8',
  },
  loader: {
    marginTop: 8,
  },
  empty: {
    fontSize: 15,
    color: '#94a3b8',
  },
  walletRow: {
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 4,
  },
  walletHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  walletLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
  },
  copyButton: {
    padding: 4,
  },
  copyButtonPressed: {
    opacity: 0.7,
  },
  walletAddress: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
  walletFull: {
    fontSize: 12,
    color: '#94a3b8',
  },
  button: {
    marginTop: 24,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    paddingLeft: 40,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClosePressed: {
    opacity: 0.6,
  },
  strategyList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  strategyOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  strategyOptionSelected: {
    borderColor: '#0f172a',
  },
  strategyOptionPressed: {
    opacity: 0.85,
  },
  strategyOptionText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  strategyOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  strategyOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  strategyOptionSpacer: {
    width: 22,
  },
});
