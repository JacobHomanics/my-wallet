import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

import { REWARD_POINTS_LABEL } from '@/lib/rewardToken';

type FrontendSendRewardsWarningModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Warns that device-signed sends skip Cashbox Network benefits (points + gas sponsorship).
 */
export function FrontendSendRewardsWarningModal({
  visible,
  onCancel,
  onConfirm,
}: FrontendSendRewardsWarningModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityLabel="Dismiss Cashbox Network warning"
        accessibilityRole="button"
        onPress={onCancel}
        style={styles.backdrop}
      >
        <Pressable
          accessibilityViewIsModal
          onPress={(event) => {
            event.stopPropagation();
          }}
          style={styles.card}
        >
          <Text style={styles.title}>Leave Cashbox Network?</Text>
          <Text style={styles.paragraph}>
            Sending outside the Cashbox Network signs on this device. You will
            not earn {REWARD_POINTS_LABEL} or gas sponsorship for this payment.
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Cancel"
              accessibilityRole="button"
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityLabel={`Continue without ${REWARD_POINTS_LABEL} or gas sponsorship`}
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.confirmButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.confirmButtonText}>Continue</Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 40, 25, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    borderRadius: 16,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3f5f4c',
    marginBottom: 20,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
  },
  confirmButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#166534',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f0fdf4',
  },
});
