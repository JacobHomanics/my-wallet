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

import type { ChainPriorityId, ChainPriorityOption } from '@/lib/chainPriority';

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
            <Ionicons name="checkmark-circle" size={22} color="#166534" />
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
            <Ionicons name="close" size={22} color="#166534" />
          </Pressable>
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

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#d1fae5',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#166534',
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
  optionList: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    gap: 12,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: {
    borderColor: '#166534',
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
    color: '#166534',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#5a7d6a',
  },
  optionSpacer: {
    width: 22,
  },
});
