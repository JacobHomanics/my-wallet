import { useCallback, useMemo, useState } from 'react';

import { useFiatDisplay } from '@/hooks/useFiatDisplay';

function sanitizeAmountInput(value: string): string {
  const cleaned = value.replace(/[^0-9.]/g, '');
  const firstDot = cleaned.indexOf('.');
  if (firstDot === -1) {
    return cleaned;
  }
  return (
    cleaned.slice(0, firstDot + 1) +
    cleaned.slice(firstDot + 1).replace(/\./g, '')
  );
}

export type SendTipState = {
  /** Raw tip input shown in the field. */
  tip: string;
  /** Tip converted to USD, or 0 when empty/invalid. */
  tipUsd: number;
  setTip: (value: string) => void;
  /** Sets the tip to a percentage of the base USD amount. */
  setTipPercent: (baseUsd: number, percent: number) => void;
};

/**
 * Optional tip / additional amount on confirm send — added on top of the
 * base payment amount without rewriting the draft amount.
 */
export function useSendTip(): SendTipState {
  const { formatAmountInputFromUsd, parseDisplayInputToUsd } = useFiatDisplay();
  const [tip, setTipState] = useState('');

  const setTip = useCallback((value: string) => {
    setTipState(sanitizeAmountInput(value));
  }, []);

  const setTipPercent = useCallback(
    (baseUsd: number, percent: number) => {
      if (!(baseUsd > 0) || !(percent > 0)) {
        setTipState('');
        return;
      }
      setTipState(formatAmountInputFromUsd(baseUsd * (percent / 100)));
    },
    [formatAmountInputFromUsd],
  );

  const tipUsd = useMemo(() => {
    if (!tip.trim() || tip === '.') {
      return 0;
    }
    const usd = parseDisplayInputToUsd(tip);
    return usd != null && usd > 0 ? usd : 0;
  }, [parseDisplayInputToUsd, tip]);

  return {
    tip,
    tipUsd,
    setTip,
    setTipPercent,
  };
}
