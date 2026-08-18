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
  receive: undefined;
  request: undefined;
  /** Stripe embedded Crypto Onramp widget (web). */
  stripeOnramp: undefined;
  /** Stripe Embedded Components Crypto Onramp (web). */
  stripeOnrampComponents: undefined;
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
  /** Cashbox username / account number search during send. */
  sendSearch: {
    tokenId?: string;
    usdAmount?: string;
  } | undefined;
  /** Farcaster username search + ENS + raw wallet entry during send. */
  sendAdvancedSearch: {
    tokenId?: string;
    usdAmount?: string;
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
    /** Whole-token treasury reward amount; omitted for frontend (device) sends. */
    rewardAmount?: string | null;
    /** Treasury reward tx hash when a reward was sent. */
    rewardHash?: string | null;
    /** Payment succeeded but treasury reward failed. */
    rewardFailed?: boolean;
    /** Display label for the recipient (username, name, or truncated address). */
    recipientLabel?: string;
    recipientProfilePhotoUrl?: string | null;
    recipientUsername?: string | null;
    recipientIsFarcaster?: boolean;
    recipientIsEns?: boolean;
  };
};

export type RewardsStackParamList = {
  index: undefined;
};

export type EarnStackParamList = {
  index: undefined;
};

export type ContactsStackParamList = {
  index: undefined;
  newContact: undefined;
  newFarcasterContact: undefined;
  newEnsContact: undefined;
  newRawAddressContact: undefined;
  contactDetails: {
    contactId: string;
  };
};

export type ProfileStackParamList = {
  index: undefined;
  settings: undefined;
  profileSettings: undefined;
  onrampSettings: undefined;
  earnSettings: undefined;
};

export type MainTabParamList = {
  home: NavigatorScreenParams<HomeStackParamList> | undefined;
  contacts: NavigatorScreenParams<ContactsStackParamList> | undefined;
  rewards: NavigatorScreenParams<RewardsStackParamList> | undefined;
  earn: NavigatorScreenParams<EarnStackParamList> | undefined;
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
  onboarding: undefined;
  main: NavigatorScreenParams<MainTabParamList> | undefined;
};

export const ROOT_STACK_INITIAL_ROUTE: keyof RootStackParamList = 'splash';
