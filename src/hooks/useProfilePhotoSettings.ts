import { useMutation } from 'convex/react';
import * as ImagePicker from 'expo-image-picker';
import { useCallback, useState } from 'react';

import { useAuth } from '@/hooks/useAuth';
import { useProfilePhoto } from '@/hooks/useProfilePhoto';
import { getPrivyExternalId } from '@/lib/convex/getPrivyExternalId';
import { api } from '../../convex/_generated/api';
import type { Id } from '../../convex/_generated/dataModel';

const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

/**
 * Pick / upload / clear the signed-in user's Convex profile photo.
 */
export function useProfilePhotoSettings() {
  const { user, isReady } = useAuth();
  const { profilePhotoUrl, isLoading } = useProfilePhoto();
  const generateUploadUrl = useMutation(api.users.generateUploadUrl);
  const setProfilePhoto = useMutation(api.users.setProfilePhoto);
  const clearProfilePhoto = useMutation(api.users.clearProfilePhoto);

  const [isUploading, setIsUploading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const resolveExternalId = useCallback(() => {
    const externalId = isReady ? getPrivyExternalId(user) : null;
    if (!externalId) {
      setErrorMessage('Not signed in');
      return null;
    }
    return externalId;
  }, [isReady, user]);

  const pickAndUpload = useCallback(async () => {
    const externalId = resolveExternalId();
    if (!externalId) {
      return false;
    }

    setErrorMessage(null);

    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      setErrorMessage('Photo library permission is required.');
      return false;
    }

    const picked = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });

    if (picked.canceled || !picked.assets[0]) {
      return false;
    }

    const asset = picked.assets[0];
    const mimeType = asset.mimeType ?? 'image/jpeg';
    if (!mimeType.startsWith('image/')) {
      setErrorMessage('Choose an image file.');
      return false;
    }

    setIsUploading(true);

    try {
      const fileResponse = await fetch(asset.uri);
      if (!fileResponse.ok) {
        throw new Error('Could not read the selected photo.');
      }

      const blob = await fileResponse.blob();
      if (blob.size > MAX_PHOTO_BYTES) {
        throw new Error('Photo must be 5MB or smaller.');
      }

      const uploadUrl = await generateUploadUrl({ externalId });
      const uploadResponse = await fetch(uploadUrl, {
        method: 'POST',
        headers: {
          'Content-Type': mimeType,
        },
        body: blob,
      });

      if (!uploadResponse.ok) {
        throw new Error('Failed to upload photo.');
      }

      const uploaded = (await uploadResponse.json()) as {
        storageId?: string;
      };
      if (!uploaded.storageId) {
        throw new Error('Upload did not return a storage id.');
      }

      await setProfilePhoto({
        externalId,
        storageId: uploaded.storageId as Id<'_storage'>,
      });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to update photo';
      setErrorMessage(message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [generateUploadUrl, resolveExternalId, setProfilePhoto]);

  const remove = useCallback(async () => {
    const externalId = resolveExternalId();
    if (!externalId) {
      return false;
    }

    setIsUploading(true);
    setErrorMessage(null);

    try {
      await clearProfilePhoto({ externalId });
      return true;
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to remove photo';
      setErrorMessage(message);
      return false;
    } finally {
      setIsUploading(false);
    }
  }, [clearProfilePhoto, resolveExternalId]);

  return {
    profilePhotoUrl,
    isLoading,
    isUploading,
    errorMessage,
    pickAndUpload,
    remove,
    canRemove: Boolean(profilePhotoUrl) && !isUploading && !isLoading,
  };
}
