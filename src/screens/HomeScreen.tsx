import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useAuth } from '@/hooks/useAuth';

export function HomeScreen() {
  const { user, logout } = useAuth();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Home</Text>
      <Text style={styles.subtitle}>
        Signed in{user?.id ? ` as ${user.id}` : ''}.
      </Text>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          void logout();
        }}
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
      >
        <Text style={styles.buttonText}>Log out</Text>
      </Pressable>
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
  button: {
    marginTop: 24,
    backgroundColor: '#0f172a',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: '#f8fafc',
    fontSize: 16,
    fontWeight: '600',
  },
});
