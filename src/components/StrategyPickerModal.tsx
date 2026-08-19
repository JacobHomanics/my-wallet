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
import type { PaymentStrategy, PaymentStrategyId } from '@/lib/strategies';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

type StrategyPickerModalProps = {
  visible: boolean;
  strategies: readonly PaymentStrategy[];
  selectedStrategyId: PaymentStrategyId;
  onClose: () => void;
  onSelect: (strategy: PaymentStrategy) => void;
};

/**
 * Page-sheet modal listing payment strategies for selection.
 */
export function StrategyPickerModal({
  visible,
  strategies,
  selectedStrategyId,
  onClose,
  onSelect,
}: StrategyPickerModalProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();

  const renderStrategy = useCallback(
    ({ item }: { item: PaymentStrategy }) => {
      const selected = item.id === selectedStrategyId;
      return (
        <Pressable
          accessibilityRole="button"
          accessibilityState={{ selected }}
          onPress={() => {
            onSelect(item);
          }}
          style={({ pressed }) => [
            styles.strategyOption,
            selected && styles.strategyOptionSelected,
            pressed && styles.strategyOptionPressed,
          ]}
        >
          <View style={styles.strategyOptionText}>
            <Text style={styles.strategyOptionLabel}>{item.label}</Text>
            <Text style={styles.strategyOptionDescription}>
              {item.description}
            </Text>
          </View>
          {selected ? (
            <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
          ) : (
            <View style={styles.strategyOptionSpacer} />
          )}
        </Pressable>
      );
    },
    [onSelect, selectedStrategyId],
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
          <Text style={styles.modalTitle}>Select strategy</Text>
          <IconButton
            accessibilityLabel="Close"
            icon="close"
            iconSize={22}
            onPress={onClose}
            size={40}
          />
        </View>

        <FlatList
          contentContainerStyle={styles.strategyList}
          data={[...strategies]}
          keyExtractor={(item) => item.id}
          renderItem={renderStrategy}
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
  strategyList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  strategyOption: {
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
  strategyOptionSelected: {
    borderColor: c.primary,
  },
  strategyOptionPressed: {
    opacity: 0.85,
  },
  strategyOptionText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  strategyOptionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
  strategyOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textMuted,
  },
  strategyOptionSpacer: {
    width: 22,
  },
});
}
