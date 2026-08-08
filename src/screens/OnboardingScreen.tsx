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

import { Avatar } from '@/components/Avatar';
import { useNeedsOnboarding } from '@/hooks/useNeedsOnboarding';
import { useOnboardingProfile } from '@/hooks/useOnboardingProfile';
import { useProfileIdentity } from '@/hooks/useProfileIdentity';
import type { RootStackParamList } from '@/navigation/types';

/**
 * First-time setup for username + optional profile photo. Skippable.
 */
export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const navigation =
    useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { status: onboardingStatus, isLoading: isOnboardingLoading } =
    useNeedsOnboarding();
  const { displayName, avatarSeed } = useProfileIdentity();
  const {
    username,
    photo,
    hasUsername,
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
      routes: [{ name: 'main' }],
    });
  };

  const readyForActions =
    onboardingStatus === 'needed' || onboardingStatus === 'done';

  const onContinue = () => {
    if (!readyForActions) {
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
        <ActivityIndicator color="#166534" size="large" />
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
          <Avatar
            label={displayName}
            photoUrl={photo.profilePhotoUrl}
            seed={avatarSeed}
            size={88}
          />
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
              <ActivityIndicator color="#166534" />
            ) : (
              <Text style={styles.secondaryButtonText}>
                {photo.profilePhotoUrl ? 'Change photo' : 'Add photo'}
              </Text>
            )}
          </Pressable>
          <Text style={styles.hint}>Optional. Square photos work best.</Text>
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
        </View>

        {errorMessage ? <Text style={styles.error}>{errorMessage}</Text> : null}

        <Pressable
          accessibilityRole="button"
          disabled={!readyForActions || !hasUsername || isBusy}
          onPress={onContinue}
          style={({ pressed }) => [
            styles.continueButton,
            (!readyForActions || !hasUsername || isBusy) &&
            styles.buttonDisabled,
            pressed &&
            readyForActions &&
            hasUsername &&
            !isBusy &&
            styles.continueButtonPressed,
          ]}
        >
          {isContinuing ? (
            <ActivityIndicator color="#f0fdf4" />
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
            <ActivityIndicator color="#5a7d6a" />
          ) : (
            <Text style={styles.skipButtonText}>Skip for now</Text>
          )}
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0fdf4',
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
    color: '#166534',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  prompt: {
    marginTop: 12,
    fontSize: 16,
    lineHeight: 24,
    color: '#3f6b52',
    textAlign: 'center',
  },
  photoBlock: {
    marginTop: 32,
    alignItems: 'center',
    gap: 12,
  },
  field: {
    width: '100%',
    marginTop: 28,
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#5a7d6a',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
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
    textAlign: 'center',
  },
  error: {
    marginTop: 8,
    fontSize: 13,
    lineHeight: 18,
    color: '#b91c1c',
    textAlign: 'center',
  },
  continueButton: {
    marginTop: 32,
    width: '100%',
    backgroundColor: '#166534',
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
    color: '#f0fdf4',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#dcfce7',
    minWidth: 140,
    alignItems: 'center',
  },
  secondaryButtonPressed: {
    opacity: 0.85,
  },
  secondaryButtonText: {
    color: '#166534',
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
    color: '#5a7d6a',
    textDecorationLine: 'underline',
  },
});
