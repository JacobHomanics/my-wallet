import { useCallback, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
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
import { useFarcasterSearch } from '@/hooks/useFarcasterSearch';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useSendToContact } from '@/hooks/useSendToContact';
import { useSendWalletRecipient } from '@/hooks/useSendWalletRecipient';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Search Farcaster usernames or enter wallet addresses during send.
 */
export function SendAdvancedSearchScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const route = useRoute<RouteProp<HomeStackParamList, 'sendAdvancedSearch'>>();
  const { sendToContact } = useSendToContact();
  const [query, setQuery] = useState('');
  const { results, isSearching, showEmpty, errorMessage } =
    useFarcasterSearch(query);
  const {
    evmAddress,
    setEvmAddress,
    solanaAddress,
    setSolanaAddress,
    trimmedEvm,
    trimmedSolana,
    evmValid,
    solanaValid,
    canContinue,
  } = useSendWalletRecipient();

  const tokenId = route.params?.tokenId;
  const usdAmount = route.params?.usdAmount;

  const goBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('send', { tokenId, usdAmount });
  }, [navigation, tokenId, usdAmount]);

  const onContinueWallets = useCallback(() => {
    if (!canContinue) {
      return;
    }

    sendToContact(
      {
        identityId: null,
        evmAddress: trimmedEvm || null,
        solanaAddress: trimmedSolana || null,
        username: null,
        name: null,
        profilePhotoUrl: null,
      },
      { tokenId, usdAmount },
    );
  }, [
    canContinue,
    sendToContact,
    tokenId,
    trimmedEvm,
    trimmedSolana,
    usdAmount,
  ]);

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.flex}
      >
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
            <Text style={styles.topBarTitle}>Advanced search</Text>
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
            <Text style={styles.label}>Farcaster</Text>
            <TextInput
              accessibilityLabel="Search Farcaster username"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="off"
              onChangeText={setQuery}
              placeholder="Farcaster username"
              placeholderTextColor="#86a894"
              style={styles.input}
              value={query}
            />
            <Text style={styles.hint}>
              Search by Farcaster username to pay a verified wallet.
            </Text>

            {errorMessage ? (
              <Text style={styles.error}>{errorMessage}</Text>
            ) : null}

            {isSearching ? (
              <ActivityIndicator color="#166534" style={styles.loader} />
            ) : null}

            {results.length > 0 ? (
              <View style={styles.results}>
                {results.map((hit) => {
                  const selectable = hit.hasAddress;
                  return (
                    <Pressable
                      key={hit.fid}
                      accessibilityLabel={`Select ${hit.label}`}
                      accessibilityRole="button"
                      accessibilityState={{ disabled: !selectable }}
                      disabled={!selectable}
                      onPress={() => {
                        if (!selectable) {
                          return;
                        }
                        sendToContact(
                          {
                            identityId: null,
                            evmAddress: hit.evmAddress,
                            solanaAddress: hit.solanaAddress,
                            username: hit.username,
                            name: hit.displayName,
                            profilePhotoUrl: hit.pfpUrl,
                            isFarcaster: true,
                          },
                          { tokenId, usdAmount },
                        );
                      }}
                      style={({ pressed }) => [
                        styles.resultCard,
                        pressed && selectable && styles.resultCardPressed,
                        !selectable && styles.resultCardDisabled,
                      ]}
                    >
                      <Avatar
                        label={hit.label}
                        photoUrl={hit.pfpUrl}
                        seed={hit.username}
                        size={40}
                        showFarcasterBadge
                      />
                      <View style={styles.resultText}>
                        <Text style={styles.resultLabel}>{hit.label}</Text>
                        {!selectable ? (
                          <Text style={styles.resultDescription}>
                            No verified wallet
                          </Text>
                        ) : hit.displayName ? (
                          <Text style={styles.resultDescription}>
                            {hit.displayName}
                          </Text>
                        ) : null}
                      </View>
                      <Ionicons
                        name="chevron-forward"
                        size={18}
                        color="#86a894"
                      />
                    </Pressable>
                  );
                })}
              </View>
            ) : null}

            {showEmpty ? (
              <Text style={styles.empty}>No Farcaster users found.</Text>
            ) : null}

            <Text style={[styles.label, styles.walletsLabel]}>Wallets</Text>
            <Text style={styles.hint}>
              Paste an EVM and/or Solana address to continue.
            </Text>

            <View style={styles.walletCard}>
              <View style={styles.walletGroup}>
                <Text style={styles.fieldLabel}>EVM</Text>
                <TextInput
                  accessibilityLabel="EVM address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setEvmAddress}
                  placeholder="0x…"
                  placeholderTextColor="#86a894"
                  style={[
                    styles.walletInput,
                    trimmedEvm && !evmValid ? styles.inputError : null,
                  ]}
                  value={evmAddress}
                />
                {trimmedEvm && !evmValid ? (
                  <Text style={styles.error}>Enter a valid EVM address.</Text>
                ) : null}
              </View>

              <View style={styles.walletDivider} />

              <View style={styles.walletGroup}>
                <Text style={styles.fieldLabel}>Solana</Text>
                <TextInput
                  accessibilityLabel="Solana address"
                  autoCapitalize="none"
                  autoCorrect={false}
                  onChangeText={setSolanaAddress}
                  placeholder="Solana address"
                  placeholderTextColor="#86a894"
                  style={[
                    styles.walletInput,
                    trimmedSolana && !solanaValid ? styles.inputError : null,
                  ]}
                  value={solanaAddress}
                />
                {trimmedSolana && !solanaValid ? (
                  <Text style={styles.error}>
                    Enter a valid Solana address.
                  </Text>
                ) : null}
              </View>
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canContinue}
              onPress={onContinueWallets}
              style={({ pressed }) => [
                styles.continueButton,
                !canContinue && styles.continueButtonDisabled,
                pressed && canContinue && styles.continueButtonPressed,
              ]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  flex: {
    flex: 1,
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
    color: '#166534',
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
    color: '#166534',
  },
  body: {
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 10,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  walletsLabel: {
    marginTop: 24,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#166534',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b91c1c',
  },
  loader: {
    marginTop: 8,
  },
  results: {
    marginTop: 4,
    gap: 8,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  resultCardPressed: {
    opacity: 0.85,
    backgroundColor: '#f0fdf4',
  },
  resultCardDisabled: {
    opacity: 0.55,
  },
  resultText: {
    flex: 1,
    minWidth: 0,
    gap: 2,
  },
  resultLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  resultDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7d6a',
  },
  empty: {
    marginTop: 4,
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
  },
  walletCard: {
    marginTop: 4,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    overflow: 'hidden',
  },
  walletGroup: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  walletInput: {
    fontSize: 15,
    color: '#166534',
    paddingVertical: 4,
  },
  inputError: {
    color: '#b91c1c',
  },
  walletDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
    marginHorizontal: 16,
  },
  continueButton: {
    marginTop: 16,
    backgroundColor: '#166534',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  continueButtonDisabled: {
    opacity: 0.45,
  },
  continueButtonPressed: {
    opacity: 0.9,
  },
  continueButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#ffffff',
  },
});
