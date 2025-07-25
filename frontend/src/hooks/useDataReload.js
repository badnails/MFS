// frontend/src/hooks/useDataReload.js
import { useEffect, useState, useContext, createContext } from 'react';

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

// Context for sharing reload key
export const DataReloadContext = createContext();

export const useDataReloadContext = () => {
  const context = useContext(DataReloadContext);
  if (context === undefined) {
    throw new Error('useDataReloadContext must be used within a DataReloadProvider');
  }
  return context;
};
