import { useCallback, useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { updateSendDraft } from '@/hooks/useSendDraft';
import type { HomeStackParamList } from '@/navigation/types';

function clearSendRecipientFields() {
  updateSendDraft({
    accountNumber: '',
    ethereumRecipient: '',
    solanaRecipient: '',
    recipientUsername: null,
    recipientName: null,
    recipientProfilePhotoUrl: null,
  });
}

/**
 * Clears recipient fields when leaving the amount screen via back.
 */
export function useClearSendRecipientOnBack() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      const type = event.data.action.type;
      if (type === 'GO_BACK' || type === 'POP' || type === 'POP_TO_TOP') {
        clearSendRecipientFields();
      }
    });
    return unsubscribe;
  }, [navigation]);

  const onBack = useCallback(() => {
    clearSendRecipientFields();

    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }

    navigation.reset({
      index: 1,
      routes: [{ name: 'index' }, { name: 'send' }],
    });
  }, [navigation]);

  return { onBack };
}
