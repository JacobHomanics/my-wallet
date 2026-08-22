import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import {
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { AccountNumber } from '@/components/AccountNumber';
import { AccountNumberWalletDetails } from '@/components/AccountNumberWalletDetails';
import { Avatar } from '@/components/Avatar';
import { IconButton } from '@/components/IconButton';
import { useConvexUsername } from '@/hooks/useConvexUsername';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { useWalletIdentityId } from '@/hooks/useWalletIdentityId';
import type { ProfileStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';

export function ProfileScreen() {
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<ProfileStackParamList>>();
  const { displayName, avatarSeed, email, phone } = useProfileIdentity();
  const { profilePhotoUrl } = useProfilePhoto();
  const { username } = useConvexUsername();
  const { identityId } = useWalletIdentityId();

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

        <View style={styles.section}>
          {phone ? (
            <AccountNumber phone={phone} style={styles.accountNumber} />
          ) : null}
          <AccountNumberWalletDetails
            identityId={identityId}
            style={styles.accountNumber}
          />
        </View>
      </ScrollView>
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
});
}
