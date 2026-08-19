import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { appConfig } from '@/configs/app.config';
import { useChainPriority } from '@/hooks/useChainPriority';
import { useDefaultCashboxNetwork } from '@/hooks/useDefaultCashboxNetwork';
import { useDefaultGasSponsorship } from '@/hooks/useDefaultGasSponsorship';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useOnrampSettings } from '@/hooks/useOnrampSettings';
import { usePaymentStrategy } from '@/hooks/usePaymentStrategy';
import { usePopToSettings } from '@/hooks/usePopToSettings';
import type { ProfileStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Onramp, send, and earn settings grouped under money.
 */
export function MoneySettingsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const goSettings = usePopToSettings();
  const { selectedStrategy } = usePaymentStrategy();
  const { selectedOption: selectedChainPriority } = useChainPriority();
  const { selectedDestinationLabel } = useOnrampSettings();
  const { defaultCashboxNetwork } = useDefaultCashboxNetwork();
  const { defaultGasSponsorship } = useDefaultGasSponsorship();

  const sendSettingsSummary = [
    selectedStrategy.label,
    selectedChainPriority.label,
    defaultCashboxNetwork ? 'Cashbox Network' : 'Device send',
    defaultCashboxNetwork && appConfig.gasSponsorship
      ? defaultGasSponsorship
        ? 'Gas sponsored where available'
        : 'You pay gas'
      : null,
  ]
    .filter(Boolean)
    .join(' · ');

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to settings"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goSettings}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to settings"
              onPress={goSettings}
            />
          )}
          <View style={styles.topBarSpacer} />
        </View>

        <Text style={styles.title}>Money</Text>

        <View style={styles.section}>
          <Pressable
            accessibilityLabel="Onramp settings"
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('onrampSettings');
            }}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Onramp</Text>
              <Text style={styles.optionDescription}>
                Default destination: {selectedDestinationLabel}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </Pressable>

          <Pressable
            accessibilityLabel="Send settings"
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('sendSettings');
            }}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Send</Text>
              <Text style={styles.optionDescription} numberOfLines={2}>
                {sendSettingsSummary}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </Pressable>

          <Pressable
            accessibilityLabel="Earn settings"
            accessibilityRole="button"
            onPress={() => {
              navigation.navigate('earnSettings');
            }}
            style={({ pressed }) => [
              styles.optionRow,
              pressed && styles.optionRowPressed,
            ]}
          >
            <View style={styles.optionText}>
              <Text style={styles.optionLabel}>Earn</Text>
              <Text style={styles.optionDescription}>
                Vault auto-deposit and use vault balance
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textSubtle} />
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: c.bg,
    },
    content: {
      width: '100%',
      maxWidth: 420,
      alignSelf: 'center',
      paddingHorizontal: 24,
      alignItems: 'center',
    },
    topBar: {
      width: '100%',
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 8,
    },
    topBarSpacer: {
      flex: 1,
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
    title: {
      width: '100%',
      fontSize: 28,
      fontWeight: '700',
      color: c.primary,
      marginBottom: 24,
    },
    section: {
      width: '100%',
      gap: 12,
    },
    optionRow: {
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
    optionRowPressed: {
      opacity: 0.85,
    },
    optionText: {
      flex: 1,
      minWidth: 0,
      gap: 4,
    },
    optionLabel: {
      fontSize: 16,
      fontWeight: '600',
      color: c.primary,
    },
    optionDescription: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textSubtle,
    },
  });
}
