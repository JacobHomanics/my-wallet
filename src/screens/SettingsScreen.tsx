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
import { ChainPriorityPickerModal } from '@/components/ChainPriorityPickerModal';
import { DisplayCurrencyPickerModal } from '@/components/DisplayCurrencyPickerModal';
import { StrategyPickerModal } from '@/components/StrategyPickerModal';
import { useChainPriorityPicker } from '@/hooks/useChainPriorityPicker';
import { useDisplayCurrencyPicker } from '@/hooks/useDisplayCurrencyPicker';
import { useIsDesktopWeb } from '@/hooks/useIsDesktopWeb';
import { usePopToProfile } from '@/hooks/usePopToProfile';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import { useProfilePhotoSettings } from '@/hooks/useProfilePhotoSettings';
import { useStrategyPicker } from '@/hooks/useStrategyPicker';
import { useSignOut } from '@/hooks/useSignOut';
import { useUsernameSettings } from '@/hooks/useUsernameSettings';

export function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const isDesktopWeb = useIsDesktopWeb();
  const goProfile = usePopToProfile();
  const { displayName, avatarSeed } = useProfileIdentity();
  const { signOut } = useSignOut();
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
  const {
    strategies,
    selectedStrategy,
    selectedStrategyId,
    pickerOpen,
    openPicker,
    closePicker,
    onSelectStrategy,
  } = useStrategyPicker();
  const {
    options: chainPriorityOptions,
    selectedOption: selectedChainPriority,
    selectedChainPriorityId,
    pickerOpen: chainPriorityPickerOpen,
    openPicker: openChainPriorityPicker,
    closePicker: closeChainPriorityPicker,
    onSelectOption: onSelectChainPriority,
  } = useChainPriorityPicker();
  const {
    options: displayCurrencyOptions,
    selectedCurrency,
    selectedDisplayCurrencyId,
    pickerOpen: displayCurrencyPickerOpen,
    openPicker: openDisplayCurrencyPicker,
    closePicker: closeDisplayCurrencyPicker,
    onSelectOption: onSelectDisplayCurrency,
  } = useDisplayCurrencyPicker();

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
                accessibilityLabel="Back to profile"
                accessibilityRole="button"
                hitSlop={8}
                onPress={goProfile}
                style={({ pressed }) => [
                  styles.webBack,
                  pressed && styles.webBackPressed,
                ]}
              >
                <Text style={styles.webBackText}>Back</Text>
              </Pressable>
            ) : (
              <BackButton
                accessibilityLabel="Back to profile"
                onPress={goProfile}
              />
            )}
            <Text style={styles.topBarTitle}>Settings</Text>
            <View style={styles.topBarSpacer} />
          </View>

          <View style={styles.sections}>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Profile photo</Text>
              <View style={styles.photoRow}>
                <Avatar
                  label={displayName}
                  photoUrl={profilePhotoUrl}
                  seed={avatarSeed}
                  size={72}
                />
                <View style={styles.photoActions}>
                  <Pressable
                    accessibilityRole="button"
                    disabled={isUploadingPhoto}
                    onPress={() => {
                      void pickAndUpload();
                    }}
                    style={({ pressed }) => [
                      styles.saveButton,
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
                  {canRemovePhoto ? (
                    <Pressable
                      accessibilityRole="button"
                      disabled={isUploadingPhoto}
                      onPress={() => {
                        void removePhoto();
                      }}
                      style={({ pressed }) => [
                        styles.removePhotoButton,
                        pressed && styles.removePhotoButtonPressed,
                      ]}
                    >
                      <Text style={styles.removePhotoButtonText}>Remove</Text>
                    </Pressable>
                  ) : null}
                </View>
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

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Display currency</Text>
              <Pressable
                accessibilityLabel={`Display currency ${selectedCurrency.label}`}
                accessibilityRole="button"
                onPress={openDisplayCurrencyPicker}
                style={({ pressed }) => [
                  styles.strategyRow,
                  pressed && styles.strategyRowPressed,
                ]}
              >
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>
                    {selectedCurrency.label} ({selectedCurrency.code})
                  </Text>
                  <Text style={styles.strategyDescription}>
                    {selectedCurrency.description}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#86a894" />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Default strategy</Text>
              <Pressable
                accessibilityLabel={`Default strategy ${selectedStrategy.label}`}
                accessibilityRole="button"
                onPress={openPicker}
                style={({ pressed }) => [
                  styles.strategyRow,
                  pressed && styles.strategyRowPressed,
                ]}
              >
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>
                    {selectedStrategy.label}
                  </Text>
                  <Text style={styles.strategyDescription}>
                    {selectedStrategy.description}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#86a894" />
              </Pressable>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Chain priority</Text>
              <Pressable
                accessibilityLabel={`Chain priority ${selectedChainPriority.label}`}
                accessibilityRole="button"
                onPress={openChainPriorityPicker}
                style={({ pressed }) => [
                  styles.strategyRow,
                  pressed && styles.strategyRowPressed,
                ]}
              >
                <View style={styles.strategyRowText}>
                  <Text style={styles.strategyLabel}>
                    {selectedChainPriority.label}
                  </Text>
                  <Text style={styles.strategyDescription}>
                    {selectedChainPriority.description}
                  </Text>
                </View>
                <Ionicons name="chevron-down" size={18} color="#86a894" />
              </Pressable>
            </View>

            <Pressable
              accessibilityRole="button"
              onPress={() => {
                void signOut();
              }}
              style={({ pressed }) => [
                styles.logoutButton,
                pressed && styles.logoutButtonPressed,
              ]}
            >
              <Text style={styles.logoutButtonText}>Log out</Text>
            </Pressable>
          </View>
        </View>
      </ScrollView>

      <StrategyPickerModal
        onClose={closePicker}
        onSelect={onSelectStrategy}
        selectedStrategyId={selectedStrategyId}
        strategies={strategies}
        visible={pickerOpen}
      />

      <ChainPriorityPickerModal
        onClose={closeChainPriorityPicker}
        onSelect={onSelectChainPriority}
        options={chainPriorityOptions}
        selectedChainPriorityId={selectedChainPriorityId}
        visible={chainPriorityPickerOpen}
      />

      <DisplayCurrencyPickerModal
        onClose={closeDisplayCurrencyPicker}
        onSelect={onSelectDisplayCurrency}
        options={displayCurrencyOptions}
        selectedDisplayCurrencyId={selectedDisplayCurrencyId}
        visible={displayCurrencyPickerOpen}
      />
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
  photoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  photoActions: {
    flex: 1,
    gap: 8,
  },
  removePhotoButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  removePhotoButtonPressed: {
    opacity: 0.7,
  },
  removePhotoButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#b91c1c',
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
  strategyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ffffff',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: '#d1fae5',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  strategyRowPressed: {
    opacity: 0.85,
  },
  strategyRowText: {
    flex: 1,
    minWidth: 0,
    gap: 4,
  },
  strategyLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#166534',
  },
  strategyDescription: {
    fontSize: 13,
    lineHeight: 18,
    color: '#86a894',
  },
  logoutButton: {
    width: '100%',
    maxWidth: 420,
    marginTop: 32,
    backgroundColor: '#166534',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  logoutButtonPressed: {
    opacity: 0.85,
  },
  logoutButtonText: {
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
});
