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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountNumber } from '@/components/AccountNumber';
import { Avatar } from '@/components/Avatar';
import { ConfirmExportPrivateKeyModal } from '@/components/ConfirmExportPrivateKeyModal';
import { ExportPrivateKeyWebView } from '@/components/ExportPrivateKeyWebView';
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

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { displayName, avatarSeed } = useProfileIdentity();
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
      <Pressable
        accessibilityLabel="Settings"
        accessibilityRole="button"
        hitSlop={12}
        onPress={() => {
          navigation.navigate('settings');
        }}
        style={({ pressed }) => [
          styles.settingsButton,
          {
            top: Math.max(insets.top, 12),
            left: Math.max(insets.left, 12),
          },
          pressed && styles.settingsButtonPressed,
        ]}
      >
        <Ionicons name="settings-outline" size={24} color="#166534" />
      </Pressable>

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
        <Text style={styles.title}>Profile</Text>
        <Text style={styles.subtitle}>Signed in as {displayName}.</Text>
        {username ? (
          <Text style={styles.username}>@{username}</Text>
        ) : null}

        {identityId ? (
          <View style={styles.section}>
            <AccountNumber
              identityId={identityId}
              style={styles.accountNumber}
            />
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
            color="#5a7d6a"
          />
        </Pressable>

        {showAdvanced ? (
          <View style={styles.advancedSection}>
            <Text style={styles.sectionTitle}>Wallet</Text>
            {!ready ? (
              <ActivityIndicator color="#166534" style={styles.loader} />
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  settingsButton: {
    position: 'absolute',
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingsButtonPressed: {
    opacity: 0.76,
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
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#166534',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#3f6b52',
    textAlign: 'center',
  },
  username: {
    marginTop: 4,
    fontSize: 15,
    fontWeight: '600',
    lineHeight: 22,
    color: '#166534',
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
    color: '#5a7d6a',
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
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  loader: {
    marginTop: 8,
  },
  empty: {
    fontSize: 15,
    color: '#86a894',
  },
});
