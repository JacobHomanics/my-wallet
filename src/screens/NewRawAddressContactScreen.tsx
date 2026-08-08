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

import { BackButton } from '@/components/BackButton';
import { useAddContact } from '@/hooks/useAddContact';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useNewContactAdvanced } from '@/hooks/useNewContactAdvanced';
import { usePopToContacts } from '@/hooks/usePopToContacts';
import type { HomeStackParamList } from '@/navigation/types';

/**
 * Add an external contact by name and EVM/Solana addresses.
 */
export function NewRawAddressContactScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goContacts = usePopToContacts();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { addAddresses, isAdding, errorMessage } = useAddContact();
  const {
    name,
    setName,
    trimmedName,
    evmAddress,
    setEvmAddress,
    solanaAddress,
    setSolanaAddress,
    canSubmit,
    evmValid,
    solanaValid,
    trimmedEvm,
    trimmedSolana,
  } = useNewContactAdvanced();

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
                placeholder="Name"
                placeholderTextColor="#86a894"
                style={styles.input}
                value={name}
              />
            </View>

            <View style={styles.divider} />

            <View style={styles.group}>
              <Text style={styles.fieldLabel}>EVM</Text>
              <TextInput
                accessibilityLabel="EVM address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isAdding}
                onChangeText={setEvmAddress}
                placeholder="0x…"
                placeholderTextColor="#86a894"
                style={[
                  styles.input,
                  trimmedEvm && !evmValid ? styles.inputError : null,
                ]}
                value={evmAddress}
              />
              {trimmedEvm && !evmValid ? (
                <Text style={styles.error}>Enter a valid EVM address.</Text>
              ) : null}
            </View>

            <View style={styles.divider} />

            <View style={styles.group}>
              <Text style={styles.fieldLabel}>Solana</Text>
              <TextInput
                accessibilityLabel="Solana address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isAdding}
                onChangeText={setSolanaAddress}
                placeholder="Solana address"
                placeholderTextColor="#86a894"
                style={[
                  styles.input,
                  trimmedSolana && !solanaValid ? styles.inputError : null,
                ]}
                value={solanaAddress}
              />
              {trimmedSolana && !solanaValid ? (
                <Text style={styles.error}>Enter a valid Solana address.</Text>
              ) : null}
            </View>

            <Pressable
              accessibilityRole="button"
              disabled={!canSubmit || isAdding}
              onPress={() => {
                void (async () => {
                  const ok = await addAddresses({
                    name: trimmedName,
                    evmAddress: trimmedEvm || undefined,
                    solanaAddress: trimmedSolana || undefined,
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
                <ActivityIndicator color="#f0fdf4" />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b91c1c',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
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
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  input: {
    width: '100%',
    backgroundColor: '#f0fdf4',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#166534',
  },
  inputError: {
    borderColor: '#fca5a5',
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
  },
  addButton: {
    marginTop: 4,
    backgroundColor: '#166534',
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
    color: '#f0fdf4',
    fontSize: 15,
    fontWeight: '600',
  },
});
