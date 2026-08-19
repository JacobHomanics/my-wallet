import { Ionicons } from '@expo/vector-icons';
import {StyleSheet, 
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import QRCodeStyled from 'react-native-qrcode-styled';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { AccountNumber } from '@/components/AccountNumber';
import { useConvexUsername } from '@/hooks/useConvexUsername';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToHome } from '@/hooks/usePopToHome';
import { useReceiveAddressUrl } from '@/hooks/useReceiveAddressUrl';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/** Share address QR + account number (no amount request). */
export function ReceiveScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goHome = usePopToHome();
  const { ready, url, identityId } = useReceiveAddressUrl();
  const { username } = useConvexUsername();
  const { copy, isCopied } = useCopyToClipboard();

  return (
    <View style={[styles.container, { paddingTop: Math.max(insets.top, 12) }]}>
      <View style={styles.shell}>
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to home"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goHome}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to home"
              onPress={goHome}
            />
          )}
          <Text style={styles.topBarTitle}>Receive</Text>
          <View style={styles.topBarSpacer} />
        </View>

        <ScrollView
          contentContainerStyle={[
            styles.body,
            { paddingBottom: Math.max(insets.bottom, 16) + 40 },
          ]}
          style={styles.flex}
        >
          {!ready || !url ? (
            <ActivityIndicator color={colors.primary} style={styles.loader} />
          ) : (
            <>
              <View style={styles.qrWrap}>
                <QRCodeStyled
                  data={url}
                  padding={16}
                  size={180}
                  color={colors.primary}
                  style={styles.qr}
                />
              </View>

              {username || identityId ? (
                <View style={styles.identitySection}>
                  {username ? (
                    <AccountNumber
                      username={username}
                      style={styles.accountNumber}
                    />
                  ) : null}
                  {identityId ? (
                    <AccountNumber
                      identityId={identityId}
                      style={styles.accountNumber}
                    />
                  ) : null}
                </View>
              ) : null}

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
                  color={isCopied('url') ? '#15803d' : '#166534'}
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
            </>
          )}
        </ScrollView>
      </View>
    </View>
  );
}

function createStyles(c: ThemeColors) {
  return StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: c.bg,
  },
  flex: {
    flex: 1,
  },
  shell: {
    flex: 1,
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
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
    color: c.primary,
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
    color: c.primary,
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  loader: {
    marginTop: 48,
  },
  qrWrap: {
    backgroundColor: c.surface,
    borderRadius: 16,
    padding: 8,
  },
  qr: {
    backgroundColor: c.surface,
  },
  identitySection: {
    width: '100%',
    marginTop: 20,
    gap: 10,
    alignItems: 'center',
  },
  accountNumber: {
    marginTop: 0,
  },
  copyLinkButton: {
    marginTop: 20,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#d1fae5',
  },
  copyLinkButtonPressed: {
    opacity: 0.85,
  },
  copyLinkText: {
    fontSize: 15,
    fontWeight: '600',
    color: c.primary,
  },
  copyLinkTextCopied: {
    color: c.success,
  },
});
}
