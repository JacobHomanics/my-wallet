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

import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import type { DepositMethodOption } from '@/lib/privy/onramp';

type DepositMethodPickerModalProps = {
  visible: boolean;
  methods: readonly DepositMethodOption[];
  disabled?: boolean;
  onClose: () => void;
  onSelect: (option: DepositMethodOption) => void;
};

/**
 * Deposit method picker: centered dialog on desktop web, page sheet otherwise.
 */
export function DepositMethodPickerModal({
  visible,
  methods,
  disabled = false,
  onClose,
  onSelect,
}: DepositMethodPickerModalProps) {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();

  const renderMethod = useCallback(
    ({ item }: { item: DepositMethodOption }) => (
      <Pressable
        accessibilityRole="button"
        disabled={disabled}
        onPress={() => {
          onSelect(item);
        }}
        style={({ pressed }) => [
          styles.option,
          pressed && styles.optionPressed,
          disabled && styles.optionDisabled,
        ]}
      >
        <View style={styles.optionIcon}>
          <Ionicons name={item.icon} size={22} color="#0f172a" />
        </View>
        <View style={styles.optionText}>
          <Text style={styles.optionLabel}>{item.label}</Text>
          <Text style={styles.optionDescription}>{item.description}</Text>
        </View>
        <Ionicons name="chevron-forward" size={18} color="#94a3b8" />
      </Pressable>
    ),
    [disabled, onSelect],
  );

  const header = (
    <View style={styles.modalTopBar}>
      <Text style={styles.modalTitle}>Deposit</Text>
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
  );

  const body = (
    <>
      <Text style={styles.subtitle}>
        Choose how to buy Base USDC into your wallet.
      </Text>
      <FlatList
        contentContainerStyle={styles.optionList}
        data={[...methods]}
        keyExtractor={(item) => item.id}
        renderItem={renderMethod}
        scrollEnabled={!isDesktopWeb}
      />
    </>
  );

  if (isDesktopWeb) {
    return (
      <Modal
        animationType="fade"
        onRequestClose={onClose}
        transparent
        visible={visible}
      >
        <View style={styles.desktopBackdrop}>
          <Pressable
            accessibilityLabel="Dismiss deposit options"
            accessibilityRole="button"
            onPress={onClose}
            style={StyleSheet.absoluteFill}
          />
          <View style={styles.desktopCard}>
            {header}
            {body}
          </View>
        </View>
      </Modal>
    );
  }

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={visible}
    >
      <View
        style={[
          styles.sheetContainer,
          { paddingTop: Math.max(insets.top, 12) },
        ]}
      >
        {header}
        {body}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  sheetContainer: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  desktopBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  desktopCard: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#f8fafc',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#0f172a',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
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
  subtitle: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 4,
    fontSize: 14,
    lineHeight: 20,
    color: '#64748b',
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
    borderColor: '#e2e8f0',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionPressed: {
    opacity: 0.85,
  },
  optionDisabled: {
    opacity: 0.6,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0f172a',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#64748b',
  },
});
