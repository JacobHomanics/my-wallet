import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import {
  SendConfigurationFields,
  SendTokenAllocations,
  type SendAdvancedDetailsProps,
} from '@/components/SendAdvancedDetails';
import { SendAdvancedDetailsCollapsible } from '@/components/SendAdvancedDetailsCollapsible';
import { useSendConfiguration } from '@/hooks/useSendConfiguration';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export type SendConfigurationCollapsibleProps = SendAdvancedDetailsProps & {
  style?: StyleProp<ViewStyle>;
  /** When false, only broadcast / sponsorship fields are shown. */
  includeTokenAllocations?: boolean;
};

/**
 * Outer “Configuration” collapsible with nested “Show advanced details” for
 * token allocation legs.
 */
export function SendConfigurationCollapsible({
  style,
  includeTokenAllocations = true,
  broadcastMode,
  onBroadcastModeChange,
  gasSponsorship,
  onGasSponsorshipChange,
  selectedStrategy,
  onOpenStrategyPicker,
  ...tokenAllocationProps
}: SendConfigurationCollapsibleProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const { showConfiguration, toggleConfiguration } = useSendConfiguration();

  return (
    <View style={[styles.section, style]}>
      <Pressable
        accessibilityLabel={
          showConfiguration
            ? 'Hide configuration'
            : 'Show configuration'
        }
        accessibilityRole="button"
        accessibilityState={{ expanded: showConfiguration }}
        onPress={toggleConfiguration}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
      >
        <Text style={styles.label}>Configuration</Text>
        <Ionicons
          name={showConfiguration ? 'chevron-up' : 'chevron-down'}
          size={16}
          color={colors.textMuted}
        />
      </Pressable>

      {showConfiguration ? (
        <View style={styles.panel}>
          <SendConfigurationFields
            broadcastMode={broadcastMode}
            onBroadcastModeChange={onBroadcastModeChange}
            gasSponsorship={gasSponsorship}
            onGasSponsorshipChange={onGasSponsorshipChange}
          />

          {includeTokenAllocations ? (
            <>
              <View style={styles.advancedDivider} />

              <SendAdvancedDetailsCollapsible>
                <SendTokenAllocations
                  onOpenStrategyPicker={onOpenStrategyPicker}
                  selectedStrategy={selectedStrategy}
                  {...tokenAllocationProps}
                />
              </SendAdvancedDetailsCollapsible>
            </>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  section: {
    marginTop: 16,
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    alignSelf: 'flex-start',
    paddingVertical: 4,
  },
  headerPressed: {
    opacity: 0.75,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
  },
  panel: {
    marginTop: 8,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: c.rowBorder,
    borderRadius: 12,
    backgroundColor: c.surface,
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  advancedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
  },
});
}
