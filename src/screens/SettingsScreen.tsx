import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
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
import { ChainPriorityPickerModal } from '@/components/ChainPriorityPickerModal';
import { ConfirmLogoutModal } from '@/components/ConfirmLogoutModal';
import { DisplayCurrencyPickerModal } from '@/components/DisplayCurrencyPickerModal';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { useAutoDepositSettings } from '@/hooks/useAutoDepositSettings';
import { useVaultSendSettings } from '@/hooks/useVaultSendSettings';
import { useChainPriorityPicker } from '@/hooks/useChainPriorityPicker';
import { useConfirmSignOut } from '@/hooks/useConfirmSignOut';
import { useDisplayCurrencyPicker } from '@/hooks/useDisplayCurrencyPicker';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { usePopToProfile } from '@/hooks/usePopToProfile';
import { useStrategyPicker } from '@/hooks/useStrategyPicker';
import type { ProfileStackParamList } from '@/navigation/types';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const goProfile = usePopToProfile();
  const {
    confirmVisible: logoutConfirmVisible,
    isSigningOut,
    requestSignOut,
    cancelSignOut,
    confirmSignOut,
  } = useConfirmSignOut();
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
  const { selectedDestinationLabel } = useOnrampSettings();
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
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.content}>
          <View style={styles.topBar}>
            {isDesktopWeb ? (
              <Pressable
                accessibilityLabel="Back to profile"
                accessibilityRole="button"
                hitSlop={8}
                onPress={goProfile}
                style={({ pressed }) => [
                  styles.webBack,
                  pressed && styles.webBackPressed,
                ]}
              >
                <Text style={styles.webBackText}>Back</Text>
              </Pressable>
            ) : (
              <BackButton
                accessibilityLabel="Back to profile"
                onPress={goProfile}
              />
            )}
            <Text style={styles.topBarTitle}>Settings</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.sections}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <Pressable
                accessibilityLabel="Profile settings"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('profileSettings');
                }}
                style={({ pressed }) => [
                  styles.strategyRow,
                  pressed && styles.strategyRowPressed,
                ]}
              >
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>Profile settings</Text>
                  <Text style={styles.strategyDescription}>
                    Username and profile photo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#86a894" />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Onramp</Text>
              <Pressable
                accessibilityLabel="Onramp settings"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('onrampSettings');
                }}
                style={({ pressed }) => [
                  styles.strategyRow,
                  pressed && styles.strategyRowPressed,
                ]}
              >
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>Onramp settings</Text>
                  <Text style={styles.strategyDescription}>
                    Default destination: {selectedDestinationLabel}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color="#86a894" />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Earn</Text>
              <View style={styles.toggleRow}>
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>
                    Auto-deposit received USDC
                  </Text>
                  <Text style={styles.strategyDescription}>
                    When someone sends you USDC on Base, deposit it into your
                    vault automatically
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Auto-deposit received USDC"
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
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>
                    Use vault balance when sending
                  </Text>
                  <Text style={styles.strategyDescription}>
                    When a payment needs USDC on Base, withdraw from your vault
                    into your wallet automatically
                  </Text>
                </View>
                <Switch
                  accessibilityLabel="Use vault balance when sending"
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
                <Ionicons name="chevron-down" size={18} color="#86a894" />
              </Pressable>
            </View>

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
                  <Text style={styles.strategyLabel}>
                    {selectedStrategy.label}
                  </Text>
                  <Text style={styles.strategyDescription}>
                    {selectedStrategy.description}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#86a894" />
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
                <Ionicons name="chevron-down" size={18} color="#86a894" />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={requestSignOut}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
            >
              <Text style={styles.logoutButtonText}>Log out</Text>
            </Pressable>
          </View>
        </View>
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

      <ConfirmLogoutModal
        isSigningOut={isSigningOut}
        onCancel={cancelSignOut}
        onConfirm={() => {
          void confirmSignOut();
        }}
        visible={logoutConfirmVisible}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
  sections: {
    paddingHorizontal: 24,
    alignItems: 'center',
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
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  strategyRow: {
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
    color: '#166534',
  },
  strategyDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
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
  logoutButton: {
    width: '100%',
    maxWidth: 420,
    marginTop: 32,
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutButtonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
});
