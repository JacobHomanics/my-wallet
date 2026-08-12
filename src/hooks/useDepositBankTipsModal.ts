import { useCallback, useState, useSyncExternalStore } from 'react';

const DEPOSIT_BANK_TIPS_DISMISSED_KEY = 'depositBankTipsDismissed';

type DepositBankTipsListener = () => void;

function readDismissed(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    return (
      window.localStorage.getItem(DEPOSIT_BANK_TIPS_DISMISSED_KEY) === 'true'
    );
  } catch {
    return false;
  }
}

function persistDismissed(dismissed: boolean): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    if (dismissed) {
      window.localStorage.setItem(DEPOSIT_BANK_TIPS_DISMISSED_KEY, 'true');
    } else {
      window.localStorage.removeItem(DEPOSIT_BANK_TIPS_DISMISSED_KEY);
    }
  } catch {
    // Ignore quota / private-mode storage errors.
  }
}

let dismissed = readDismissed();
const listeners = new Set<DepositBankTipsListener>();

function subscribe(listener: DepositBankTipsListener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean {
  return dismissed;
}

function setDismissed(value: boolean): void {
  if (value === dismissed) {
    return;
  }
  dismissed = value;
  persistDismissed(value);
  listeners.forEach((listener) => {
    listener();
  });
}

/**
 * Deposit tips modal state, including a persistent "do not show again" preference.
 */
export function useDepositBankTipsModal(openDeposit: () => void) {
  const skipTips = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const [depositTipsOpen, setDepositTipsOpen] = useState(false);
  const [doNotShowAgain, setDoNotShowAgain] = useState(false);

  const openDepositTips = useCallback(() => {
    if (skipTips) {
      openDeposit();
      return;
    }
    setDoNotShowAgain(false);
    setDepositTipsOpen(true);
  }, [openDeposit, skipTips]);

  const dismissDepositTips = useCallback(
    (proceed: boolean) => {
      if (doNotShowAgain) {
        setDismissed(true);
      }
      setDepositTipsOpen(false);
      if (proceed) {
        openDeposit();
      }
    },
    [doNotShowAgain, openDeposit],
  );

  const closeDepositTips = useCallback(() => {
    dismissDepositTips(false);
  }, [dismissDepositTips]);

  const continueDepositTips = useCallback(() => {
    dismissDepositTips(true);
  }, [dismissDepositTips]);

  return {
    depositTipsOpen,
    doNotShowAgain,
    setDoNotShowAgain,
    openDepositTips,
    closeDepositTips,
    continueDepositTips,
  };
}
