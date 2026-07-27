import type { NavigatorScreenParams } from '@react-navigation/native';

import type { LoginMethod } from '@/lib/privy/context/AuthFlowContext.shared';

export type HomeStackParamList = {
  index: undefined;
  tokenDetails: undefined;
  send: { tokenId?: string } | undefined;
  confirmSend: {
    tokenId: string;
    recipient: string;
    amount: string;
  };
  sent: {
    hash: string;
    amount: string;
    symbol: string;
  };
};

export type MainTabParamList = {
  home: NavigatorScreenParams<HomeStackParamList> | undefined;
  settings: undefined;
};

export type RootStackParamList = {
  splash: undefined;
  welcome: undefined;
  login: undefined;
  loginVerify: {
    method: LoginMethod;
    value: string;
  };
  main: NavigatorScreenParams<MainTabParamList> | undefined;
};

export const ROOT_STACK_INITIAL_ROUTE: keyof RootStackParamList = 'splash';
