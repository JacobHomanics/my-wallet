import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { ZitiIcon } from '@/components/ZitiIcon';
import { useAppBrand } from '@/hooks/useAppBrand';
import { useSplashRedirect } from '@/hooks/useSplashRedirect';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

export function SplashScreen() {
  const { name } = useAppBrand();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  useSplashRedirect();

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{name}</Text>
      <View style={styles.iconBadge}>
        <ZitiIcon
          size={44}
          color={colors.primaryText}
          detailColor={colors.primary}
        />
      </View>
      <ActivityIndicator size="large" color={colors.primary} style={styles.spinner} />
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: c.bg,
    },
    iconBadge: {
      width: 72,
      height: 72,
      borderRadius: 20,
      backgroundColor: c.primary,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: 20,
    },
    brand: {
      fontSize: 28,
      fontWeight: '700',
      color: c.primary,
      letterSpacing: -0.5,
    },
    spinner: {
      marginTop: 24,
    },
  });
}
