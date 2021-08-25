import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";

export interface IFetchableResult<S> {
  data: S;
  isFetching: boolean;
  hasBeenFetched: boolean;
  retryCount: number;
  error?: Error;
}

export interface IFetchableConfig {
  shouldRefresh?: boolean;
  refreshInterval?: number;
  refreshFactor?: any;
  shouldRetry?: boolean;
  retryInterval?: number;
  maxRetryTime?: number;
  shouldAlwaysPersistResult?: boolean;
  isDisabled?: boolean;
}

export function useFetchable<S>(
  initialState: S | (() => S),
  fetchFn: () => Promise<[S, boolean]> | Promise<S>,
  {
    shouldRefresh = false,
    refreshInterval = 10000,
    refreshFactor,
    shouldRetry = false,
    retryInterval = 3000,
    maxRetryTime = 2,
    isDisabled = false,
    shouldAlwaysPersistResult = false,
  }: IFetchableConfig = {},
): IFetchableResult<S> {
  const [data, setData] = useState(initialState);
  const [isFetching, setIsFetching] = useState(false);
  const [hasBeenFetched, setHasBeenFetched] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [error, setError] = useState<Error>();

  const shouldAlwaysPersistResultRef = useRef<boolean>();
  useLayoutEffect(() => {
    shouldAlwaysPersistResultRef.current = shouldAlwaysPersistResult;
  }, [shouldAlwaysPersistResult]);

  useLayoutEffect(() => {
    if (shouldAlwaysPersistResultRef.current) {
      return;
    }

    setData(initialState);
    setHasBeenFetched(false);
  }, [fetchFn, initialState]);

  useEffect(() => {
    setRetryCount(0);
    setError(undefined);

    if (isDisabled) {
      setIsFetching(false);
      return;
    }

    let isDisposed = false;
    let retryCountInternal = 0;
    const fetchAndSetLoop = async () => {
      try {
        setIsFetching(true);
        const result = await fetchFn();

        if (isDisposed) {
          return;
        }

        if (shouldRefresh) {
          timeoutID = window.setTimeout(fetchAndSetLoop, refreshInterval);
        }

        let nextValue: S = result as S;
        let shouldSkip = false;
        if (Array.isArray(result)) {
          [nextValue, shouldSkip] = result;
        }

        if (
          typeof shouldSkip !== "boolean" ||
          (Array.isArray(result) && result.length !== 2)
        ) {
          console.warn(
            "[warn] useFetchable: you might accidentally used array as data type, please wrap it with [data, false]",
          );
          nextValue = result as S;
          shouldSkip = false;
        }

        if (shouldSkip) {
          return;
        }

        setData(nextValue);
        setHasBeenFetched(true);
      } catch (err) {
        console.warn("Failed to fetch", err);

        if (isDisposed) {
          return;
        }

        setError(err as Error);

        if (shouldRefresh) {
          timeoutID = window.setTimeout(fetchAndSetLoop, refreshInterval);
        }

        if (!shouldRetry) {
          return;
        }
        retryCountInternal++;
        if (retryCountInternal > maxRetryTime) {
          return;
        }

        // stop refreshing, setup retrying
        window.clearTimeout(timeoutID);
        timeoutID = window.setTimeout(() => {
          setRetryCount(retryCountInternal);
          fetchAndSetLoop();
        }, retryInterval);
      } finally {
        if (!isDisposed) {
          setIsFetching(false);
        }
      }
    };

    fetchAndSetLoop();

    let timeoutID = -1;
    return () => {
      isDisposed = true;
      window.clearTimeout(timeoutID);
    };
  }, [
    initialState,
    fetchFn,
    shouldRefresh,
    refreshInterval,
    refreshFactor,
    shouldRetry,
    retryInterval,
    maxRetryTime,
    isDisabled,
  ]);

  return useMemo(
    () => ({
      data,
      isFetching,
      hasBeenFetched,
      retryCount,
      error,
    }),
    [data, isFetching, hasBeenFetched, retryCount, error],
  );
}
