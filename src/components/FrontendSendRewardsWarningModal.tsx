import {StyleSheet,  Modal, Pressable, Text, View } from 'react-native';

import { APP_NAME, NETWORK_NAME } from '@/lib/brand';
import { REWARD_POINTS_LABEL } from '@/lib/rewardToken';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

type FrontendSendRewardsWarningModalProps = {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Warns that device-signed sends skip ZitiCashbox Network benefits (points + gas sponsorship).
 */
export function FrontendSendRewardsWarningModal({
  visible,
  onCancel,
  onConfirm,
}: FrontendSendRewardsWarningModalProps) {
  const styles = useThemedStyles(createStyles);

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityLabel={`Dismiss ${NETWORK_NAME} warning`}
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
          <Text style={styles.title}>Leave {NETWORK_NAME}?</Text>
          <Text style={styles.paragraph}>
            Sending from this device skips the {APP_NAME} backend, so you will not
            receive any {REWARD_POINTS_LABEL} or gas sponsorship for this
            payment.
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
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: c.primary,
    marginBottom: 8,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
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
    backgroundColor: c.surfaceMuted,
  },
  confirmButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: c.primary,
  },
  buttonPressed: {
    opacity: 0.85,
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
  },
  confirmButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primaryText,
  },
});
}
