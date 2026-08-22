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
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { Avatar } from '@/components/Avatar';
import { useAppLayout } from '@/hooks/useAppLayout';
import { useNeedsOnboarding } from '@/hooks/useNeedsOnboarding';
import { useOnboardingProfile } from '@/hooks/useOnboardingProfile';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import type { RootStackParamList } from '@/navigation/types';
import { useThemedStyles } from '@/hooks/useThemedStyles';
import type { ThemeColors } from '@/theme/types';
import { useThemeColors } from '@/hooks/useThemeColors';

/**
 * First-time setup for username + optional profile photo. Skippable.
 */
export function OnboardingScreen() {
  const colors = useThemeColors();
  const styles = useThemedStyles(createStyles);

  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status: onboardingStatus, isLoading: isOnboardingLoading } =
    useNeedsOnboarding();
  const { hasAppLayoutBeenSet } = useAppLayout();
  const { displayName, avatarSeed } = useProfileIdentity();
  const {
    username,
    photo,
    availability,
    canContinue,
    isContinuing,
    isSkipping,
    isBusy,
    submitError,
    continueOnboarding,
    skipOnboarding,
  } = useOnboardingProfile();

  const goMain = () => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    navigation.reset({
      index: 0,
      routes: [
        { name: hasAppLayoutBeenSet ? 'main' : 'chooseAppLayout' },
      ],
    });
  };

  const readyForActions =
    onboardingStatus === 'needed' || onboardingStatus === 'done';

  const continueEnabled = readyForActions && canContinue && !isBusy;

  const onContinue = () => {
    if (!continueEnabled) {
      return;
    }
    void (async () => {
      const ok = await continueOnboarding();
      if (ok) {
        goMain();
      }
    })();
  };

  const onSkip = () => {
    if (!readyForActions) {
      return;
    }
    void (async () => {
      const ok = await skipOnboarding();
      if (ok) {
        goMain();
      }
    })();
  };

  const errorMessage =
    submitError || username.errorMessage || photo.errorMessage;

  if (isOnboardingLoading || onboardingStatus === 'idle') {
    return (
      <View style={[styles.container, styles.loading]}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          {
            paddingTop: Math.max(insets.top, 24) + 24,
            paddingBottom: Math.max(insets.bottom, 24) + 24,
          },
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.title}>Set up your profile</Text>
        <Text style={styles.prompt}>
          Pick a username and set a profile photo so friends can easily find you and send money.
        </Text>

        <View style={styles.photoBlock}>
          <View style={styles.avatarWrap}>
            <Avatar
              label={displayName}
              photoUrl={photo.profilePhotoUrl}
              seed={avatarSeed}
              size={112}
            />
            {photo.canRemove ? (
              <Pressable
                accessibilityLabel="Remove profile photo"
                accessibilityRole="button"
                disabled={isBusy}
                hitSlop={8}
                onPress={() => {
                  void photo.remove();
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
              void photo.pickAndUpload();
            }}
            style={({ pressed }) => [
              styles.secondaryButton,
              isBusy && styles.buttonDisabled,
              pressed && !isBusy && styles.secondaryButtonPressed,
            ]}
          >
            {photo.isUploading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {photo.profilePhotoUrl ? 'Change photo' : 'Add photo'}
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
            onChangeText={username.onChangeDraft}
            placeholder="Choose a username"
            placeholderTextColor="#86a894"
            style={styles.input}
            value={username.draft}
          />
          <Text style={styles.hint}>
            3–24 characters: letters, numbers, or underscores.
          </Text>
          {username.draft.trim().length > 0 && !username.isValid ? (
            <Text style={styles.error}>Enter a valid username.</Text>
          ) : null}
          {availability.status === 'checking' ? (
            <Text style={styles.hint}>Checking availability…</Text>
          ) : null}
          {availability.status === 'available' ? (
            <Text style={styles.available}>Username is available.</Text>
          ) : null}
          {availability.status === 'taken' ? (
            <Text style={styles.error}>Username already taken.</Text>
          ) : null}
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!continueEnabled}
          onPress={onContinue}
          style={({ pressed }) => [
            styles.continueButton,
            !continueEnabled && styles.buttonDisabled,
            pressed && continueEnabled && styles.continueButtonPressed,
          ]}
        >
          {isContinuing ? (
            <ActivityIndicator color={colors.primaryText} />
          ) : (
            <Text style={styles.continueButtonText}>Continue</Text>
          )}
        </Pressable>

        <Pressable
          accessibilityRole="button"
          disabled={!readyForActions || isBusy}
          onPress={onSkip}
          style={({ pressed }) => [
            styles.skipButton,
            pressed && readyForActions && !isBusy && styles.skipButtonPressed,
          ]}
        >
          {isSkipping ? (
            <ActivityIndicator color={colors.textMuted} />
          ) : (
            <Text style={styles.skipButtonText}>Skip for now</Text>
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
  loading: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    width: '100%',
    maxWidth: 420,
    alignSelf: 'center',
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: c.primary,
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  prompt: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: c.textSecondary,
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
  continueButton: {
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
  continueButtonPressed: {
    opacity: 0.85,
  },
  continueButtonText: {
    color: c.primaryText,
    fontSize: 16,
    fontWeight: '600',
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
  buttonDisabled: {
    opacity: 0.45,
  },
  skipButton: {
    marginTop: 16,
    paddingVertical: 10,
    paddingHorizontal: 12,
    minHeight: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  skipButtonPressed: {
    opacity: 0.65,
  },
  skipButtonText: {
    fontSize: 15,
    fontWeight: '500',
    color: c.textMuted,
    textDecorationLine: 'underline',
  },
});
}
