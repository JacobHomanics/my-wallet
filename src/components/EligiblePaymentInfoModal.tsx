import { useThemedStyles } from '@/hooks/useThemedStyles';
import {StyleSheet,  Modal, Pressable, Text, View } from 'react-native';
import type { ThemeColors } from '@/theme/types';

type EligiblePaymentInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Explains which payments qualify for vault auto-deposit and use vault balance.
 */
export function EligiblePaymentInfoModal({
  visible,
  onClose,
}: EligiblePaymentInfoModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Dismiss eligible payment info"
        accessibilityRole="button"
        onPress={onClose}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityViewIsModal
          onPress={(event) => {
            event.stopPropagation();
          }}
          style={styles.card}
        >
          <Text style={styles.title}>Eligible payment</Text>
          <View style={styles.body}>
            <Text style={styles.paragraph}>
              An eligible payment is USDC on Base. These settings apply only when
              that asset is part of the payment.
            </Text>
          </View>
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Text style={styles.closeButtonText}>Close</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 40, 25, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    borderRadius: 16,
    backgroundColor: c.surface,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
    borderWidth: 1,
    borderColor: c.rowBorder,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: c.primary,
    marginBottom: 12,
  },
  body: {
    gap: 10,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
  },
});
}
