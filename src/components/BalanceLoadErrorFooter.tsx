import {
  ActivityIndicator,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

type BalanceLoadErrorFooterProps = {
  onRetry: () => void;
  retrying?: boolean;
  style?: StyleProp<ViewStyle>;
};

export function BalanceLoadErrorFooter({
  onRetry,
  retrying = false,
  style,
}: BalanceLoadErrorFooterProps) {
  const handleRetry = () => {
    if (retrying) {
      return;
    }
    onRetry();
  };

  return (
    <View style={[styles.inline, style]}>
      <Text style={styles.message}>
        {"Couldn't load balance. Your funds are safe. "}
        <Text
          accessibilityRole="link"
          accessibilityState={{ disabled: retrying }}
          onPress={retrying ? undefined : handleRetry}
          style={[styles.link, retrying && styles.linkDisabled]}
        >
          Retry
        </Text>
      </Text>
      {retrying ? (
        <ActivityIndicator
          color="#166534"
          size="small"
          style={styles.spinner}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  inline: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
    maxWidth: 280,
    gap: 4,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    color: '#5a7d6a',
    textAlign: 'center',
  },
  spinner: {
    transform: [{ scale: 0.85 }],
  },
  link: {
    fontSize: 15,
    fontWeight: '500',
    color: '#5a7d6a',
    textDecorationLine: 'underline',
  },
  linkDisabled: {
    opacity: 0.6,
  },
});
