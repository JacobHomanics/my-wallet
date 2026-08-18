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

export type SendConfigurationCollapsibleProps = SendAdvancedDetailsProps & {
  style?: StyleProp<ViewStyle>;
};

/**
 * Outer “Configuration” collapsible with nested “Show advanced details” for
 * token allocation legs.
 */
export function SendConfigurationCollapsible({
  style,
  broadcastMode,
  onBroadcastModeChange,
  selectedStrategy,
  onOpenStrategyPicker,
  ...tokenAllocationProps
}: SendConfigurationCollapsibleProps) {
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
          color="#5a7d6a"
        />
      </Pressable>

      {showConfiguration ? (
        <View style={styles.panel}>
          <SendConfigurationFields
            broadcastMode={broadcastMode}
            onBroadcastModeChange={onBroadcastModeChange}
          />

          <View style={styles.advancedDivider} />

          <SendAdvancedDetailsCollapsible>
            <SendTokenAllocations
              onOpenStrategyPicker={onOpenStrategyPicker}
              selectedStrategy={selectedStrategy}
              {...tokenAllocationProps}
            />
          </SendAdvancedDetailsCollapsible>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    color: '#5a7d6a',
  },
  panel: {
    marginTop: 8,
    alignSelf: 'stretch',
    borderWidth: 1,
    borderColor: '#d1fae5',
    borderRadius: 12,
    backgroundColor: '#fff',
    paddingHorizontal: 14,
    paddingTop: 4,
    paddingBottom: 12,
  },
  advancedDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#d1fae5',
  },
});
