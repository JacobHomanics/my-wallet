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
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/Avatar';
import { BackButton } from '@/components/BackButton';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToSettings } from '@/hooks/usePopToSettings';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useProfilePhotoSettings } from '@/hooks/useProfilePhotoSettings';
import { useUsernameSettings } from '@/hooks/useUsernameSettings';

/**
 * Edit profile photo and username (opened from Settings).
 */
export function ProfileSettingsScreen() {
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

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          {
            paddingTop: Math.max(insets.top, 12),
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        style={styles.scroll}
      >
        <View style={styles.content}>
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
            <Text style={styles.topBarTitle}>Profile Settings</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.sections}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile photo</Text>
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
                      disabled={isUploadingPhoto}
                      hitSlop={8}
                      onPress={() => {
                        void removePhoto();
                      }}
                      style={({ pressed }) => [
                        styles.removePhotoButton,
                        isUploadingPhoto && styles.saveButtonDisabled,
                        pressed &&
                          !isUploadingPhoto &&
                          styles.removePhotoButtonPressed,
                      ]}
                    >
                      <Ionicons name="close" size={14} color="#dc2626" />
                    </Pressable>
                  ) : null}
                </View>
                <Pressable
                  accessibilityRole="button"
                  disabled={isUploadingPhoto}
                  onPress={() => {
                    void pickAndUpload();
                  }}
                  style={({ pressed }) => [
                    styles.photoSaveButton,
                    isUploadingPhoto && styles.saveButtonDisabled,
                    pressed && !isUploadingPhoto && styles.saveButtonPressed,
                  ]}
                >
                  {isUploadingPhoto ? (
                    <ActivityIndicator color="#f0fdf4" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      {profilePhotoUrl ? 'Change photo' : 'Upload photo'}
                    </Text>
                  )}
                </Pressable>
              </View>
              <Text style={styles.hint}>
                Square photos work best. Max 5MB.
              </Text>
              {photoError ? (
                <Text style={styles.error}>{photoError}</Text>
              ) : null}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Username</Text>
              <TextInput
                accessibilityLabel="Username"
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="username"
                editable={!isSavingUsername}
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
              {usernameError ? (
                <Text style={styles.error}>{usernameError}</Text>
              ) : null}
              <Pressable
                accessibilityRole="button"
                disabled={!canSaveUsername}
                onPress={() => {
                  void saveUsername();
                }}
                style={({ pressed }) => [
                  styles.saveButton,
                  !canSaveUsername && styles.saveButtonDisabled,
                  pressed && canSaveUsername && styles.saveButtonPressed,
                ]}
              >
                {isSavingUsername ? (
                  <ActivityIndicator color="#f0fdf4" />
                ) : (
                  <Text style={styles.saveButtonText}>Save username</Text>
                )}
              </Pressable>
            </View>
          </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    width: '100%',
    maxWidth: 640,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 8,
  },
  topBarTitle: {
    flex: 1,
    textAlign: 'center',
    fontSize: 17,
    fontWeight: '600',
    color: '#166534',
  },
  topBarSpacer: {
    width: 44,
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
    color: '#166534',
  },
  sections: {
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  section: {
    width: '100%',
    maxWidth: 420,
    marginTop: 28,
    gap: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  photoBlock: {
    alignItems: 'center',
    gap: 14,
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
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#fecaca',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removePhotoButtonPressed: {
    opacity: 0.7,
  },
  input: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: '#166534',
  },
  hint: {
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
  error: {
    fontSize: 13,
    lineHeight: 18,
    color: '#b91c1c',
  },
  saveButton: {
    alignSelf: 'flex-start',
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  photoSaveButton: {
    alignSelf: 'center',
    backgroundColor: '#166534',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 140,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.45,
  },
  saveButtonPressed: {
    opacity: 0.85,
  },
  saveButtonText: {
    color: '#f0fdf4',
    fontSize: 15,
    fontWeight: '600',
  },
});
