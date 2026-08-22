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
  const { showAdvanced, toggleAdvanced } = useShowAdvanced();
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
        {email || phone ? null : (
          <Text style={styles.subtitle}>Signed in as {displayName}.</Text>
        )}

        {email || phone || username || identityId ? (
          <View style={styles.section}>
            {email ? (
              <AccountNumber email={email} style={styles.accountNumber} />
            ) : phone ? (
              <AccountNumber phone={phone} style={styles.accountNumber} />
            ) : null}
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
          accessibilityRole="button"
          accessibilityState={{ expanded: showAdvanced }}
          onPress={toggleAdvanced}
          style={({ pressed }) => [
            styles.advancedToggle,
            pressed && styles.advancedTogglePressed,
          ]}
        >
          <Text style={styles.advancedToggleText}>
            {showAdvanced ? 'Hide advanced details' : 'Show advanced details'}
          </Text>
          <Ionicons
            name={showAdvanced ? 'chevron-up' : 'chevron-down'}
            size={16}
            color={colors.textMuted}
          />
        </Pressable>

        {showAdvanced ? (
          <View style={styles.advancedSection}>
            <Text style={styles.sectionTitle}>Wallet</Text>
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
    marginBottom: 16,
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
  advancedToggle: {
    marginTop: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  advancedTogglePressed: {
    opacity: 0.65,
  },
  advancedToggleText: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
  },
  advancedSection: {
    width: '100%',
    maxWidth: 420,
    marginTop: 8,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
