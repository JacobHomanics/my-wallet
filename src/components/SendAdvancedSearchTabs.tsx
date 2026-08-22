import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useAppBrand } from '@/hooks/useAppBrand';
import type { SendSearchTabId } from '@/hooks/useSendAdvancedSearchTab';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

type SendAdvancedSearchTabsProps = {
  selectedTab?: SendSearchTabId;
  onSelect: (tab: SendSearchTabId) => void;
  style?: StyleProp<ViewStyle>;
};

/**
 * Segmented ZitiCashbox / Farcaster / ENS / Wallets control for send search.
 */
export function SendAdvancedSearchTabs({
  selectedTab,
  onSelect,
  style,
}: SendAdvancedSearchTabsProps) {
  const { name } = useAppBrand();
  const styles = useThemedStyles(createStyles);
  const tabs: { id: SendSearchTabId; label: string }[] = [
    { id: 'zitiCashbox', label: name },
    { id: 'farcaster', label: 'Farcaster' },
    { id: 'ens', label: 'ENS' },
    { id: 'wallets', label: 'Wallets' },
  ];

  return (
    <View style={[styles.tabs, style]}>
      {tabs.map((tab) => {
        const selected = tab.id === selectedTab;
        return (
          <Pressable
            key={tab.id}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            onPress={() => {
              onSelect(tab.id);
            }}
            style={[styles.tabChip, selected && styles.tabChipSelected]}
          >
            <Text
              style={[styles.tabChipText, selected && styles.tabChipTextSelected]}
            >
              {tab.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    tabs: {
      flexDirection: 'row',
      marginHorizontal: 24,
      marginTop: 8,
      marginBottom: 8,
      padding: 4,
      gap: 4,
      backgroundColor: c.surfaceMuted,
      borderRadius: 12,
    },
    tabChip: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      paddingVertical: 10,
      paddingHorizontal: 6,
      borderRadius: 10,
    },
    tabChipSelected: {
      backgroundColor: c.surface,
    },
    tabChipText: {
      fontSize: 12,
      fontWeight: '600',
      lineHeight: 14,
      color: c.textMuted,
      textAlign: 'center',
    },
    tabChipTextSelected: {
      color: c.primary,
    },
  });
}
