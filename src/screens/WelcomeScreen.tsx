import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { CashboxIcon } from '@/components/CashboxIcon';
import { useAppBrand } from '@/hooks/useAppBrand';
import type { RootStackParamList } from '@/navigation/types';
import { colors } from '@/theme/colors';

export function WelcomeScreen() {
  const { name, tagline } = useAppBrand();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();

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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
    paddingHorizontal: 24,
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
  subtitle: {
    marginTop: 20,
    fontSize: 16,
    lineHeight: 24,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  button: {
    marginTop: 24,
    backgroundColor: colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
});
