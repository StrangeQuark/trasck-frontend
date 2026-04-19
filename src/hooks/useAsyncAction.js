import { useCallback, useState } from 'react';
import { apiErrorMessage } from '../api/client';

export const useAsyncAction = () => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const run = useCallback(async (action) => {
    setPending(true);
    setError('');
    try {
      return await action();
    } catch (caught) {
      setError(apiErrorMessage(caught));
      return undefined;
    } finally {
      setPending(false);
    }
  }, []);

  return { pending, error, run, setError };
};
