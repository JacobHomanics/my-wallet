import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { ZitiIcon } from '@/components/ZitiIcon';
import { useAppBrand } from '@/hooks/useAppBrand';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { RootStackParamList } from '@/navigation/types';
import type { ThemeColors } from '@/theme/types';

export function WelcomeScreen() {
  const { name, tagline } = useAppBrand();
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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
      <Text style={styles.subtitle}>{tagline}</Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          navigation.navigate('login');
        }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Sign up / Login</Text>
      </Pressable>
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
      paddingHorizontal: 24,
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
    subtitle: {
      marginTop: 20,
      fontSize: 16,
      lineHeight: 24,
      color: c.textSecondary,
      textAlign: 'center',
    },
    button: {
      marginTop: 24,
      backgroundColor: c.primary,
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 10,
    },
    buttonPressed: {
      opacity: 0.85,
    },
    buttonText: {
      color: c.primaryText,
      fontSize: 16,
      fontWeight: '600',
    },
  });
}
