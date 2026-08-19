import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';

import { usePhysicalCardWaitlist } from '@/hooks/usePhysicalCardWaitlist';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Home screen promo for upcoming physical cards with waitlist signup.
 */
export function PhysicalCardWaitlistCallout() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const { hasJoined, join, isLoading, isJoining, errorMessage } =
    usePhysicalCardWaitlist();

  if (isLoading) {
    return null;
  }

  return (
    <View style={styles.callout}>
      <View style={styles.iconWrap}>
        <Ionicons name="card-outline" size={20} color={colors.primary} />
      </View>
      <View style={styles.body}>
        <Text style={styles.title}>Physical cards coming soon!</Text>
        {hasJoined ? (
          <View style={styles.joinedRow}>
            <Ionicons name="checkmark-circle" size={16} color={colors.success} />
            <Text style={styles.joinedText}>You&apos;re on the waitlist</Text>
          </View>
        ) : (
          <>
            <Pressable
              accessibilityLabel="Join waitlist"
              accessibilityRole="button"
              accessibilityState={{ disabled: isJoining }}
              disabled={isJoining}
              onPress={() => {
                void join();
              }}
              style={({ pressed }) => [
                styles.button,
                pressed && !isJoining && styles.buttonPressed,
                isJoining && styles.buttonDisabled,
              ]}
            >
              {isJoining ? (
                <ActivityIndicator color={colors.primaryText} size="small" />
              ) : (
                <Text style={styles.buttonText}>Join waitlist</Text>
              )}
            </Pressable>
            {errorMessage ? (
              <Text style={styles.errorText}>{errorMessage}</Text>
            ) : null}
          </>
        )}
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    callout: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: 12,
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      marginBottom: 24,
      paddingHorizontal: 14,
      paddingVertical: 14,
      borderRadius: 14,
      borderWidth: StyleSheet.hairlineWidth,
      borderColor: c.rowBorder,
      backgroundColor: c.surface,
    },
    iconWrap: {
      width: 36,
      height: 36,
      borderRadius: 18,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.surfaceMuted,
      marginTop: 2,
    },
    body: {
      flex: 1,
      minWidth: 0,
      gap: 10,
    },
    title: {
      fontSize: 15,
      fontWeight: '600',
      lineHeight: 20,
      color: c.primary,
    },
    button: {
      alignSelf: 'flex-start',
      backgroundColor: c.primary,
      paddingHorizontal: 14,
      paddingVertical: 8,
      borderRadius: 999,
      minWidth: 112,
      alignItems: 'center',
      justifyContent: 'center',
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    buttonText: {
      fontSize: 14,
      fontWeight: '600',
      color: c.primaryText,
    },
    joinedRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
    },
    joinedText: {
      fontSize: 14,
      fontWeight: '500',
      color: c.success,
    },
    errorText: {
      fontSize: 13,
      lineHeight: 18,
      color: c.danger,
    },
  });
}
