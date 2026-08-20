import { useState } from 'react';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
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
import { useTier1Identity } from '@/hooks/useTier1Identity';
import type { Tier1ProtocolId } from '@/lib/identityProtocols';
import { isTier1ProtocolId } from '@/lib/identityProtocols';
import type { ContactsStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type ExternalIdentityRoute = RouteProp<
  ContactsStackParamList,
  | 'newBasenameContact'
  | 'newLensContact'
  | 'newSnsContact'
  | 'newNostrContact'
>;

function routeProtocol(route: ExternalIdentityRoute): Tier1ProtocolId {
  switch (route.name) {
    case 'newBasenameContact':
      return 'basename';
    case 'newLensContact':
      return 'lens';
    case 'newSnsContact':
      return 'sns';
    case 'newNostrContact':
      return 'nostr';
    default:
      return 'basename';
  }
}

export function ExternalIdentityContactScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goContacts = usePopToContacts();
  const navigation =
    useNavigation<NativeStackNavigationProp<ContactsStackParamList>>();
  const route = useRoute<ExternalIdentityRoute>();
  const protocol = routeProtocol(route);
  const [query, setQuery] = useState('');
  const { results, isSearching, showEmpty, errorMessage, config } =
    useTier1Identity(protocol, query);
  const { addTier1Identity, isAdding, errorMessage: addError } = useAddContact();

  const goBack = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.navigate('newContact');
  };

  if (!isTier1ProtocolId(protocol)) {
    return null;
  }

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
          <Text style={styles.topBarTitle}>{config.title}</Text>
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
          <Text style={styles.label}>Search</Text>
          <TextInput
            accessibilityLabel={`Search ${config.title}`}
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="off"
            editable={!isAdding}
            onChangeText={setQuery}
            placeholder={config.placeholder}
            placeholderTextColor="#86a894"
            style={styles.input}
            value={query}
          />
          <Text style={styles.hint}>{config.hint}</Text>

          {addError ? <Text style={styles.error}>{addError}</Text> : null}
          {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

          {isSearching || isAdding ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : null}

          {results.length > 0 ? (
            <View style={styles.results}>
              {results.map((hit) => (
                <Pressable
                  key={`${hit.protocol}:${hit.label}`}
                  accessibilityLabel={`Add ${hit.label}`}
                  accessibilityRole="button"
                  disabled={isAdding || !hit.hasAddress}
                  onPress={() => {
                    void (async () => {
                      if (!hit.hasAddress) {
                        return;
                      }
                      const ok = await addTier1Identity(hit);
                      if (ok) {
                        goContacts();
                      }
                    })();
                  }}
                  style={({ pressed }) => [
                    styles.resultCard,
                    pressed && styles.resultCardPressed,
                    (isAdding || !hit.hasAddress) && styles.resultCardDisabled,
                  ]}
                >
                  <Avatar
                    label={hit.label}
                    photoUrl={hit.avatarUrl}
                    seed={hit.label}
                    size={40}
                    identityBadge={hit.protocol}
                  />
                  <View style={styles.resultText}>
                    <Text style={styles.resultLabel}>{hit.label}</Text>
                    {!hit.hasAddress ? (
                      <Text style={styles.resultDescription}>No wallet</Text>
                    ) : hit.displayName ? (
                      <Text style={styles.resultDescription}>
                        {hit.displayName}
                      </Text>
                    ) : null}
                  </View>
                </Pressable>
              ))}
            </View>
          ) : null}

          {showEmpty ? (
            <Text style={styles.empty}>{config.emptyMessage}</Text>
          ) : null}
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: c.bg },
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
    topBarSpacer: { width: 44 },
    webBack: {
      minWidth: 44,
      paddingHorizontal: 8,
      paddingVertical: 10,
      justifyContent: 'center',
    },
    webBackPressed: { opacity: 0.7 },
    webBackText: { fontSize: 16, fontWeight: '600', color: c.primary },
    body: { paddingHorizontal: 24, paddingTop: 16, gap: 10 },
    label: {
      fontSize: 14,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.6,
    },
    input: {
      width: '100%',
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.rowBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      color: c.primary,
    },
    hint: { fontSize: 13, lineHeight: 18, color: c.textSubtle },
    error: { fontSize: 13, lineHeight: 18, color: c.danger },
    loader: { marginTop: 16 },
    results: { marginTop: 12, gap: 8 },
    resultCard: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.rowBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    resultCardPressed: { opacity: 0.85, backgroundColor: c.bg },
    resultCardDisabled: { opacity: 0.55 },
    resultText: { flex: 1, minWidth: 0 },
    resultLabel: { fontSize: 16, fontWeight: '600', color: c.primary },
    resultDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textSubtle,
      marginTop: 2,
    },
    empty: {
      marginTop: 16,
      fontSize: 15,
      color: c.textSubtle,
      textAlign: 'center',
    },
  });
}
