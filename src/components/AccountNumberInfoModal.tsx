import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type AccountNumberInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Explains how the reversible account number is built from EVM + Solana addresses.
 */
export function AccountNumberInfoModal({
  visible,
  onClose,
}: AccountNumberInfoModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Dismiss account number info"
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
          <Text style={styles.title}>Account Number</Text>
          <View style={styles.body}>
            <Text style={styles.heading}>How is it generated?</Text>
            <Text style={styles.paragraph}>
              Your account number packs your EVM and Solana wallet addresses
              into one reversible code.
            </Text>
            <Text style={styles.paragraph}>
              It combines a version byte, your 20-byte EVM address, and your
              32-byte Solana address, then encodes that as a compact string.
            </Text>
            <Text style={styles.paragraph}>
              Anyone with the account number can decode it back into both
              addresses—so you can share one id instead of two.
            </Text>
            <Text style={styles.paragraph}>
              You can view your EVM and Solana addresses anytime in Settings.
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
    marginBottom: 12,
  },
  body: {
    gap: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#4A1E1E',
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3f6b52',
  },
  closeButton: {
    marginTop: 16,
    alignSelf: 'flex-end',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#F5BFA9',
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#D33D3D',
  },
});
