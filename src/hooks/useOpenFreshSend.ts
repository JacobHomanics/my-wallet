import { useCallback } from 'react';
import { CommonActions, useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { resetSendDraft } from '@/hooks/useSendDraft';
import type { HomeStackParamList } from '@/navigation/types';

/** Clears the send draft and opens send with a new screen instance. */
export function useOpenFreshSend() {
  const navigation =
    useNavigation<NativeStackNavigationProp<HomeStackParamList>>();

  return useCallback(() => {
    resetSendDraft();
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: 'index' }, { name: 'send' }],
      }),
    );
  }, [navigation]);
}
