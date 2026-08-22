import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AppLayoutPickerModal } from '@/components/AppLayoutPickerModal';
import { BackButton } from '@/components/BackButton';
import { ColorThemePickerModal } from '@/components/ColorThemePickerModal';
import { DisplayCurrencyPickerModal } from '@/components/DisplayCurrencyPickerModal';
import { useAdvancedLayoutSectionToggles } from '@/hooks/useAdvancedLayoutSectionToggles';
import { useAppLayoutPicker } from '@/hooks/useAppLayoutPicker';
import { useColorThemePicker } from '@/hooks/useColorThemePicker';
import { useDisplayCurrencyPicker } from '@/hooks/useDisplayCurrencyPicker';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToSettings } from '@/hooks/usePopToSettings';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * App layout, display currency, and color theme settings grouped under appearance.
 */
export function AppearanceSettingsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goSettings = usePopToSettings();
  const {
    options: displayCurrencyOptions,
    selectedCurrency,
    selectedDisplayCurrencyId,
    pickerOpen: displayCurrencyPickerOpen,
    openPicker: openDisplayCurrencyPicker,
    closePicker: closeDisplayCurrencyPicker,
    onSelectOption: onSelectDisplayCurrency,
  } = useDisplayCurrencyPicker();
  const {
    options: appLayoutOptions,
    selectedLayout,
    selectedAppLayoutId,
    pickerOpen: appLayoutPickerOpen,
    openPicker: openAppLayoutPicker,
    closePicker: closeAppLayoutPicker,
    onSelectOption: onSelectAppLayout,
  } = useAppLayoutPicker();
  const { visible: showAdvancedSections, rows: advancedSectionRows } =
    useAdvancedLayoutSectionToggles();
  const {
    options: colorThemeOptions,
    selectedTheme,
    selectedColorThemeId,
    pickerOpen: colorThemePickerOpen,
    openPicker: openColorThemePicker,
    closePicker: closeColorThemePicker,
    onSelectOption: onSelectColorTheme,
  } = useColorThemePicker();

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

        <Text style={styles.title}>Appearance</Text>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Display currency</Text>
          <Pressable
            accessibilityLabel={`Display currency ${selectedCurrency.label}`}
            accessibilityRole="button"
            onPress={openDisplayCurrencyPicker}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>
                {selectedCurrency.label} ({selectedCurrency.code})
              </Text>
              <Text style={styles.optionDescription}>
                {selectedCurrency.description}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.textSubtle} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Color theme</Text>
          <Pressable
            accessibilityLabel={`Color theme ${selectedTheme.label}`}
            accessibilityRole="button"
            onPress={openColorThemePicker}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{selectedTheme.label}</Text>
              <Text style={styles.optionDescription}>
                {selectedTheme.description}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.textSubtle} />
          </Pressable>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App layout</Text>
          <Pressable
            accessibilityLabel={`App layout ${selectedLayout.label}`}
            accessibilityRole="button"
            onPress={openAppLayoutPicker}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{selectedLayout.label}</Text>
              <Text style={styles.optionDescription}>
                {selectedLayout.description}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={18} color={colors.textSubtle} />
          </Pressable>
          {showAdvancedSections ? (
            <View style={styles.advancedSections}>
              <Text style={styles.advancedSectionsTitle}>
                Advanced sections
              </Text>
              <Text style={styles.advancedSectionsHint}>
                Turn off any area you want to keep in the default layout.
              </Text>
              {advancedSectionRows.map((row) => (
                <View key={row.id} style={styles.toggleRow}>
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleLabel}>{row.label}</Text>
                    <Text style={styles.toggleDescription}>
                      {row.description}
                    </Text>
                  </View>
                  <Switch
                    accessibilityLabel={`${row.label} advanced layout`}
                    trackColor={{
                      false: colors.border,
                      true: colors.borderStrong,
                    }}
                    thumbColor={row.enabled ? colors.primary : colors.bg}
                    ios_backgroundColor={colors.border}
                    value={row.enabled}
                    onValueChange={row.onToggle}
                  />
                </View>
              ))}
            </View>
          ) : null}
        </View>


      </ScrollView>

      <DisplayCurrencyPickerModal
        onClose={closeDisplayCurrencyPicker}
        onSelect={onSelectDisplayCurrency}
        options={displayCurrencyOptions}
        selectedDisplayCurrencyId={selectedDisplayCurrencyId}
        visible={displayCurrencyPickerOpen}
      />

      <AppLayoutPickerModal
        onClose={closeAppLayoutPicker}
        onSelect={onSelectAppLayout}
        options={appLayoutOptions}
        selectedAppLayoutId={selectedAppLayoutId}
        visible={appLayoutPickerOpen}
      />

      <ColorThemePickerModal
        onClose={closeColorThemePicker}
        onSelect={onSelectColorTheme}
        options={colorThemeOptions}
        selectedColorThemeId={selectedColorThemeId}
        visible={colorThemePickerOpen}
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
      width: '100%',
      fontSize: 28,
      fontWeight: '700',
      color: c.primary,
      marginBottom: 24,
    },
    section: {
      width: '100%',
      marginBottom: 24,
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
    optionText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: c.primary,
    },
    optionDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textSubtle,
    },
    advancedSections: {
      gap: 12,
    },
    advancedSectionsTitle: {
      fontSize: 13,
      fontWeight: '600',
      color: c.textMuted,
      textTransform: 'uppercase',
      letterSpacing: 0.4,
    },
    advancedSectionsHint: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textSubtle,
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
  });
}
