import { Modal, Pressable, StyleSheet, Switch, Text, View } from 'react-native';

type DepositBankTipsModalProps = {
  visible: boolean;
  doNotShowAgain: boolean;
  onDoNotShowAgainChange: (value: boolean) => void;
  onClose: () => void;
  onContinue: () => void;
};

/**
 * Recommends bank accounts and cards before starting a deposit.
 */
export function DepositBankTipsModal({
  visible,
  doNotShowAgain,
  onDoNotShowAgainChange,
  onClose,
  onContinue,
}: DepositBankTipsModalProps) {
  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable
        accessibilityLabel="Dismiss deposit tips"
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
          <Text style={styles.title}>Deposit</Text>
          <Text style={styles.paragraph}>
            For best results use:{' '}
            <Text style={styles.bold}>Ally Bank</Text>,{' '}
            <Text style={styles.bold}>Fidelity Cash Management</Text>,{' '}
            <Text style={styles.bold}>SoFi</Text>,{' '}
            <Text style={styles.bold}>Capital One 360</Text>, or{' '}
            <Text style={styles.bold}>USAA</Text> bank accounts and debit cards.
          </Text>
          <Text style={styles.paragraph}>
            <Text style={styles.bold}>Chase</Text>,{' '}
            <Text style={styles.bold}>Bank of America</Text>,{' '}
            <Text style={styles.bold}>Wells Fargo</Text>, or{' '}
            <Text style={styles.bold}>U.S. Bank</Text> may be other decent options,
            however they are known to occasionally flag crypto purchases.
          </Text>
          <Text style={styles.paragraph}>
            Any bank not listed has a significant chance of not working.
          </Text>
          <View style={styles.toggleRow}>
            <Text style={styles.toggleLabel}>Do not show again</Text>
            <Switch
              accessibilityLabel="Do not show again"
              trackColor={{ false: '#bbf7d0', true: '#86efac' }}
              thumbColor={doNotShowAgain ? '#166534' : '#f0fdf4'}
              ios_backgroundColor="#bbf7d0"
              value={doNotShowAgain}
              onValueChange={onDoNotShowAgainChange}
            />
          </View>
          <View style={styles.actions}>
            <Pressable
              accessibilityLabel="Cancel"
              accessibilityRole="button"
              onPress={onClose}
              style={({ pressed }) => [
                styles.cancelButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
            <Pressable
              accessibilityLabel="Continue to deposit"
              accessibilityRole="button"
              onPress={onContinue}
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.buttonPressed,
              ]}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
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
    marginBottom: 12,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: '#3f6b52',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    gap: 12,
  },
  toggleLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#3f6b52',
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 4,
  },
  cancelButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
  },
  continueButton: {
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
  continueButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#f0fdf4',
  },
});
