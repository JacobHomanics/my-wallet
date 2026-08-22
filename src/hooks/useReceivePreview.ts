import { useAuth } from '@/hooks/useAuth';
import {
  RECEIVE_PREVIEW_IDENTITY_ID,
  RECEIVE_PREVIEW_QR_DATA,
  RECEIVE_PREVIEW_USERNAME,
} from '@/lib/receivePreview';

/**
 * Signed-out receive/request preview: mock QR payload, account number, username.
 */
export function useReceivePreview() {
  const { isReady, isAuthenticated } = useAuth();
  const isPreview = isReady && !isAuthenticated;

  return {
    isPreview,
    qrData: RECEIVE_PREVIEW_QR_DATA,
    identityId: RECEIVE_PREVIEW_IDENTITY_ID,
    username: RECEIVE_PREVIEW_USERNAME,
  };
}
