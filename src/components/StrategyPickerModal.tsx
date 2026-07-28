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

import type { PaymentStrategy, PaymentStrategyId } from '@/lib/strategies';

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
            <Ionicons name="checkmark-circle" size={22} color="#0f172a" />
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
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.modalClose,
              pressed && styles.modalClosePressed,
            ]}
          >
            <Ionicons name="close" size={22} color="#0f172a" />
          </Pressable>
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e2e8f0',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
    paddingLeft: 40,
  },
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClosePressed: {
    opacity: 0.6,
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
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  strategyOptionSelected: {
    borderColor: '#0f172a',
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
    color: '#0f172a',
  },
  strategyOptionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
  strategyOptionSpacer: {
    width: 22,
  },
});
