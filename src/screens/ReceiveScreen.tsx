import { Ionicons } from '@expo/vector-icons';
import { useCallback } from 'react';
import {StyleSheet, 
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { BackButton } from '@/components/BackButton';
import { AccountNumber } from '@/components/AccountNumber';
import { ReceiveQrCode } from '@/components/ReceiveQrCode';
import { SignUpLoginPromptModal } from '@/components/SignUpLoginPromptModal';
import { useAuthGatedAction } from '@/hooks/useAuthGatedAction';
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
  const { ready, url, identityId, isPreview, username: previewUsername } =
    useReceiveAddressUrl();
  const { username: convexUsername } = useConvexUsername();
  const username = previewUsername ?? convexUsername;
  const { copy, isCopied } = useCopyToClipboard();
  const copyReceiveLink = useCallback(() => {
    if (!url) {
      return;
    }
    void copy(url, 'url');
  }, [copy, url]);
  const {
    run: onPressCopyLink,
    openAuthPrompt,
    authPromptOpen,
    closeAuthPrompt,
    confirmAuthPrompt,
  } = useAuthGatedAction(copyReceiveLink);

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
              <ReceiveQrCode data={url} isPreview={isPreview} size={180} />

              {username || identityId ? (
                <View style={styles.identitySection}>
                  {username ? (
                    <AccountNumber
                      username={username}
                      isPreview={isPreview}
                      onCopyPress={isPreview ? openAuthPrompt : undefined}
                      style={styles.accountNumber}
                    />
                  ) : null}
                  {identityId ? (
                    <AccountNumber
                      identityId={identityId}
                      isPreview={isPreview}
                      onCopyPress={isPreview ? openAuthPrompt : undefined}
                      style={styles.accountNumber}
                    />
                  ) : null}
                </View>
              ) : null}

              <Pressable
                accessibilityLabel={
                  isPreview
                    ? 'Sign up / Login'
                    : isCopied('url')
                      ? 'Link copied'
                      : 'Copy receive link'
                }
                accessibilityRole="button"
                onPress={isPreview ? openAuthPrompt : onPressCopyLink}
                style={({ pressed }) => [
                  styles.copyLinkButton,
                  pressed && styles.copyLinkButtonPressed,
                ]}
              >
                <Ionicons
                  name={
                    isPreview
                      ? 'log-in-outline'
                      : isCopied('url')
                        ? 'checkmark'
                        : 'link-outline'
                  }
                  size={18}
                  color={isCopied('url') && !isPreview ? '#15803d' : '#166534'}
                />
                <Text
                  style={[
                    styles.copyLinkText,
                    isCopied('url') && !isPreview && styles.copyLinkTextCopied,
                  ]}
                >
                  {isPreview
                    ? 'Sign up / Login'
                    : isCopied('url')
                      ? 'Link copied'
                      : 'Copy link'}
                </Text>
              </Pressable>
            </>
          )}
        </ScrollView>
      </View>
      <SignUpLoginPromptModal
        visible={authPromptOpen}
        onCancel={closeAuthPrompt}
        onConfirm={confirmAuthPrompt}
      />
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
