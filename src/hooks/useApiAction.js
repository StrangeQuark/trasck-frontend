import { useState } from 'react';
import { apiErrorMessage } from '../api/client';

export const useApiAction = (addToast) => {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState('');

  const run = async (action, successMessage) => {
    setPending(true);
    setError('');
    try {
      const result = await action();
      if (successMessage) {
        addToast(successMessage, 'success');
      }
      return result;
    } catch (caught) {
      const message = apiErrorMessage(caught);
      setError(message);
      addToast(message, 'error');
      return undefined;
    } finally {
      setPending(false);
    }
  };

  return { pending, error, run, setError };
};
