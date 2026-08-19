import { useCallback, useMemo } from 'react';
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

import { TokenChainSection } from '@/components/TokenChainSection';
import { useExpandedNetworks } from '@/hooks/useExpandedNetworks';
import { useTokensByChain } from '@/hooks/useTokensByChain';
import type {
  OwnedToken,
  TokenChainGroup,
} from '@/lib/alchemy/fetchTokensByAddress';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

type TokenPickerModalProps = {
  visible: boolean;
  tokens: OwnedToken[];
  /** Token ids already in the payment — hidden from the list. */
  excludeTokenIds?: readonly string[];
  onClose: () => void;
  onSelect: (tokenId: string) => void;
};

/**
 * Page-sheet modal for picking a wallet token, grouped by collapsible chain.
 */
export function TokenPickerModal({
  visible,
  tokens,
  excludeTokenIds = [],
  onClose,
  onSelect,
}: TokenPickerModalProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const excluded = useMemo(() => new Set(excludeTokenIds), [excludeTokenIds]);

  const available = useMemo(
    () =>
      tokens.filter(
        (token) => token.rawBalance > 0n && !excluded.has(token.id),
      ),
    [excluded, tokens],
  );

  const chainGroups = useTokensByChain(available);
  const { expandedNetworks, isExpanded, toggleNetwork } = useExpandedNetworks();

  const renderChainSection = useCallback(
    ({ item }: { item: TokenChainGroup }) => (
      <TokenChainSection
        group={item}
        expanded={isExpanded(item.network)}
        expandedNetworks={expandedNetworks}
        onToggle={() => {
          toggleNetwork(item.network);
        }}
        onToggleNetwork={toggleNetwork}
        onTokenPress={onSelect}
      />
    ),
    [expandedNetworks, isExpanded, onSelect, toggleNetwork],
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
          <Text style={styles.modalTitle}>Add token</Text>
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
            <Ionicons name="close" size={22} color={colors.primary} />
          </Pressable>
        </View>

        <FlatList
          contentContainerStyle={
            chainGroups.length === 0 ? styles.listEmpty : styles.list
          }
          data={chainGroups}
          keyExtractor={(item) => item.network}
          ListEmptyComponent={
            <Text style={styles.empty}>No more tokens to add.</Text>
          }
          renderItem={renderChainSection}
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
  modalClose: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalClosePressed: {
    opacity: 0.6,
  },
  list: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 20,
  },
  listEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  empty: {
    fontSize: 15,
    color: c.textSubtle,
    textAlign: 'center',
  },
});
}
