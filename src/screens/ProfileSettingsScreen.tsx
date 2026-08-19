import { Ionicons } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToSettings } from '@/hooks/usePopToSettings';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useProfilePhotoSettings } from '@/hooks/useProfilePhotoSettings';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { useUsernameSettings } from '@/hooks/useUsernameSettings';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * Edit profile photo and username (opened from Settings).
 * Layout mirrors the first-time onboarding screen.
 */
export function ProfileSettingsScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goSettings = usePopToSettings();
  const { displayName, avatarSeed } = useProfileIdentity();
  const {
    profilePhotoUrl,
    isUploading: isUploadingPhoto,
    errorMessage: photoError,
    pickAndUpload,
    remove: removePhoto,
    canRemove: canRemovePhoto,
  } = useProfilePhotoSettings();
  const {
    draft: usernameDraft,
    onChangeDraft: onChangeUsername,
    save: saveUsername,
    canSave: canSaveUsername,
    isSaving: isSavingUsername,
    errorMessage: usernameError,
    isDirty: usernameDirty,
    isValid: usernameValid,
  } = useUsernameSettings();
  const availability = useUsernameAvailability(usernameDraft);

  const isBusy = isUploadingPhoto || isSavingUsername;
  const hasEnteredUsername = usernameDraft.trim().length > 0;
  const usernameOk =
    !hasEnteredUsername ||
    (usernameValid &&
      (!usernameDirty || availability.isAvailable));
  const canSave =
    canSaveUsername &&
    usernameOk &&
    !availability.isChecking &&
    !isBusy;

  const errorMessage = usernameError || photoError;

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.topBar}>
          {isDesktopWeb ? (
            <Pressable
              accessibilityLabel="Back to settings"
              accessibilityRole="button"
              hitSlop={8}
              onPress={goSettings}
              style={({ pressed }) => [
                styles.webBack,
                pressed && styles.webBackPressed,
              ]}
            >
              <Text style={styles.webBackText}>Back</Text>
            </Pressable>
          ) : (
            <BackButton
              accessibilityLabel="Back to settings"
              onPress={goSettings}
            />
          )}
          <View style={styles.topBarSpacer} />
        </View>

        <Text style={styles.title}>Profile settings</Text>

        <View style={styles.photoBlock}>
          <View style={styles.avatarWrap}>
            <Avatar
              label={displayName}
              photoUrl={profilePhotoUrl}
              seed={avatarSeed}
              size={112}
            />
            {canRemovePhoto ? (
              <Pressable
                accessibilityLabel="Remove profile photo"
                accessibilityRole="button"
                disabled={isBusy}
                hitSlop={8}
                onPress={() => {
                  void removePhoto();
                }}
                style={({ pressed }) => [
                  styles.removePhotoButton,
                  isBusy && styles.buttonDisabled,
                  pressed && !isBusy && styles.removePhotoButtonPressed,
                ]}
              >
                <Ionicons name="close" size={14} color="#dc2626" />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            disabled={isBusy}
            onPress={() => {
              void pickAndUpload();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              isBusy && styles.buttonDisabled,
              pressed && !isBusy && styles.secondaryButtonPressed,
            ]}
          >
            {isUploadingPhoto ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {profilePhotoUrl ? 'Change photo' : 'Add photo'}
              </Text>
            )}
          </Pressable>
        </View>

        <View style={styles.field}>
          <Text style={styles.label}>Username</Text>
          <TextInput
            accessibilityLabel="Username"
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="username"
            editable={!isBusy}
            onChangeText={onChangeUsername}
            placeholder="Choose a username"
            placeholderTextColor="#86a894"
            style={styles.input}
            value={usernameDraft}
          />
          <Text style={styles.hint}>
            3–24 characters: letters, numbers, or underscores.
          </Text>
          {usernameDirty && !usernameValid ? (
            <Text style={styles.error}>Enter a valid username.</Text>
          ) : null}
          {availability.status === 'checking' ? (
            <Text style={styles.hint}>Checking availability…</Text>
          ) : null}
          {usernameDirty && availability.status === 'available' ? (
            <Text style={styles.available}>Username is available.</Text>
          ) : null}
          {availability.status === 'taken' ? (
            <Text style={styles.error}>Username already taken.</Text>
          ) : null}
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!canSave}
          onPress={() => {
            void saveUsername();
          }}
          style={({ pressed }) => [
            styles.saveButton,
            !canSave && styles.buttonDisabled,
            pressed && canSave && styles.saveButtonPressed,
          ]}
        >
          {isSavingUsername ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.saveButtonText}>Save username</Text>
          )}
        </Pressable>
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
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  topBar: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  topBarSpacer: {
    flex: 1,
  },
  webBack: {
    minWidth: 44,
    paddingHorizontal: 8,
    paddingVertical: 10,
    justifyContent: 'center',
  },
  webBackPressed: {
    opacity: 0.7,
  },
  webBackText: {
    fontSize: 16,
    fontWeight: '600',
    color: c.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  photoBlock: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  avatarWrap: {
    width: 112,
    height: 112,
    marginBottom: 8,
    alignItems: 'center',
    justifyContent: 'flex-end',
    overflow: 'visible',
  },
  removePhotoButton: {
    position: 'absolute',
    bottom: -10,
    alignSelf: 'center',
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoButtonPressed: {
    opacity: 0.7,
  },
  field: {
    width: '100%',
    marginTop: 28,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: c.textMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  input: {
    width: '100%',
    backgroundColor: c.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: c.rowBorder,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: c.primary,
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: c.textSubtle,
    textAlign: 'center',
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: c.danger,
    textAlign: 'center',
  },
  available: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: c.primary,
    textAlign: 'center',
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: c.surfaceMuted,
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    color: c.primary,
    fontSize: 15,
    fontWeight: '600',
  },
  saveButton: {
    marginTop: 32,
    width: '100%',
    backgroundColor: c.primary,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    minHeight: 52,
    justifyContent: 'center',
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: c.primaryText,
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.45,
  },
});
}
