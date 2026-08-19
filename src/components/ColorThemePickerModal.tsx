import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {StyleSheet, 
  FlatList,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeColors } from '@/hooks/useThemeColors';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { COLOR_THEMES } from '@/theme/themes';
import type { ColorThemeId, ColorThemeOption } from '@/theme/types';
import type { ThemeColors } from '@/theme/types';

type ColorThemePickerModalProps = {
  visible: boolean;
  options: readonly ColorThemeOption[];
  selectedColorThemeId: ColorThemeId;
  onClose: () => void;
  onSelect: (option: ColorThemeOption) => void;
};

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: c.primaryOverlay,
      justifyContent: 'flex-end' as const,
    },
    sheet: {
      backgroundColor: c.surface,
      borderTopLeftRadius: 16,
      borderTopRightRadius: 16,
      maxHeight: '70%' as const,
    },
    header: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      justifyContent: 'space-between' as const,
      paddingHorizontal: 20,
      paddingVertical: 16,
      borderBottomWidth: 1,
      borderBottomColor: c.rowBorder,
    },
    title: {
      fontSize: 17,
      fontWeight: '600' as const,
      color: c.primary,
    },
    closeButton: {
      padding: 4,
    },
    list: {
      paddingHorizontal: 16,
      paddingTop: 8,
    },
    option: {
      flexDirection: 'row' as const,
      alignItems: 'center' as const,
      gap: 12,
      paddingHorizontal: 12,
      paddingVertical: 14,
      borderRadius: 12,
      marginBottom: 4,
    },
    optionSelected: {
      backgroundColor: c.surfaceMuted,
    },
    optionPressed: {
      opacity: 0.85,
    },
    swatchRow: {
      flexDirection: 'row' as const,
      gap: 4,
    },
    swatch: {
      width: 16,
      height: 16,
      borderRadius: 4,
    },
    optionText: {
      flex: 1,
      minWidth: 0,
      gap: 2,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600' as const,
      color: c.primary,
    },
    optionDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textSubtle,
    },
    optionSpacer: {
      width: 22,
    },
  });
}

/**
 * Page-sheet modal listing color theme options.
 */
export function ColorThemePickerModal({
  visible,
  options,
  selectedColorThemeId,
  onClose,
  onSelect,
}: ColorThemePickerModalProps) {
  const insets = useSafeAreaInsets();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const renderOption = useCallback(
    ({ item }: { item: ColorThemeOption }) => {
      const selected = item.id === selectedColorThemeId;
      const themeColors = COLOR_THEMES[item.id as ColorThemeId];

      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => {
            onSelect(item);
          }}
          style={({ pressed }) => [
            styles.option,
            selected && styles.optionSelected,
            pressed && styles.optionPressed,
          ]}
        >
          <View style={styles.swatchRow}>
            <View style={[styles.swatch, { backgroundColor: themeColors.bg }]} />
            <View
              style={[styles.swatch, { backgroundColor: themeColors.surfaceMuted }]}
            />
            <View
              style={[styles.swatch, { backgroundColor: themeColors.primary }]}
            />
          </View>
          <View style={styles.optionText}>
            <Text style={styles.optionLabel}>{item.label}</Text>
            <Text style={styles.optionDescription}>{item.description}</Text>
          </View>
          {selected ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          ) : (
            <View style={styles.optionSpacer} />
          )}
        </Pressable>
      );
    },
    [colors.primary, onSelect, selectedColorThemeId, styles],
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      transparent
      visible={visible}
    >
      <Pressable accessibilityRole="button" onPress={onClose} style={styles.backdrop}>
        <Pressable
          onPress={(event) => {
            event.stopPropagation();
          }}
          style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}
        >
          <View style={styles.header}>
            <Text style={styles.title}>Color theme</Text>
            <Pressable
              accessibilityLabel="Close"
              accessibilityRole="button"
              hitSlop={8}
              onPress={onClose}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={22} color={colors.primary} />
            </Pressable>
          </View>
          <FlatList
            contentContainerStyle={styles.list}
            data={options as ColorThemeOption[]}
            keyExtractor={(item) => item.id}
            renderItem={renderOption}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
