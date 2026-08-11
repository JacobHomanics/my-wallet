import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { StripeOnramp } from '@stripe/crypto';

import { getStripeOnramp } from '@/lib/stripe/loadStripeOnramp';

type CryptoElementsContextValue = {
  onramp: StripeOnramp | null;
};

const CryptoElementsContext = createContext<CryptoElementsContextValue>({
  onramp: null,
});

CryptoElementsContext.displayName = 'CryptoElementsContext';

/**
 * Provides an initialized StripeOnramp instance to child OnrampElements.
 * Import only from web screens (DOM / `@stripe/crypto`).
 */
export function CryptoElements({ children }: { children: ReactNode }) {
  const [ctx, setCtx] = useState<CryptoElementsContextValue>({ onramp: null });

  useEffect(() => {
    let mounted = true;
    void getStripeOnramp().then((onramp) => {
      if (mounted && onramp) {
        setCtx((prev) => (prev.onramp ? prev : { onramp }));
      }
    });
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <CryptoElementsContext.Provider value={ctx}>
      {children}
    </CryptoElementsContext.Provider>
  );
}

export function useStripeOnramp(): StripeOnramp | null {
  return useContext(CryptoElementsContext).onramp;
}
