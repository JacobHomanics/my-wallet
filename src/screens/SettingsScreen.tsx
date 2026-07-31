import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { ChainPriorityPickerModal } from '@/components/ChainPriorityPickerModal';
import { DisplayCurrencyPickerModal } from '@/components/DisplayCurrencyPickerModal';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { WalletDebitCard } from '@/components/WalletDebitCard';
import { useChainPriorityPicker } from '@/hooks/useChainPriorityPicker';
import { useDisplayCurrencyPicker } from '@/hooks/useDisplayCurrencyPicker';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useSignOut } from '@/hooks/useSignOut';
import { useStrategyPicker } from '@/hooks/useStrategyPicker';
import { useUserWallets } from '@/hooks/useUserWallets';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
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
  const {
    options: chainPriorityOptions,
    selectedOption: selectedChainPriority,
    selectedChainPriorityId,
    pickerOpen: chainPriorityPickerOpen,
    openPicker: openChainPriorityPicker,
    closePicker: closeChainPriorityPicker,
    onSelectOption: onSelectChainPriority,
  } = useChainPriorityPicker();
  const {
    options: displayCurrencyOptions,
    selectedCurrency,
    selectedDisplayCurrencyId,
    pickerOpen: displayCurrencyPickerOpen,
    openPicker: openDisplayCurrencyPicker,
    closePicker: closeDisplayCurrencyPicker,
    onSelectOption: onSelectDisplayCurrency,
  } = useDisplayCurrencyPicker();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
            paddingLeft: Math.max(insets.left, 24),
            paddingRight: Math.max(insets.right, 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
      <Text style={styles.title}>Settings</Text>
      <Text style={styles.subtitle}>Signed in as {displayName}.</Text>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Default strategy</Text>
        <Pressable
          accessibilityLabel={`Default strategy ${selectedStrategy.label}`}
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
        <Text style={styles.sectionTitle}>Display currency</Text>
        <Pressable
          accessibilityLabel={`Display currency ${selectedCurrency.label}`}
          accessibilityRole="button"
          onPress={openDisplayCurrencyPicker}
          style={({ pressed }) => [
            styles.strategyRow,
            pressed && styles.strategyRowPressed,
          ]}
        >
          <View style={styles.strategyRowText}>
            <Text style={styles.strategyLabel}>
              {selectedCurrency.label} ({selectedCurrency.code})
            </Text>
            <Text style={styles.strategyDescription}>
              {selectedCurrency.description}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#94a3b8" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chain priority</Text>
        <Pressable
          accessibilityLabel={`Chain priority ${selectedChainPriority.label}`}
          accessibilityRole="button"
          onPress={openChainPriorityPicker}
          style={({ pressed }) => [
            styles.strategyRow,
            pressed && styles.strategyRowPressed,
          ]}
        >
          <View style={styles.strategyRowText}>
            <Text style={styles.strategyLabel}>
              {selectedChainPriority.label}
            </Text>
            <Text style={styles.strategyDescription}>
              {selectedChainPriority.description}
            </Text>
          </View>
          <Ionicons name="chevron-down" size={18} color="#94a3b8" />
        </Pressable>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Wallet</Text>
        {!ready ? (
          <ActivityIndicator color="#0f172a" style={styles.loader} />
        ) : wallets.length === 0 ? (
          <Text style={styles.empty}>Creating your wallet…</Text>
        ) : (
          wallets.map((wallet) => {
            const walletKey = `${wallet.chain}-${wallet.address}`;

            return (
              <WalletDebitCard
                key={walletKey}
                wallet={wallet}
                accountLabel={displayName}
                copied={isCopied(walletKey)}
                onCopy={() => {
                  void copy(wallet.address, walletKey);
                }}
              />
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
      </ScrollView>

      <StrategyPickerModal
        onClose={closePicker}
        onSelect={onSelectStrategy}
        selectedStrategyId={selectedStrategyId}
        strategies={strategies}
        visible={pickerOpen}
      />

      <ChainPriorityPickerModal
        onClose={closeChainPriorityPicker}
        onSelect={onSelectChainPriority}
        options={chainPriorityOptions}
        selectedChainPriorityId={selectedChainPriorityId}
        visible={chainPriorityPickerOpen}
      />

      <DisplayCurrencyPickerModal
        onClose={closeDisplayCurrencyPicker}
        onSelect={onSelectDisplayCurrency}
        options={displayCurrencyOptions}
        selectedDisplayCurrencyId={selectedDisplayCurrencyId}
        visible={displayCurrencyPickerOpen}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
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
