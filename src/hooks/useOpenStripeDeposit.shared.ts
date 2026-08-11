import type { DepositMethodOption } from '@/lib/stripe/depositMethods';

export type UseOpenStripeDepositResult = {
  canDeposit: boolean;
  openDeposit: () => void;
  depositPickerOpen: boolean;
  closeDepositPicker: () => void;
  onSelectDepositMethod: (method: DepositMethodOption) => void;
};
