import { useCallback, useEffect } from 'react';
import { Ionicons } from '@expo/vector-icons';
import {
  FlatList,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useDisplayCurrencyFilter } from '@/hooks/useDisplayCurrencyFilter';
import type {
  DisplayCurrencyId,
  DisplayCurrencyOption,
} from '@/lib/displayCurrency';

type DisplayCurrencyPickerModalProps = {
  visible: boolean;
  options: readonly DisplayCurrencyOption[];
  selectedDisplayCurrencyId: DisplayCurrencyId;
  onClose: () => void;
  onSelect: (option: DisplayCurrencyOption) => void;
};

/**
 * Page-sheet modal listing fiat display currency options.
 */
export function DisplayCurrencyPickerModal({
  visible,
  options,
  selectedDisplayCurrencyId,
  onClose,
  onSelect,
}: DisplayCurrencyPickerModalProps) {
  const insets = useSafeAreaInsets();
  const { query, setQuery, clearQuery, filteredOptions, hasActiveQuery } =
    useDisplayCurrencyFilter(options);

  useEffect(() => {
    if (!visible) {
      clearQuery();
    }
  }, [clearQuery, visible]);

  const renderOption = useCallback(
    ({ item }: { item: DisplayCurrencyOption }) => {
      const selected = item.id === selectedDisplayCurrencyId;
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
            <Text style={styles.optionLabel}>
              {item.label} ({item.code})
            </Text>
            <Text style={styles.optionDescription}>{item.description}</Text>
          </View>
          {selected ? (
            <Ionicons
              name="checkmark-circle"
              size={22}
              color="#D33D3D"
            />
          ) : (
            <View style={styles.optionSpacer} />
          )}
        </Pressable>
      );
    },
    [onSelect, selectedDisplayCurrencyId],
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
          <Text style={styles.modalTitle}>Display currency</Text>
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
            <Ionicons name="close" size={22} color="#D33D3D" />
          </Pressable>
        </View>

        <View style={styles.searchRow}>
          <Ionicons name="search" size={18} color="#9B5A5A" />
          <TextInput
            accessibilityLabel="Search display currencies"
            autoCapitalize="none"
            autoCorrect={false}
            onChangeText={setQuery}
            placeholder="Search by name or code"
            placeholderTextColor="#C37A7A"
            returnKeyType="search"
            style={styles.searchInput}
            value={query}
          />
          {hasActiveQuery ? (
            <Pressable
              accessibilityLabel="Clear search"
              accessibilityRole="button"
              hitSlop={8}
              onPress={clearQuery}
              style={({ pressed }) => [
                styles.clearSearchButton,
                pressed && styles.clearSearchButtonPressed,
              ]}
            >
          <Ionicons name="close-circle" size={18} color="#9B5A5A" />
            </Pressable>
          ) : null}
        </View>

        <FlatList
          contentContainerStyle={styles.optionList}
          data={[...filteredOptions]}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          ListEmptyComponent={
            <Text style={styles.empty}>
              No display currencies match <Text style={styles.emptyQuery}>{query.trim()}</Text>.
            </Text>
          }
          renderItem={renderOption}
        />
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  modalTopBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F5BFA9',
  },
  modalTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#D33D3D',
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
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginTop: 12,
    marginBottom: 4,
    paddingHorizontal: 14,
    gap: 10,
    borderWidth: 1,
    borderColor: '#F5BFA9',
    borderRadius: 12,
    backgroundColor: '#ffffff',
  },
  searchInput: {
    flex: 1,
    minHeight: 48,
    fontSize: 15,
    color: '#D33D3D',
  },
  clearSearchButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearSearchButtonPressed: {
    opacity: 0.7,
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
    borderColor: '#F5BFA9',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  optionSelected: {
    borderColor: '#D33D3D',
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
    color: '#D33D3D',
  },
  optionDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#9B5A5A',
  },
  optionSpacer: {
    width: 22,
  },
  empty: {
    paddingTop: 24,
    fontSize: 15,
    color: '#C37A7A',
    textAlign: 'center',
  },
  emptyQuery: {
    fontWeight: '600',
  },
});
