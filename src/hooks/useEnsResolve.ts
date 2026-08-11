import { useAction } from 'convex/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { isValidEnsName, normalizeEnsName } from '@/lib/validation';
import { api } from '../../convex/_generated/api';

export type EnsResolveHit = {
  name: string;
  address: string;
  avatarUrl: string | null;
  label: string;
};

const DEBOUNCE_MS = 400;

/**
 * Debounced ENS name resolution via Convex (Alchemy mainnet RPC).
 */
export function useEnsResolve(query: string) {
  const resolve = useAction(api.ens.resolve);
  const [result, setResult] = useState<EnsResolveHit | null>(null);
  const [isResolving, setIsResolving] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [resolvedQuery, setResolvedQuery] = useState('');
  const requestIdRef = useRef(0);

  const trimmed = normalizeEnsName(query);
  const shouldResolve = isValidEnsName(trimmed);

  useEffect(() => {
    if (!shouldResolve) {
      requestIdRef.current += 1;
      return;
    }

    const requestId = ++requestIdRef.current;

    const timer = setTimeout(() => {
      setIsResolving(true);
      setErrorMessage(null);

      void (async () => {
        try {
          const hit = await resolve({ name: trimmed });
          if (requestId !== requestIdRef.current) {
            return;
          }

          setResult(
            hit
              ? {
                  name: hit.name,
                  address: hit.address,
                  avatarUrl: hit.avatarUrl ?? null,
                  label: hit.name,
                }
              : null,
          );
          setResolvedQuery(trimmed);
          setErrorMessage(null);
        } catch (error) {
          if (requestId !== requestIdRef.current) {
            return;
          }
          const message =
            error instanceof Error ? error.message : 'Failed to resolve ENS';
          setErrorMessage(message);
          setResult(null);
          setResolvedQuery(trimmed);
        } finally {
          if (requestId === requestIdRef.current) {
            setIsResolving(false);
          }
        }
      })();
    }, DEBOUNCE_MS);

    return () => {
      clearTimeout(timer);
    };
  }, [resolve, shouldResolve, trimmed]);

  const clearResult = useCallback(() => {
    requestIdRef.current += 1;
    setResult(null);
    setIsResolving(false);
    setErrorMessage(null);
    setResolvedQuery('');
  }, []);

  const visibleResult = useMemo(() => {
    if (!shouldResolve || resolvedQuery !== trimmed) {
      return null;
    }
    return result;
  }, [result, resolvedQuery, shouldResolve, trimmed]);

  const visibleError = useMemo(() => {
    if (trimmed.length > 0 && !shouldResolve) {
      return 'Enter a valid ENS name (e.g. name.eth).';
    }
    if (shouldResolve && resolvedQuery === trimmed) {
      return errorMessage;
    }
    return null;
  }, [errorMessage, resolvedQuery, shouldResolve, trimmed]);

  const visibleResolving = shouldResolve && isResolving;

  const showNotFound =
    shouldResolve &&
    !visibleResolving &&
    resolvedQuery === trimmed &&
    !visibleResult &&
    !visibleError;

  return {
    result: visibleResult,
    isResolving: visibleResolving,
    showNotFound,
    errorMessage: visibleError,
    clearResult,
  };
}
