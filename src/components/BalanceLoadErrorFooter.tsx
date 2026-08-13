import {
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type BalanceLoadErrorFooterProps = {
  onRetry: () => void;
  style?: StyleProp<ViewStyle>;
};

export function BalanceLoadErrorFooter({
  onRetry,
  style,
}: BalanceLoadErrorFooterProps) {
  return (
    <View style={[styles.container, style]}>
      <Text style={styles.message}>
        Couldn't load balance. Your funds are safe.{' '}
        <Text accessibilityRole="link" onPress={onRetry} style={styles.link}>
          Retry
        </Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
  },
  message: {
    fontSize: 15,
    color: '#5a7d6a',
    textAlign: 'center',
    maxWidth: 280,
  },
  link: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5a7d6a',
    textDecorationLine: 'underline',
  },
});
