import { StyleSheet, Text, View } from 'react-native';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

type SampleStampProps = {
  inline?: boolean;
};

/**
 * Diagonal SAMPLE badge for signed-out preview UI.
 */
export function SampleStamp({ inline = false }: SampleStampProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <View
      pointerEvents="none"
      style={inline ? styles.stampInline : styles.stamp}
    >
      <Text style={[styles.stampText, inline && styles.stampTextInline]}>
        SAMPLE
      </Text>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    stamp: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stampInline: {
      alignItems: 'center',
      justifyContent: 'center',
    },
    stampText: {
      transform: [{ rotate: '-18deg' }],
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 3,
      color: c.primary,
      backgroundColor: c.surface,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.primary,
      overflow: 'hidden',
    },
    stampTextInline: {
      transform: [],
      fontSize: 14,
      letterSpacing: 2,
      paddingHorizontal: 8,
      paddingVertical: 2,
      borderWidth: 1.5,
      borderRadius: 5,
    },
  });
}
