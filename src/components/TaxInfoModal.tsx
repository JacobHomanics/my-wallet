import { useThemedStyles } from '@/hooks/useThemedStyles';
import {StyleSheet,  Modal, Pressable, Text, View } from 'react-native';
import type { ThemeColors } from '@/theme/types';

import { useAppTax } from '@/hooks/useAppTax';

type TaxInfoModalProps = {
  visible: boolean;
  onClose: () => void;
};

/**
 * Explains the app service fee.
 */
export function TaxInfoModal({ visible, onClose }: TaxInfoModalProps) {
  const { sponsoredRatePercentLabel, unsponsoredRatePercentLabel } = useAppTax();
  const styles = useThemedStyles(createStyles);

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
              {`The rate depends on gas sponsorship: ${sponsoredRatePercentLabel}% when Cashbox pays network fees on supported chains, and ${unsponsoredRatePercentLabel}% when you pay network fees yourself.`}
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
    marginBottom: 12,
  },
  body: {
    gap: 10,
  },
  heading: {
    fontSize: 16,
    fontWeight: '700',
    color: c.text,
  },
  paragraph: {
    fontSize: 15,
    lineHeight: 22,
    color: c.textSecondary,
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
    color: c.primary,
  },
});
}
