import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useSignOut } from '@/hooks/useSignOut';
import { useStrategyPicker } from '@/hooks/useStrategyPicker';
import { useUserWallets } from '@/hooks/useUserWallets';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';

export function SettingsScreen() {
  const { displayName } = useProfileIdentity();
  const { ready, wallets } = useUserWallets();
  const { signOut } = useSignOut();
  const { copy, isCopied } = useCopyToClipboard();
  const {
    strategies,
    selectedStrategy,
    selectedStrategyId,
    pickerOpen,
    openPicker,
    closePicker,
    onSelectStrategy,
  } = useStrategyPicker();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Signed in as {displayName}.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Strategy</Text>
        <Pressable
          accessibilityLabel={`Payment strategy ${selectedStrategy.label}`}
          accessibilityRole="button"
          onPress={openPicker}
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

      <StrategyPickerModal
        onClose={closePicker}
        onSelect={onSelectStrategy}
        selectedStrategyId={selectedStrategyId}
        strategies={strategies}
        visible={pickerOpen}
      />
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
});
