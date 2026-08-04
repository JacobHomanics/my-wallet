import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { CashboxIcon } from '@/components/CashboxIcon';
import { useAppBrand } from '@/hooks/useAppBrand';
import { useSplashRedirect } from '@/hooks/useSplashRedirect';
import { useThemeColors } from '@/hooks/useThemeColors';
import { colors } from '@/theme/colors';

export function SplashScreen() {
  const { name } = useAppBrand();
  const theme = useThemeColors();
  useSplashRedirect();

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{name}</Text>
      <View style={styles.iconBadge}>
        <CashboxIcon
          size={44}
          color={colors.primaryText}
          detailColor={colors.primary}
        />
      </View>
      <ActivityIndicator size="large" color={theme.primary} style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
  iconBadge: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    letterSpacing: -0.5,
  },
  spinner: {
    marginTop: 24,
  },
});
