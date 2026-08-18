import { Ionicons } from '@expo/vector-icons';
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import type { ReactNode } from 'react';

type SendAdvancedDetailsCollapsibleProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
};

/**
 * Nested “Show / Hide advanced details” section for token allocation legs.
 */
export function SendAdvancedDetailsCollapsible({
  children,
  style,
}: SendAdvancedDetailsCollapsibleProps) {
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();

  return (
    <View style={[styles.section, style]}>
      <Pressable
        accessibilityLabel={
          showAdvanced ? 'Hide advanced details' : 'Show advanced details'
        }
        accessibilityRole="button"
        accessibilityState={{ expanded: showAdvanced }}
        onPress={toggleAdvanced}
        style={({ pressed }) => [
          styles.header,
          pressed && styles.headerPressed,
        ]}
      >
        <Text style={styles.label}>
          {showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
        </Text>
        <Ionicons
          name={showAdvanced ? 'chevron-up' : 'chevron-down'}
          size={16}
          color="#5a7d6a"
        />
      </Pressable>

      {showAdvanced ? <View style={styles.content}>{children}</View> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginTop: 4,
    alignSelf: 'stretch',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: 8,
  },
  headerPressed: {
    opacity: 0.65,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
  },
  content: {
    alignSelf: 'stretch',
  },
});
