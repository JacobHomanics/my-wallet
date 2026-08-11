import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { OnrampOptionPickerModal } from '@/components/OnrampOptionPickerModal';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { usePopToSettings } from '@/hooks/usePopToSettings';

/**
 * Choose which asset/network Stripe should preselect for new onramp sessions.
 */
export function OnrampSettingsScreen() {
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
    selectedDestinationLabel,
    setOnrampNetwork,
    setOnrampCurrency,
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
        <Text style={styles.subtitle}>
          Choose a default network first, then pick the onramp currency you want
          Stripe to preselect on that network.
        </Text>

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
              <Text style={styles.optionDescription}>
                {selectedNetwork.description}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#C37A7A" />
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
              <Text style={styles.optionDescription}>
                {selectedCurrency.description}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color="#C37A7A" />
          </Pressable>
        </View>

        <Text style={styles.note}>
          Current default: {selectedDestinationLabel}. Other supported choices
          may still be available inside Stripe if supported for your region.
        </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
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
    color: '#D33D3D',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#D33D3D',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#3f6b52',
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
    color: '#9B5A5A',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#F5BFA9',
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
  optionIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#FFF4E6',
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#D33D3D',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#C37A7A',
  },
  note: {
    marginTop: 20,
    fontSize: 13,
    lineHeight: 18,
    color: '#9B5A5A',
    textAlign: 'center',
  },
});
