export type UseOpenStripeDepositResult = {
  canDeposit: boolean;
  openDeposit: () => void;
};
