import type { ReactNode } from 'react';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import { StyleSheet, Modal, Pressable, Text, View } from 'react-native';
import type { ThemeColors } from '@/theme/types';

type SignUpLoginPromptModalProps = {
  visible: boolean;
  title?: string;
  message?: ReactNode;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Prompts a signed-out user to create an account or log in.
 */
export function SignUpLoginPromptModal({
  visible,
  title = 'Sign up / Login',
  message,
  onCancel,
  onConfirm,
}: SignUpLoginPromptModalProps) {
  const styles = useThemedStyles(createStyles);
  const body = message ?? (
    <>
      Sign up or login to{' '}
      <Text style={styles.emphasis}>send and receive money</Text>,{' '}
      <Text style={styles.emphasis}>earn cashback rewards</Text>,{' '}
      <Text style={styles.emphasis}>
        earn automatic interest on your account balance
      </Text>
      , and{' '}
      <Text style={styles.emphasis}>save contacts for easy reference</Text>
      .
    </>
  );

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityLabel="Dismiss sign up prompt"
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
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.paragraph}>{body}</Text>
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
              accessibilityLabel="Sign up / Login"
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.continueButtonText}>Sign up / Login</Text>
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
      borderWidth: 1,
      borderColor: c.rowBorder,
    },
    title: {
      fontSize: 18,
      fontWeight: '700',
      color: c.primary,
      marginBottom: 10,
    },
    paragraph: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textSecondary,
    },
    emphasis: {
      fontWeight: '700',
      color: c.primary,
    },
    actions: {
      marginTop: 18,
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
    cancelButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.primary,
    },
    continueButton: {
      paddingHorizontal: 14,
      paddingVertical: 10,
      borderRadius: 10,
      backgroundColor: c.primary,
    },
    continueButtonText: {
      fontSize: 15,
      fontWeight: '600',
      color: c.primaryText,
    },
    buttonPressed: {
      opacity: 0.85,
    },
  });
}
