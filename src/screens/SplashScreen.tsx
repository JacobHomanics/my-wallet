import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { useAppBrand } from '@/hooks/useAppBrand';
import { useSplashRedirect } from '@/hooks/useSplashRedirect';

export function SplashScreen() {
  const { name } = useAppBrand();
  useSplashRedirect();

  return (
    <View style={styles.container}>
      <Text style={styles.brand}>{name}</Text>
      <ActivityIndicator size="large" color="#0f172a" style={styles.spinner} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
  },
  brand: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  spinner: {
    marginTop: 24,
  },
});
