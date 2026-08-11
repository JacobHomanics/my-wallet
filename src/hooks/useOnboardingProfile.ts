import { useMutation } from 'convex/react';
import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useProfilePhotoSettings } from '@/hooks/useProfilePhotoSettings';
import { useUsernameAvailability } from '@/hooks/useUsernameAvailability';
import { useUsernameSettings } from '@/hooks/useUsernameSettings';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { normalizeUsername } from '@/lib/validation';
import { api } from '../../convex/_generated/api';

/**
 * Onboarding continue / skip: save username (photo optional via upload) then
 * mark onboarding complete.
 */
export function useOnboardingProfile() {
  const { user, isReady } = useAuth();
  const completeOnboarding = useMutation(api.users.completeOnboarding);
  const username = useUsernameSettings();
  const availability = useUsernameAvailability(username.draft);
  const photo = useProfilePhotoSettings();
  const [isContinuing, setIsContinuing] = useState(false);
  const [isSkipping, setIsSkipping] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const normalizedDraft = normalizeUsername(username.draft);
  const hasEnteredUsername = normalizedDraft.length > 0;
  const hasUsername = normalizedDraft.length >= 3 && username.isValid;
  // Username is optional: empty allows Continue; a draft must be valid + unique.
  const canContinue =
    !hasEnteredUsername || (hasUsername && availability.isAvailable);
  const isBusy =
    isContinuing || isSkipping || photo.isUploading || username.isSaving;

  const finishOnboarding = useCallback(async () => {
    const externalId = isReady ? getPrivyExternalId(user) : null;
    if (!externalId) {
      throw new Error('Not signed in');
    }
    await completeOnboarding({ externalId });
  }, [completeOnboarding, isReady, user]);

  const continueOnboarding = useCallback(async () => {
    if (!canContinue || isBusy) {
      return false;
    }

    setIsContinuing(true);
    setSubmitError(null);

    try {
      if (username.isDirty) {
        const saved = await username.save();
        if (!saved) {
          return false;
        }
      }

      await finishOnboarding();
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not finish setup';
      setSubmitError(message);
      return false;
    } finally {
      setIsContinuing(false);
    }
  }, [canContinue, finishOnboarding, isBusy, username]);

  const skipOnboarding = useCallback(async () => {
    if (isBusy) {
      return false;
    }

    setIsSkipping(true);
    setSubmitError(null);

    try {
      await finishOnboarding();
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Could not skip setup';
      setSubmitError(message);
      return false;
    } finally {
      setIsSkipping(false);
    }
  }, [finishOnboarding, isBusy]);

  return {
    username,
    photo,
    availability,
    hasUsername,
    canContinue,
    isContinuing,
    isSkipping,
    isBusy,
    submitError,
    continueOnboarding,
    skipOnboarding,
  };
}
