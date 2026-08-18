import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

type BalanceBreakdownModalProps = {
  visible: boolean;
  accountBalanceLabel: string;
  earnBalanceLabel: string;
  onClose: () => void;
};

/**
 * Shows wallet and earn vault balances that make up the home total.
 */
export function BalanceBreakdownModal({
  visible,
  accountBalanceLabel,
  earnBalanceLabel,
  onClose,
}: BalanceBreakdownModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Dismiss balance breakdown"
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
          <Text style={styles.title}>Balance breakdown</Text>
          <View style={styles.rows}>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Account balance</Text>
              <Text style={styles.rowValue}>{accountBalanceLabel}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Earn balance</Text>
              <Text style={styles.rowValue}>{earnBalanceLabel}</Text>
            </View>
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
    marginBottom: 16,
  },
  rows: {
    gap: 12,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 16,
  },
  rowLabel: {
    flex: 1,
    fontSize: 15,
    color: '#3f6b52',
  },
  rowValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
    fontVariant: ['tabular-nums'],
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
