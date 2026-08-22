import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { ConfirmLogoutModal } from '@/components/ConfirmLogoutModal';
import { IconButton } from '@/components/IconButton';
import { useConfirmSignOut } from '@/hooks/useConfirmSignOut';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToProfile } from '@/hooks/usePopToProfile';
import type { ProfileStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export function SettingsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const goProfile = usePopToProfile();
  const {
    confirmVisible: logoutConfirmVisible,
    isSigningOut,
    requestSignOut,
    cancelSignOut,
    confirmSignOut,
  } = useConfirmSignOut();

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
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
            <IconButton
              accessibilityLabel="Log out"
              color={colors.textMuted}
              icon="log-out-outline"
              iconSize={22}
              onPress={requestSignOut}
            />
          </View>

          <View style={styles.sections}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile</Text>
              <Pressable
                accessibilityLabel="Profile settings"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('profileSettings');
                }}
                style={({ pressed }) => [
                  styles.strategyRow,
                  pressed && styles.strategyRowPressed,
                ]}
              >
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>Profile settings</Text>
                  <Text style={styles.strategyDescription}>
                    Username and profile photo
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Money</Text>
              <Pressable
                accessibilityLabel="Money settings"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('moneySettings');
                }}
                style={({ pressed }) => [
                  styles.strategyRow,
                  pressed && styles.strategyRowPressed,
                ]}
              >
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>Money settings</Text>
                  <Text style={styles.strategyDescription}>
                    Onramp, send, and earn
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Appearance</Text>
              <Pressable
                accessibilityLabel="Appearance settings"
                accessibilityRole="button"
                onPress={() => {
                  navigation.navigate('appearanceSettings');
                }}
                style={({ pressed }) => [
                  styles.strategyRow,
                  pressed && styles.strategyRowPressed,
                ]}
              >
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>Appearance settings</Text>
                  <Text style={styles.strategyDescription}>
                    Display currency, app layout, and color theme
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>

      <ConfirmLogoutModal
        isSigningOut={isSigningOut}
        onCancel={cancelSignOut}
        onConfirm={() => {
          void confirmSignOut();
        }}
        visible={logoutConfirmVisible}
      />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
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
    color: c.primary,
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
    color: c.primary,
  },
  sections: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 420,
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  strategyRowPressed: {
    opacity: 0.85,
  },
  strategyRowText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  strategyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
  strategyDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textSubtle,
  },
  });
}
