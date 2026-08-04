import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type TaxInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Explains the app service fee.
 */
export function TaxInfoModal({ visible, onClose }: TaxInfoModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Dismiss service fee info"
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
          <Text style={styles.title}>Service fee</Text>
          <View style={styles.body}>
            <Text style={styles.heading}>Why is there a service fee?</Text>
            <Text style={styles.paragraph}>
              Every transfer includes a small service fee that helps us operate
              and improve the platform.
            </Text>
            <Text style={styles.paragraph}>
              {
                "You'll always see the fees before you confirm your transfer—no hidden charges."
              }
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
    borderColor: '#d1fae5',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#166534',
    marginBottom: 12,
  },
  body: {
    gap: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: '#14532d',
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
    backgroundColor: '#d1fae5',
  },
  closeButtonPressed: {
    opacity: 0.85,
  },
  closeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#166534',
  },
});
