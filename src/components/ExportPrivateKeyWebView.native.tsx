import { Ionicons } from '@expo/vector-icons';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

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
          <Pressable
            accessibilityLabel="Close"
            accessibilityRole="button"
            hitSlop={8}
            onPress={onClose}
            style={({ pressed }) => [
              styles.closeButton,
              pressed && styles.closeButtonPressed,
            ]}
          >
            <Ionicons name="close" size={22} color="#D33D3D" />
          </Pressable>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F5BFA9',
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    color: '#D33D3D',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonPressed: {
    opacity: 0.65,
  },
  webview: {
    flex: 1,
    backgroundColor: '#FFF4E6',
  },
});
