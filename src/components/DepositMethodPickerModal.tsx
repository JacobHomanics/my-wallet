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

import { PrivyIcon } from '@/components/PrivyIcon';
import { StripeIcon } from '@/components/StripeIcon';
import {
  DEPOSIT_METHODS,
  type DepositMethodId,
  type DepositMethodOption,
} from '@/lib/stripe/depositMethods';

type DepositMethodPickerModalProps = {
  visible: boolean;
  defaultMethod: DepositMethodOption;
  onClose: () => void;
  onSelect: (method: DepositMethodOption) => void;
};

function DepositMethodIcon({ id }: { id: DepositMethodId }) {
  if (id === 'stripe-embedded-components') {
    return <PrivyIcon size={36} />;
  }
  return <StripeIcon size={36} />;
}

/**
 * Page-sheet modal for choosing a deposit onramp provider.
 */
export function DepositMethodPickerModal({
  visible,
  defaultMethod,
  onClose,
  onSelect,
}: DepositMethodPickerModalProps) {
  const insets = useSafeAreaInsets();
  const otherMethods = DEPOSIT_METHODS.filter(
    (method) => method.id !== defaultMethod.id,
  );

  const renderMethod = useCallback(
    ({ item }: { item: DepositMethodOption }) => (
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          onSelect(item);
        }}
        style={({ pressed }) => [
          styles.option,
          pressed && styles.optionPressed,
        ]}
      >
        <DepositMethodIcon id={item.id} />
        <View style={styles.optionText}>
          <Text style={styles.optionLabel}>{item.label}</Text>
          <Text style={styles.optionDescription}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#166534" />
      </Pressable>
    ),
    [onSelect],
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
          <Text style={styles.modalTitle}>Deposit with</Text>
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

        <View style={styles.defaultSection}>
          <Text style={styles.sectionTitle}>Default provider</Text>
          <Pressable
            accessibilityRole="button"
            onPress={() => {
              onSelect(defaultMethod);
            }}
            style={({ pressed }) => [
              styles.option,
              styles.defaultOption,
              pressed && styles.optionPressed,
            ]}
          >
            <DepositMethodIcon id={defaultMethod.id} />
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>{defaultMethod.label}</Text>
              <Text style={styles.optionDescription}>
                {defaultMethod.description}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#166534" />
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={styles.optionList}
          data={otherMethods}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            otherMethods.length > 0 ? (
              <Text style={styles.sectionTitle}>Other providers</Text>
            ) : null
          }
          renderItem={renderMethod}
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
  defaultSection: {
    paddingHorizontal: 16,
    paddingTop: 16,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    marginBottom: 12,
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
  optionPressed: {
    opacity: 0.85,
  },
  defaultOption: {
    borderColor: '#86efac',
    backgroundColor: '#f7fee7',
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
});
