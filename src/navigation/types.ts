import type { LoginMethod } from '@/lib/privy/context/AuthFlowContext.shared';

export type RootStackParamList = {
  splash: undefined;
  welcome: undefined;
  login: undefined;
  loginVerify: {
    method: LoginMethod;
    value: string;
  };
  home: undefined;
};

export const ROOT_STACK_INITIAL_ROUTE: keyof RootStackParamList = 'splash';
