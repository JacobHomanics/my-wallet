import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { getAvatarColor } from '@/hooks/useProfileIdentity';

type AvatarProps = {
  label: string;
  seed: string;
  photoUrl?: string | null;
  size?: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * Circular avatar with optional profile photo, falling back to a letter.
 */
export function Avatar({
  label,
  seed,
  photoUrl,
  size = 40,
  style,
}: AvatarProps) {
  const letter = label.trim().charAt(0).toUpperCase() || '?';
  const backgroundColor = getAvatarColor(seed);
  const fontSize = Math.max(12, Math.round(size * 0.4));

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor,
        },
        style,
      ]}
    >
      {photoUrl ? (
        <Image
          accessibilityLabel={`${label} profile photo`}
          contentFit="cover"
          source={{ uri: photoUrl }}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
          }}
        />
      ) : (
        <Text style={[styles.letter, { fontSize }]}>{letter}</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  letter: {
    color: '#ffffff',
    fontWeight: '700',
  },
});
