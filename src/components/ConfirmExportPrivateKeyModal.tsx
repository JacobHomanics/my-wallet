import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type ConfirmExportPrivateKeyModalProps = {
  visible: boolean;
  walletLabel: string;
  onCancel: () => void;
  onConfirm: () => void;
};

/**
 * Confirms before revealing a private key (replaces Alert / window.confirm).
 */
export function ConfirmExportPrivateKeyModal({
  visible,
  walletLabel,
  onCancel,
  onConfirm,
}: ConfirmExportPrivateKeyModalProps) {
  const label = walletLabel.trim() || 'wallet';

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onCancel}
    >
      <Pressable
        accessibilityLabel="Dismiss export confirmation"
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
          <Text style={styles.title}>Export private key?</Text>
          <Text style={styles.paragraph}>
            {`Export your ${label} private key? Anyone with this key can control the funds in this wallet.`}
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
              accessibilityLabel={`Export ${label} private key`}
              accessibilityRole="button"
              onPress={onConfirm}
              style={({ pressed }) => [
                styles.exportButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.exportButtonText}>Export</Text>
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
    borderColor: '#F5BFA9',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#D33D3D',
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
    backgroundColor: '#F5BFA9',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D33D3D',
  },
  exportButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#b91c1c',
  },
  exportButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#ffffff',
  },
  buttonPressed: {
    opacity: 0.85,
  },
});
