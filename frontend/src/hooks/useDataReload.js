// frontend/src/hooks/useDataReload.js
import { useEffect, useState } from 'react';

const listeners = new Set();

export const triggerReload = () => {
  listeners.forEach(callback => callback());
};

export const useDataReload = () => {
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    const callback = () => {
      setReloadKey(prev => prev + 1);
    };
    listeners.add(callback);
    return () => {
      listeners.delete(callback);
    };
  }, []);

  return reloadKey;
};
