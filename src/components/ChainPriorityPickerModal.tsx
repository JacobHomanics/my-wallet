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
import type { ChainPriorityId, ChainPriorityOption } from '@/lib/chainPriority';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type ChainPriorityPickerModalProps = {
  visible: boolean;
  options: readonly ChainPriorityOption[];
  selectedChainPriorityId: ChainPriorityId;
  onClose: () => void;
  onSelect: (option: ChainPriorityOption) => void;
};

/**
 * Page-sheet modal listing EVM vs Solana priority options.
 */
export function ChainPriorityPickerModal({
  visible,
  options,
  selectedChainPriorityId,
  onClose,
  onSelect,
}: ChainPriorityPickerModalProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();

  const renderOption = useCallback(
    ({ item }: { item: ChainPriorityOption }) => {
      const selected = item.id === selectedChainPriorityId;
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
    [onSelect, selectedChainPriorityId],
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
          <Text style={styles.modalTitle}>Chain priority</Text>
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
