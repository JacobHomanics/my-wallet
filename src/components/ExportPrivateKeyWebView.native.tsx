import { Modal, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';
import { IconButton } from '@/components/IconButton';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

type ExportPrivateKeyWebViewProps = {
  uri: string | null;
  onClose: () => void;
};

/**
 * Incognito WebView hosting the web `/export` page so Privy can run
 * `exportWallet` in a secure browser context.
 * @see https://docs.privy.io/recipes/mobile-key-export
 */
export function ExportPrivateKeyWebView({
  uri,
  onClose,
}: ExportPrivateKeyWebViewProps) {
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();

  return (
    <Modal
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
      visible={uri != null}
    >
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.title}>Export private key</Text>
          <IconButton
            accessibilityLabel="Close"
            icon="close"
            iconSize={22}
            onPress={onClose}
            size={40}
          />
        </View>

        {uri ? (
          <WebView
            incognito
            onMessage={(event) => {
              try {
                const data = JSON.parse(event.nativeEvent.data) as {
                  status?: string;
                };
                if (data.status === 'success' || data.status === 'error') {
                  onClose();
                }
              } catch {
                // Ignore non-export messages from the page.
              }
            }}
            setSupportMultipleWindows={false}
            source={{ uri }}
            startInLoadingState
            style={styles.webview}
          />
        ) : null}
      </View>
    </Modal>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: c.rowBorder,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: c.primary,
  },
  webview: {
    flex: 1,
    backgroundColor: c.bg,
  },
});
}
