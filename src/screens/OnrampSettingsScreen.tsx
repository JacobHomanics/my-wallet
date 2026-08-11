import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
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
  const {
    options,
    selectedDestination,
    selectedDestinationId,
    setOnrampDestination,
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
          Choose the default asset and network Stripe should preselect when you
          open deposits.
        </Text>

        <View style={styles.section}>
          {options.map((option) => {
            const selected = option.id === selectedDestinationId;
            return (
              <Pressable
                key={option.id}
                accessibilityLabel={option.label}
                accessibilityRole="radio"
                accessibilityState={{ checked: selected }}
                onPress={() => {
                  setOnrampDestination(option.id);
                }}
                style={({ pressed }) => [
                  styles.optionRow,
                  selected && styles.optionRowSelected,
                  pressed && styles.optionRowPressed,
                ]}
              >
                <View style={styles.optionText}>
                  <Text style={styles.optionLabel}>{option.label}</Text>
                  <Text style={styles.optionDescription}>
                    {option.description}
                  </Text>
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

        <Text style={styles.note}>
          Current default: {selectedDestination.label}. Other supported choices
          may still be available inside Stripe if supported for your region.
        </Text>
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
  optionRowSelected: {
    borderColor: '#86efac',
    backgroundColor: '#f7fee7',
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
  note: {
    marginTop: 20,
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7d6a',
    textAlign: 'center',
  },
});
