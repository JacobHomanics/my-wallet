import { Image } from 'expo-image';
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from 'react-native';

import { FarcasterIcon } from '@/components/FarcasterIcon';
import { getAvatarColor } from '@/hooks/useProfileIdentity';

type AvatarProps = {
  label: string;
  seed: string;
  photoUrl?: string | null;
  size?: number;
  /** Bottom-right Farcaster brand badge (e.g. Farcaster contacts). */
  showFarcasterBadge?: boolean;
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
  showFarcasterBadge = false,
  style,
}: AvatarProps) {
  const letter = label.trim().charAt(0).toUpperCase() || '?';
  const backgroundColor = getAvatarColor(seed);
  const fontSize = Math.max(12, Math.round(size * 0.4));
  const badgeSize = Math.max(14, Math.round(size * 0.4));

  return (
    <View style={[{ width: size, height: size }, style]}>
      <View
        style={[
          styles.avatar,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            backgroundColor,
          },
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
      {showFarcasterBadge ? (
        <View
          style={[
            styles.farcasterBadge,
            {
              width: badgeSize,
              height: badgeSize,
              borderRadius: badgeSize / 2,
            },
          ]}
        >
          <FarcasterIcon size={badgeSize} withBackground />
        </View>
      ) : null}
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
  farcasterBadge: {
    position: 'absolute',
    right: -2,
    bottom: -2,
    overflow: 'hidden',
    borderWidth: 1.5,
    borderColor: '#ffffff',
    backgroundColor: '#855DCD',
  },
});
