import { useCallback, useEffect, useRef, useState } from 'react';

import { ApiError } from '@/src/api/client';

export type LoadState<T> =
  | { status: 'loading'; data: null; error: null }
  | { status: 'ready'; data: T; error: null }
  | { status: 'error'; data: null; error: string };

export function messageOf(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    if (err.status === 0) return 'Could not reach the server.';
    if (err.code === 'key_invalid') return 'Skydive rejected your key.';
    return err.message;
  }
  return err instanceof Error && err.message ? err.message : fallback;
}

/**
 * Runs an async loader and exposes loading / ready / error instead of an empty
 * array that looks identical to "nothing here". Results from a superseded run
 * or after unmount are dropped.
 */
export function useLoad<T>(
  loader: () => Promise<T>,
  fallback = 'Something went wrong.',
): LoadState<T> & { reload: () => void } {
  const [state, setState] = useState<LoadState<T>>({
    status: 'loading',
    data: null,
    error: null,
  });
  const run = useRef(0);

  const reload = useCallback(() => {
    const id = ++run.current;
    setState({ status: 'loading', data: null, error: null });
    loader().then(
      (data) => {
        if (id === run.current) {
          setState({ status: 'ready', data, error: null });
        }
      },
      (err: unknown) => {
        if (id === run.current) {
          setState({
            status: 'error',
            data: null,
            error: messageOf(err, fallback),
          });
        }
      },
    );
  }, [loader, fallback]);

  useEffect(() => {
    reload();
    return () => {
      run.current += 1;
    };
  }, [reload]);

  return { ...state, reload };
}
