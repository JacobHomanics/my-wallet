import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useAutoDepositSettings } from '@/hooks/useAutoDepositSettings';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToSettings } from '@/hooks/usePopToSettings';
import { useVaultSendSettings } from '@/hooks/useVaultSendSettings';

/**
 * Vault auto-deposit and use-vault-balance preferences (opened from Settings).
 */
export function EarnSettingsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goSettings = usePopToSettings();
  const {
    enabled: autoDepositEnabled,
    setEnabled: setAutoDepositEnabled,
    isLoading: autoDepositLoading,
    isSaving: autoDepositSaving,
  } = useAutoDepositSettings();
  const {
    enabled: vaultSendEnabled,
    setEnabled: setVaultSendEnabled,
    isLoading: vaultSendLoading,
    isSaving: vaultSendSaving,
  } = useVaultSendSettings();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to settings"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goSettings}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to settings"
              onPress={goSettings}
            />
          )}
          <View style={styles.topBarSpacer} />
        </View>

        <Text style={styles.title}>Earn settings</Text>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Vault Auto-deposit</Text>
              <Text style={styles.toggleDescription}>
                When someone sends you an eligible payment, automatically move
                it into your vault
              </Text>
            </View>
            <Switch
              accessibilityLabel="Vault Auto-deposit"
              disabled={autoDepositLoading || autoDepositSaving}
              trackColor={{ false: '#bbf7d0', true: '#86efac' }}
              thumbColor={autoDepositEnabled ? '#166534' : '#f0fdf4'}
              ios_backgroundColor="#bbf7d0"
              value={autoDepositEnabled}
              onValueChange={(value) => {
                void setAutoDepositEnabled(value);
              }}
            />
          </View>

          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Use vault balance</Text>
              <Text style={styles.toggleDescription}>
                When you make an eligible payment, automatically move money
                from your vault into your balance
              </Text>
            </View>
            <Switch
              accessibilityLabel="Use vault balance"
              disabled={vaultSendLoading || vaultSendSaving}
              trackColor={{ false: '#bbf7d0', true: '#86efac' }}
              thumbColor={vaultSendEnabled ? '#166534' : '#f0fdf4'}
              ios_backgroundColor="#bbf7d0"
              value={vaultSendEnabled}
              onValueChange={(value) => {
                void setVaultSendEnabled(value);
              }}
            />
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topBarSpacer: {
    flex: 1,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  toggleRow: {
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
  toggleText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
});
