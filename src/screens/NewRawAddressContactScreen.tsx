import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { useAddContact } from '@/hooks/useAddContact';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToContacts } from '@/hooks/usePopToContacts';
import { useWalletBalanceSearch } from '@/hooks/useWalletBalanceSearch';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { ContactsStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Add an external contact by name and EVM/Solana addresses.
 */
export function NewRawAddressContactScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goContacts = usePopToContacts();
  const navigation =
    useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();
  const { addAddresses, isAdding, errorMessage } = useAddContact();
  const [name, setName] = useState('');
  const [walletQuery, setWalletQuery] = useState('');
  const trimmedName = name.trim();
  const {
    result: walletResult,
    isSearching,
    showEmpty,
    errorMessage: walletErrorMessage,
  } = useWalletBalanceSearch(walletQuery);
  const canSubmit = walletResult != null;

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('newContact');
  };

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goBack}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton accessibilityLabel="Back" onPress={goBack} />
          )}
          <Text style={styles.topBarTitle}>Raw address(es)</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 24) + 24 },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}

          <View style={styles.card}>
            <View style={styles.group}>
              <Text style={styles.fieldLabel}>Name</Text>
              <TextInput
                accessibilityLabel="Contact name"
                autoCapitalize="words"
                autoCorrect={false}
                editable={!isAdding}
                onChangeText={setName}
                placeholder="Name (optional)"
                placeholderTextColor="#86a894"
                style={styles.input}
                value={name}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.group}>
              <Text style={styles.fieldLabel}>Wallet</Text>
              <View style={styles.searchRow}>
                <TextInput
                  accessibilityLabel="Wallet address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  editable={!isAdding}
                  onChangeText={setWalletQuery}
                  placeholder="Wallet address"
                  placeholderTextColor="#86a894"
                  style={styles.searchInput}
                  value={walletQuery}
                />
                {walletQuery.trim() ? (
                  <Pressable
                    accessibilityLabel="Clear wallet search"
                    accessibilityRole="button"
                    hitSlop={8}
                    onPress={() => {
                      setWalletQuery('');
                    }}
                    style={({ pressed }) => [
                      styles.clearSearchButton,
                      pressed && styles.clearSearchButtonPressed,
                    ]}
                  >
                    <Ionicons name="close-circle" size={18} color={colors.textMuted} />
                  </Pressable>
                ) : null}
              </View>

              {walletErrorMessage ? (
                <Text style={styles.error}>{walletErrorMessage}</Text>
              ) : null}

              {isSearching ? (
                <ActivityIndicator color={colors.primary} style={styles.loader} />
              ) : null}

              {walletResult ? (
                <View style={styles.resultCard}>
                  <Avatar
                    label={walletResult.address}
                    seed={walletResult.address}
                    size={40}
                  />
                  <View style={styles.resultText}>
                    <Text style={styles.resultLabel}>
                      {walletResult.totalUsdLabel ??
                        formatWalletAddress(walletResult.address, 8, 6)}
                    </Text>
                    <Text style={styles.resultDescription}>
                      {walletResult.chain === 'ethereum'
                        ? 'EVM wallet'
                        : 'Solana wallet'}
                    </Text>
                    {walletResult.balances.map((balance) => (
                      <Text
                        key={`${balance.network}:${balance.symbol}`}
                        style={styles.resultDescription}
                      >
                        {balance.networkLabel}: {balance.balanceLabel}
                        {balance.usdLabel ? ` (${balance.usdLabel})` : ''}
                      </Text>
                    ))}
                  </View>
                </View>
              ) : null}

              {showEmpty ? (
                <Text style={styles.empty}>
                  This wallet resolved, but no token balances were found on the
                  supported networks.
                </Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit || isAdding}
              onPress={() => {
                if (!walletResult) {
                  return;
                }
                void (async () => {
                  const ok = await addAddresses({
                    name: trimmedName,
                    evmAddress:
                      walletResult.chain === 'ethereum'
                        ? walletResult.address
                        : undefined,
                    solanaAddress:
                      walletResult.chain === 'solana'
                        ? walletResult.address
                        : undefined,
                  });
                  if (ok) {
                    goContacts();
                  }
                })();
              }}
              style={({ pressed }) => [
                styles.addButton,
                (!canSubmit || isAdding) && styles.addButtonDisabled,
                pressed && canSubmit && !isAdding && styles.addButtonPressed,
              ]}
            >
              {isAdding ? (
                <ActivityIndicator color={colors.primaryText} />
              ) : (
                <Text style={styles.addButtonText}>Add contact</Text>
              )}
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
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
    color: c.primary,
  },
  topBarSpacer: {
    width: 44,
  },
  webBack: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  webBackPressed: {
    opacity: 0.7,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  loader: {
    marginTop: 8,
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: c.danger,
  },
  empty: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textSubtle,
  },
  card: {
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    padding: 16,
    gap: 14,
  },
  group: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    width: '100%',
    backgroundColor: c.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: c.primary,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    backgroundColor: c.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 10,
    paddingHorizontal: 14,
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: c.primary,
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchButtonPressed: {
    opacity: 0.7,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.bg,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
  resultDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textMuted,
  },
  addButton: {
    marginTop: 4,
    backgroundColor: c.primary,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.45,
  },
  addButtonPressed: {
    opacity: 0.85,
  },
  addButtonText: {
    color: c.primaryText,
    fontSize: 15,
    fontWeight: '600',
  },
});
}
