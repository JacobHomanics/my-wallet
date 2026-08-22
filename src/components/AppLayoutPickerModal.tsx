import { useCallback } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { IconButton } from '@/components/IconButton';
import type { AppLayoutId, AppLayoutOption } from '@/lib/appLayout';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type AppLayoutPickerModalProps = {
  visible: boolean;
  options: readonly AppLayoutOption[];
  selectedAppLayoutId: AppLayoutId;
  onClose: () => void;
  onSelect: (option: AppLayoutOption) => void;
};

/**
 * Page-sheet modal listing Default vs Advanced app layout options.
 */
export function AppLayoutPickerModal({
  visible,
  options,
  selectedAppLayoutId,
  onClose,
  onSelect,
}: AppLayoutPickerModalProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();

  const renderOption = useCallback(
    ({ item }: { item: AppLayoutOption }) => {
      const selected = item.id === selectedAppLayoutId;
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
    [
      colors.primary,
      onSelect,
      selectedAppLayoutId,
      styles.option,
      styles.optionDescription,
      styles.optionLabel,
      styles.optionPressed,
      styles.optionSelected,
      styles.optionSpacer,
      styles.optionText,
    ],
  );

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <View
        style={[
          styles.modalContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        <View style={styles.modalTopBar}>
          <Text style={styles.modalTitle}>App layout</Text>
          <IconButton
            accessibilityLabel="Close"
            icon="close"
            iconSize={22}
            onPress={onClose}
            size={40}
          />
        </View>

        <FlatList
          contentContainerStyle={styles.optionList}
          data={[...options]}
          keyExtractor={(item) => item.id}
          renderItem={renderOption}
        />
      </View>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    modalContainer: {
      flex: 1,
      backgroundColor: c.bg,
    },
    modalTopBar: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      paddingHorizontal: 16,
      paddingBottom: 12,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: c.rowBorder,
    },
    modalTitle: {
      flex: 1,
      textAlign: 'center',
      fontSize: 17,
      fontWeight: '600',
      color: c.primary,
      paddingLeft: 40,
    },
    optionList: {
      paddingHorizontal: 16,
      paddingVertical: 16,
      gap: 12,
    },
    option: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 12,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.rowBorder,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 14,
    },
    optionSelected: {
      borderColor: c.primary,
    },
    optionPressed: {
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
      color: c.textMuted,
    },
    optionSpacer: {
      width: 22,
    },
  });
}
