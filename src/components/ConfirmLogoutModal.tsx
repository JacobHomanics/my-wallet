import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ConfirmLogoutModalProps = {
  visible: boolean;
  isSigningOut?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Asks the user to confirm signing out.
 */
export function ConfirmLogoutModal({
  visible,
  isSigningOut = false,
  onCancel,
  onConfirm,
}: ConfirmLogoutModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityLabel="Dismiss logout confirmation"
        accessibilityRole="button"
        disabled={isSigningOut}
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
          <Text style={styles.title}>Log out?</Text>
          <Text style={styles.paragraph}>
            Are you sure you want to log out of your account?
          </Text>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Cancel"
              accessibilityRole="button"
              disabled={isSigningOut}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
                isSigningOut && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Log out"
              accessibilityRole="button"
              disabled={isSigningOut}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.buttonPressed,
                isSigningOut && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.logoutButtonText}>
                {isSigningOut ? 'Logging out…' : 'Log out'}
              </Text>
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
    borderWidth: 1,
    borderColor: '#d1fae5',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 10,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3f6b52',
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
    backgroundColor: '#d1fae5',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
  logoutButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#b91c1c',
  },
  logoutButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
