import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToProfile } from '@/hooks/usePopToProfile';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goProfile = usePopToProfile();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to profile"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goProfile}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to profile"
              onPress={goProfile}
            />
          )}
          <Text style={styles.topBarTitle}>Settings</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <Text style={styles.empty}>Settings coming soon.</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#166534',
  },
  topBarSpacer: {
    width: 44,
  },
  webBack: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  webBackPressed: {
    opacity: 0.7,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  empty: {
    marginTop: 48,
    paddingHorizontal: 24,
    fontSize: 15,
    color: '#86a894',
    textAlign: 'center',
  },
});
