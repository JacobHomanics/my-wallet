import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { ChainPriorityPickerModal } from '@/components/ChainPriorityPickerModal';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { SupportedChainsCollapsible } from '@/components/SupportedChainsCollapsible';
import { useChainPriorityPicker } from '@/hooks/useChainPriorityPicker';
import { appConfig } from '@/configs/app.config';
import { useDefaultCashboxNetwork } from '@/hooks/useDefaultCashboxNetwork';
import { useDefaultGasSponsorship } from '@/hooks/useDefaultGasSponsorship';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToMoneySettings } from '@/hooks/usePopToMoneySettings';
import { useStrategyPicker } from '@/hooks/useStrategyPicker';
import { REWARD_POINTS_LABEL } from '@/lib/rewardToken';

/**
 * Default send behavior: payment strategy, chain priority, and Cashbox Network.
 */
export function SendSettingsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goMoneySettings = usePopToMoneySettings();
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
  const { defaultCashboxNetwork, setDefaultCashboxNetwork } =
    useDefaultCashboxNetwork();
  const { defaultGasSponsorship, setDefaultGasSponsorship } =
    useDefaultGasSponsorship();
  const gasSponsorshipAvailable = appConfig.gasSponsorship;

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

        <Text style={styles.title}>Send settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default strategy</Text>
          <Pressable
            accessibilityLabel={`Default strategy ${selectedStrategy.label}`}
            accessibilityRole="button"
            onPress={openPicker}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{selectedStrategy.label}</Text>
              <Text style={styles.optionDescription}>
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
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{selectedChainPriority.label}</Text>
              <Text style={styles.optionDescription}>
                {selectedChainPriority.description}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#86a894" />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Send through Cashbox Network</Text>
          <View style={styles.toggleRow}>
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Default for new sends</Text>
              <Text style={styles.optionDescription}>
                {defaultCashboxNetwork
                  ? gasSponsorshipAvailable
                    ? `Earn ${REWARD_POINTS_LABEL} and gas sponsorship on supported chains`
                    : `Earn ${REWARD_POINTS_LABEL} on supported chains`
                  : `Signs on this device; no ${REWARD_POINTS_LABEL}${
                      gasSponsorshipAvailable ? ' or gas sponsorship' : ''
                    }`}
              </Text>
            </View>
            <Switch
              accessibilityLabel="Default send through Cashbox Network"
              trackColor={{ false: '#bbf7d0', true: '#86efac' }}
              thumbColor={defaultCashboxNetwork ? '#166534' : '#f0fdf4'}
              ios_backgroundColor="#bbf7d0"
              value={defaultCashboxNetwork}
              onValueChange={setDefaultCashboxNetwork}
            />
          </View>
        </View>

        {defaultCashboxNetwork && gasSponsorshipAvailable ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Gas sponsorship where available</Text>
            <View style={styles.toggleRow}>
              <View style={styles.optionText}>
                <Text style={styles.optionLabel}>Default for new sends</Text>
                <Text style={styles.optionDescription}>
                  {defaultGasSponsorship
                    ? 'App pays fees on supported chains'
                    : 'You pay network fees from your wallet on every chain'}
                </Text>
              </View>
              <Switch
                accessibilityLabel="Default gas sponsorship where available"
                trackColor={{ false: '#bbf7d0', true: '#86efac' }}
                thumbColor={defaultGasSponsorship ? '#166534' : '#f0fdf4'}
                ios_backgroundColor="#bbf7d0"
                value={defaultGasSponsorship}
                onValueChange={setDefaultGasSponsorship}
              />
            </View>
          </View>
        ) : null}

        <SupportedChainsCollapsible />
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flexGrow: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
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
    marginBottom: 8,
  },
  section: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
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
  optionRow: {
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
  optionRowPressed: {
    opacity: 0.85,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  optionDescription: {
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
});
