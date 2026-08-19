import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { OnrampOptionPickerModal } from '@/components/OnrampOptionPickerModal';
import { PrivyIcon } from '@/components/PrivyIcon';
import { StripeIcon } from '@/components/StripeIcon';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { usePopToSettings } from '@/hooks/usePopToSettings';
import type { DepositMethodId } from '@/lib/stripe/depositMethods';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

function DepositProviderIcon({ id }: { id: DepositMethodId }) {
  if (id === 'stripe-embedded-components') {
    return <PrivyIcon size={28} />;
  }
  return <StripeIcon size={28} />;
}

/**
 * Choose which asset/network Stripe should preselect for new onramp sessions.
 */
export function OnrampSettingsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goSettings = usePopToSettings();
  const [networkPickerOpen, setNetworkPickerOpen] = useState(false);
  const [currencyPickerOpen, setCurrencyPickerOpen] = useState(false);
  const {
    networkOptions,
    currencyOptions,
    selectedNetwork,
    selectedNetworkId,
    selectedCurrency,
    selectedCurrencyId,
    providerOptions,
    selectedProviderId,
    setOnrampNetwork,
    setOnrampCurrency,
    setOnrampProvider,
  } = useOnrampSettings();

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

        <Text style={styles.title}>Onramp settings</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default provider</Text>
          {providerOptions.map((option) => {
            const selected = option.id === selectedProviderId;
            return (
              <Pressable
                key={option.id}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setOnrampProvider(option.id);
                }}
                style={({ pressed }) => [
                  styles.providerRow,
                  selected && styles.providerRowSelected,
                  pressed && styles.optionRowPressed,
                ]}
              >
                <DepositProviderIcon id={option.id} />
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                </View>
                <Ionicons
                  name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                  size={22}
                  color={selected ? '#166534' : '#86a894'}
                />
              </Pressable>
            );
          })}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Network</Text>
          <Pressable
            accessibilityLabel={`Onramp network ${selectedNetwork.label}`}
            accessibilityRole="button"
            onPress={() => {
              setNetworkPickerOpen(true);
            }}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            {selectedNetwork.iconUrl ? (
              <Image source={selectedNetwork.iconUrl} style={styles.optionIcon} />
            ) : null}
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{selectedNetwork.label}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.textSubtle} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Default currency</Text>
          <Pressable
            accessibilityLabel={`Onramp currency ${selectedCurrency.label}`}
            accessibilityRole="button"
            onPress={() => {
              setCurrencyPickerOpen(true);
            }}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            {selectedCurrency.iconUrl ? (
              <Image
                source={selectedCurrency.iconUrl}
                style={styles.optionIcon}
              />
            ) : null}
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{selectedCurrency.label}</Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.textSubtle} />
          </Pressable>
        </View>
      </ScrollView>

      <OnrampOptionPickerModal
        onClose={() => {
          setNetworkPickerOpen(false);
        }}
        onSelect={(option) => {
          setOnrampNetwork(option.id);
          setNetworkPickerOpen(false);
        }}
        options={networkOptions}
        selectedId={selectedNetworkId}
        title="Onramp network"
        visible={networkPickerOpen}
      />

      <OnrampOptionPickerModal
        onClose={() => {
          setCurrencyPickerOpen(false);
        }}
        onSelect={(option) => {
          setOnrampCurrency(option.id);
          setCurrencyPickerOpen(false);
        }}
        options={currencyOptions}
        selectedId={selectedCurrencyId}
        title={`${selectedNetwork.label} currency`}
        visible={currencyPickerOpen}
      />
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  optionRow: {
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
  optionRowPressed: {
    opacity: 0.85,
  },
  providerRow: {
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
  providerRowSelected: {
    borderColor: c.borderStrong,
    backgroundColor: c.surfaceMuted,
  },
  optionText: {
    flex: 1,
    minWidth: 0,
  },
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: c.bg,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
});
}
