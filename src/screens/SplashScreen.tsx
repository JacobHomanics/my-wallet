import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

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
