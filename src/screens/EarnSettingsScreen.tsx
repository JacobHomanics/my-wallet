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
import { EligiblePaymentInfoModal } from '@/components/EligiblePaymentInfoModal';
import { IconButton } from '@/components/IconButton';
import { useAutoDepositSettings } from '@/hooks/useAutoDepositSettings';
import { useEarnPreview } from '@/hooks/useEarnPreview';
import { useEligiblePaymentInfoModal } from '@/hooks/useEligiblePaymentInfoModal';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToMoneySettings } from '@/hooks/usePopToMoneySettings';
import { useVaultSendSettings } from '@/hooks/useVaultSendSettings';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Vault auto-deposit and use-vault-balance preferences (opened from Settings).
 */
export function EarnSettingsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goMoneySettings = usePopToMoneySettings();
  const { isPreview } = useEarnPreview();
  const { infoOpen, openInfo, closeInfo } = useEligiblePaymentInfoModal();
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
              accessibilityLabel="Back to money settings"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goMoneySettings}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to money settings"
              onPress={goMoneySettings}
            />
          )}
          <View style={styles.topBarSpacer} />
        </View>

        <View style={styles.titleRow}>
          <Text style={styles.title}>Earn settings</Text>
          <IconButton
            accessibilityLabel="What is an eligible payment?"
            color={colors.textMuted}
            icon="help-circle-outline"
            iconSize={22}
            onPress={openInfo}
            size={40}
            style={styles.titleHelpButton}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.toggleRow}>
            <View style={styles.toggleText}>
              <Text style={styles.toggleLabel}>Vault Auto-deposit</Text>
              <Text style={styles.toggleDescription}>
                When you receive an eligible payment or deposit,
                automatically move it into your vault
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

          <View
            style={[styles.toggleRow, isPreview && styles.toggleRowDisabled]}
          >
            <View style={styles.toggleText}>
              <Text
                style={[
                  styles.toggleLabel,
                  isPreview && styles.toggleLabelDisabled,
                ]}
              >
                Use vault balance
              </Text>
              <Text
                style={[
                  styles.toggleDescription,
                  isPreview && styles.toggleDescriptionDisabled,
                ]}
              >
                When you make an eligible payment, automatically move money
                from your vault into your balance
              </Text>
            </View>
            <Switch
              accessibilityLabel="Use vault balance"
              disabled={isPreview || vaultSendLoading || vaultSendSaving}
              trackColor={{ false: '#bbf7d0', true: '#86efac' }}
              thumbColor={vaultSendEnabled ? '#166534' : '#f0fdf4'}
              ios_backgroundColor="#bbf7d0"
              value={isPreview ? false : vaultSendEnabled}
              onValueChange={(value) => {
                void setVaultSendEnabled(value);
              }}
            />
          </View>
        </View>
      </ScrollView>

      <EligiblePaymentInfoModal onClose={closeInfo} visible={infoOpen} />
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
    color: c.primary,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  titleHelpButton: {
    marginTop: 2,
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
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
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
    color: c.primary,
  },
  toggleDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textSubtle,
  },
  toggleRowDisabled: {
    opacity: 0.45,
  },
  toggleLabelDisabled: {
    color: c.textMuted,
  },
  toggleDescriptionDisabled: {
    color: c.textSubtle,
  },
});
}
