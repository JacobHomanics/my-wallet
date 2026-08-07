import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ConfirmDeleteContactModalProps = {
  visible: boolean;
  contactLabel: string;
  isDeleting?: boolean;
  errorMessage?: string | null;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Asks the user to confirm deleting a contact.
 */
export function ConfirmDeleteContactModal({
  visible,
  contactLabel,
  isDeleting = false,
  errorMessage,
  onCancel,
  onConfirm,
}: ConfirmDeleteContactModalProps) {
  const label = contactLabel.trim() || 'this contact';

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityLabel="Dismiss delete confirmation"
        accessibilityRole="button"
        disabled={isDeleting}
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
          <Text style={styles.title}>Delete contact?</Text>
          <Text style={styles.paragraph}>
            {`Are you sure you want to delete ${label}? This can’t be undone.`}
          </Text>
          {errorMessage ? (
            <Text style={styles.error}>{errorMessage}</Text>
          ) : null}
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Cancel"
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={onCancel}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
                isDeleting && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Delete contact"
              accessibilityRole="button"
              disabled={isDeleting}
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.deleteButton,
                pressed && styles.buttonPressed,
                isDeleting && styles.buttonDisabled,
              ]}
            >
              <Text style={styles.deleteButtonText}>
                {isDeleting ? 'Deleting…' : 'Delete'}
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
  error: {
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
    color: '#b91c1c',
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
  deleteButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#b91c1c',
  },
  deleteButtonText: {
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
