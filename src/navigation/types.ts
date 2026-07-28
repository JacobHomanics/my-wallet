import type { NavigatorScreenParams } from '@react-navigation/native';

import type { LoginMethod } from '@/lib/privy/context/AuthFlowContext.shared';

export type ConfirmSendLeg = {
  tokenId: string;
  /** Token units to send for this leg. */
  amount: string;
};

export type SentLeg = {
  hash: string;
  amount: string;
  symbol: string;
  network: string;
  networkLabel: string;
  tokenName: string;
  logoUrl: string | null;
};

export type HomeStackParamList = {
  index: undefined;
  tokenDetails: undefined;
  send: { tokenId?: string } | undefined;
  confirmSend: {
    recipient: string;
    /** USD amount string the user entered. */
    usdAmount: string;
    legs: ConfirmSendLeg[];
  };
  sent: {
    usdLabel: string;
    legs: SentLeg[];
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
