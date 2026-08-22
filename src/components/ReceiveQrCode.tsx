import { StyleSheet, Text, View } from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';

import { useThemedStyles } from '@/hooks/useThemedStyles';
import { useThemeColors } from '@/hooks/useThemeColors';
import type { ThemeColors } from '@/theme/types';

type ReceiveQrCodeProps = {
  data: string;
  size: number;
  isPreview?: boolean;
};

/**
 * Receive QR, with a sample stamp when showing signed-out mock data.
 */
export function ReceiveQrCode({
  data,
  size,
  isPreview = false,
}: ReceiveQrCodeProps) {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  return (
    <View style={styles.block}>
      <View style={[styles.qrWrap, isPreview && styles.qrWrapPreview]}>
        <View style={isPreview ? styles.qrFaded : undefined}>
          <QRCodeStyled
            data={data}
            padding={16}
            size={size}
            color={isPreview ? colors.textMuted : colors.primary}
            style={styles.qr}
          />
        </View>
        {isPreview ? (
          <View pointerEvents="none" style={styles.stamp}>
            <Text style={styles.stampText}>SAMPLE</Text>
          </View>
        ) : null}
      </View>
      {isPreview ? (
        <Text style={styles.caption}>Example only — not a real receive code</Text>
      ) : null}
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
    block: {
      alignItems: 'center',
      gap: 10,
    },
    qrWrap: {
      backgroundColor: c.surface,
      borderRadius: 16,
      padding: 8,
      overflow: 'hidden',
      alignItems: 'center',
      justifyContent: 'center',
    },
    qrWrapPreview: {
      borderWidth: 1,
      borderStyle: 'dashed',
      borderColor: c.borderStrong,
    },
    qrFaded: {
      opacity: 0.4,
    },
    qr: {
      backgroundColor: c.surface,
    },
    stamp: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      justifyContent: 'center',
    },
    stampText: {
      transform: [{ rotate: '-18deg' }],
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: 3,
      color: c.primary,
      backgroundColor: c.surface,
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 6,
      borderWidth: 2,
      borderColor: c.primary,
      overflow: 'hidden',
    },
    caption: {
      fontSize: 13,
      fontWeight: '500',
      color: c.textMuted,
      textAlign: 'center',
    },
  });
}
