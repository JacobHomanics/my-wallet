import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {StyleSheet, 
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountNumber } from '@/components/AccountNumber';
import { Avatar } from '@/components/Avatar';
import { ConfirmExportPrivateKeyModal } from '@/components/ConfirmExportPrivateKeyModal';
import { ExportPrivateKeyWebView } from '@/components/ExportPrivateKeyWebView';
import { IconButton } from '@/components/IconButton';
import { WalletDebitCard } from '@/components/WalletDebitCard';
import { useAppLayout } from '@/hooks/useAppLayout';
import { useConfirmExportPrivateKey } from '@/hooks/useConfirmExportPrivateKey';
import { useConvexUsername } from '@/hooks/useConvexUsername';
import { useCopyToClipboard } from '@/hooks/useCopyToClipboard';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { useShowAdvanced } from '@/hooks/useShowAdvanced';
import { useUserWallets } from '@/hooks/useUserWallets';
import { useWalletIdentityId } from '@/hooks/useWalletIdentityId';
import type { ProfileStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

export function ProfileScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { displayName, avatarSeed, email, phone } = useProfileIdentity();
  const { profilePhotoUrl } = useProfilePhoto();
  const { username } = useConvexUsername();
  const { identityId } = useWalletIdentityId();
  const { isAdvanced } = useAppLayout();
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
  const showWallets = isAdvanced || showAdvanced;
  const { ready, wallets } = useUserWallets();
  const { copy, isCopied } = useCopyToClipboard();
  const {
    pendingWallet,
    confirmVisible,
    requestExport,
    cancelConfirm,
    confirmExport,
    exportWebViewUri,
    closeExportWebView,
  } = useConfirmExportPrivateKey();

  const advancedDetailsFooter = isAdvanced ? null : (
    <Pressable
      accessibilityRole="link"
      accessibilityState={{ expanded: showAdvanced }}
      hitSlop={8}
      onPress={toggleAdvanced}
      style={({ pressed }) => [
        styles.detailsLink,
        pressed && styles.detailsLinkPressed,
      ]}
    >
      <Text style={styles.detailsLinkText}>
        {showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
      </Text>
      <Ionicons
        name={showAdvanced ? 'chevron-up' : 'chevron-down'}
        size={16}
        color={colors.textMuted}
      />
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <IconButton
        accessibilityLabel="Settings"
        hitSlop={12}
        icon="settings-outline"
        iconSize={24}
        onPress={() => {
          navigation.navigate('settings');
        }}
        style={[
          styles.settingsButton,
          {
            top: Math.max(insets.top, 12),
            left: Math.max(insets.left, 12),
          },
        ]}
      />

      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12) + 12,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
            paddingLeft: Math.max(insets.left, 24),
            paddingRight: Math.max(insets.right, 24),
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <Avatar
          label={displayName}
          photoUrl={profilePhotoUrl}
          seed={avatarSeed}
          size={88}
          style={styles.avatar}
        />
        {username ? (
          <Text style={styles.username} selectable>
            @{username}
          </Text>
        ) : email ? null : (
          <Text style={styles.subtitle}>Signed in as {displayName}.</Text>
        )}

        {phone || identityId || advancedDetailsFooter ? (
          <View style={styles.section}>
            {phone ? (
              <AccountNumber phone={phone} style={styles.accountNumber} />
            ) : null}
            {identityId ? (
              <AccountNumber
                identityId={identityId}
                footer={advancedDetailsFooter}
                style={styles.accountNumber}
              />
            ) : (
              advancedDetailsFooter
            )}
          </View>
        ) : null}

        {showWallets ? (
          <View
            style={[
              styles.advancedSection,
              isAdvanced && styles.advancedSectionAuto,
            ]}
          >
            {!ready ? (
              <ActivityIndicator color={colors.primary} style={styles.loader} />
            ) : wallets.length === 0 ? (
              <Text style={styles.empty}>Creating your wallet…</Text>
            ) : (
              wallets.map((wallet) => {
                const walletKey = `${wallet.chain}-${wallet.address}`;

                return (
                  <WalletDebitCard
                    key={walletKey}
                    wallet={wallet}
                    accountLabel={displayName}
                    copied={isCopied(walletKey)}
                    onCopy={() => {
                      void copy(wallet.address, walletKey);
                    }}
                    onExport={() => {
                      requestExport(wallet);
                    }}
                  />
                );
              })
            )}
          </View>
        ) : null}
      </ScrollView>

      <ConfirmExportPrivateKeyModal
        visible={confirmVisible}
        walletLabel={pendingWallet?.label ?? ''}
        onCancel={cancelConfirm}
        onConfirm={confirmExport}
      />

      <ExportPrivateKeyWebView
        onClose={closeExportWebView}
        uri={exportWebViewUri}
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
  settingsButton: {
    position: 'absolute',
    zIndex: 2,
  },
  scroll: {
    flex: 1,
  },
  content: {
    alignItems: 'center',
  },
  avatar: {
    marginBottom: 12,
  },
  username: {
    fontSize: 22,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.4,
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: c.textSecondary,
    textAlign: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 420,
    marginTop: 28,
    gap: 12,
  },
  accountNumber: {
    maxWidth: '100%',
    alignSelf: 'stretch',
  },
  detailsLink: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  detailsLinkPressed: {
    opacity: 0.6,
  },
  detailsLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: c.textMuted,
    textDecorationLine: 'underline',
  },
  advancedSection: {
    width: '100%',
    maxWidth: 420,
    marginTop: 20,
    gap: 12,
  },
  advancedSectionAuto: {
    marginTop: 28,
  },
  loader: {
    marginTop: 8,
  },
  empty: {
    fontSize: 15,
    color: c.textSubtle,
  },
});
}
