import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { useReceivePaymentUrl } from '@/hooks/useReceivePaymentUrl';
import { formatWalletAddress } from '@/hooks/useUserWallets.shared';
import type { HomeStackParamList } from '@/navigation/types';

export function ReceiveScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();
  const { ready, url, ethereumAddress, solanaAddress } = useReceivePaymentUrl();
  const { copy, isCopied } = useCopyToClipboard();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.content}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to home"
              accessibilityRole="button"
              hitSlop={8}
              onPress={() => {
                navigation.navigate('index');
              }}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton accessibilityLabel="Back to home" />
          )}
          <Text style={styles.topBarTitle}>Receive</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={styles.body}
          style={styles.flex}
        >
          {!ready || !url ? (
            <ActivityIndicator color="#0f172a" style={styles.loader} />
          ) : (
            <>
              <Text style={styles.subtitle}>
                Scan to pay — opens Confirm with your addresses filled in.
              </Text>

              <View style={styles.qrWrap}>
                <QRCodeStyled
                  data={url}
                  padding={16}
                  size={220}
                  color="#0f172a"
                  style={styles.qr}
                />
              </View>

              <Pressable
                accessibilityLabel={
                  isCopied('url') ? 'Link copied' : 'Copy receive link'
                }
                accessibilityRole="button"
                onPress={() => {
                  void copy(url, 'url');
                }}
                style={({ pressed }) => [
                  styles.copyLinkButton,
                  pressed && styles.copyLinkButtonPressed,
                ]}
              >
                <Ionicons
                  name={isCopied('url') ? 'checkmark' : 'link-outline'}
                  size={18}
                  color={isCopied('url') ? '#15803d' : '#0f172a'}
                />
                <Text
                  style={[
                    styles.copyLinkText,
                    isCopied('url') && styles.copyLinkTextCopied,
                  ]}
                >
                  {isCopied('url') ? 'Link copied' : 'Copy link'}
                </Text>
              </Pressable>

              {ethereumAddress ? (
                <View style={styles.addressBlock}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressLabel}>EVM</Text>
                    <Pressable
                      accessibilityLabel={
                        isCopied('evm')
                          ? 'EVM address copied'
                          : 'Copy EVM address'
                      }
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => {
                        void copy(ethereumAddress, 'evm');
                      }}
                      style={({ pressed }) => [
                        styles.copyButton,
                        pressed && styles.copyButtonPressed,
                      ]}
                    >
                      <Ionicons
                        name={isCopied('evm') ? 'checkmark' : 'copy-outline'}
                        size={18}
                        color={isCopied('evm') ? '#15803d' : '#64748b'}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.addressValue} selectable>
                    {formatWalletAddress(ethereumAddress)}
                  </Text>
                </View>
              ) : null}

              {solanaAddress ? (
                <View style={styles.addressBlock}>
                  <View style={styles.addressHeader}>
                    <Text style={styles.addressLabel}>Solana</Text>
                    <Pressable
                      accessibilityLabel={
                        isCopied('solana')
                          ? 'Solana address copied'
                          : 'Copy Solana address'
                      }
                      accessibilityRole="button"
                      hitSlop={8}
                      onPress={() => {
                        void copy(solanaAddress, 'solana');
                      }}
                      style={({ pressed }) => [
                        styles.copyButton,
                        pressed && styles.copyButtonPressed,
                      ]}
                    >
                      <Ionicons
                        name={
                          isCopied('solana') ? 'checkmark' : 'copy-outline'
                        }
                        size={18}
                        color={isCopied('solana') ? '#15803d' : '#64748b'}
                      />
                    </Pressable>
                  </View>
                  <Text style={styles.addressValue} selectable>
                    {formatWalletAddress(solanaAddress)}
                  </Text>
                </View>
              ) : null}
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  flex: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    minHeight: 44,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#0f172a',
  },
  topBarSpacer: {
    width: 44,
  },
  webBack: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  webBackPressed: {
    opacity: 0.6,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#0f172a',
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 48,
  },
  loader: {
    marginTop: 48,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 22,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: 28,
  },
  qrWrap: {
    backgroundColor: '#ffffff',
    borderRadius: 16,
    padding: 8,
  },
  qr: {
    backgroundColor: '#ffffff',
  },
  copyLinkButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#e2e8f0',
  },
  copyLinkButtonPressed: {
    opacity: 0.85,
  },
  copyLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0f172a',
  },
  copyLinkTextCopied: {
    color: '#15803d',
  },
  addressBlock: {
    width: '100%',
    marginTop: 24,
    gap: 6,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  addressLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748b',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  copyButton: {
    padding: 4,
  },
  copyButtonPressed: {
    opacity: 0.6,
  },
  addressValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#0f172a',
    fontVariant: ['tabular-nums'],
  },
});
