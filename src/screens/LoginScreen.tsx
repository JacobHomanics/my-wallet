import { StyleSheet, Text, View } from 'react-native';

export function LoginScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.subtitle}>
        Sign in to access your wallet. Login methods will be wired up next.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8fafc',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#475569',
    textAlign: 'center',
  },
});
