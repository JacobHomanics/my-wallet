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
  /** True when this transfer paid the app tax wallet. */
  isTax?: boolean;
};

export type HomeStackParamList = {
  index: undefined;
  tokenDetails: undefined;
  transactions: undefined;
  contacts: undefined;
  newContact: undefined;
  contactDetails: {
    contactId: string;
  };
  receive: undefined;
  request: undefined;
  receiveQr: {
    /** Display-currency amount string entered on the request screen. */
    usdAmount: string;
  };
  send: {
    tokenId?: string;
    /** Optional when opened from a receive address deep link. */
    usdAmount?: string;
    /** Reversible EVM+Solana identity; decoded into recipients on hydrate. */
    identity?: string;
    ethereumRecipient?: string;
    solanaRecipient?: string;
  } | undefined;
  sendAmount: {
    tokenId?: string;
    /** Optional when opened with a locked display-currency amount. */
    usdAmount?: string;
  } | undefined;
  confirmSend: {
    /** USD amount string the user entered. Optional for receive deep links. */
    usdAmount?: string;
    /** Reversible EVM+Solana identity; decoded into recipients on hydrate. */
    identity?: string;
    ethereumRecipient?: string;
    solanaRecipient?: string;
    legs?: ConfirmSendLeg[];
  };
  sent: {
    usdLabel: string;
    legs: SentLeg[];
    /** Whole-token treasury reward amount sent after the payment. */
    rewardAmount: string;
    /** Display label for the recipient (username, name, or truncated address). */
    recipientLabel?: string;
    recipientProfilePhotoUrl?: string | null;
    recipientUsername?: string | null;
  };
};

export type ProfileStackParamList = {
  index: undefined;
  settings: undefined;
};

export type MainTabParamList = {
  home: NavigatorScreenParams<HomeStackParamList> | undefined;
  profile: NavigatorScreenParams<ProfileStackParamList> | undefined;
};

export type ExportWalletParams = {
  address: string;
  chain: 'ethereum' | 'solana';
};

export type RootStackParamList = {
  splash: undefined;
  welcome: undefined;
  login:
    | undefined
    | ({
        returnTo: 'exportWallet';
      } & ExportWalletParams);
  loginVerify: {
    method: LoginMethod;
    value: string;
    returnTo?: 'exportWallet';
    address?: string;
    chain?: 'ethereum' | 'solana';
  };
  exportWallet: ExportWalletParams;
  main: NavigatorScreenParams<MainTabParamList> | undefined;
};

export const ROOT_STACK_INITIAL_ROUTE: keyof RootStackParamList = 'splash';
