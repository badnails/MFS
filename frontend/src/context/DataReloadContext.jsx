// src/context/DataReloadContext.jsx
import React, { createContext } from 'react';
import { useDataReload } from '../hooks/useDataReload';

export const DataReloadContext = createContext();

export const DataReloadProvider = ({ children }) => {
  const reloadKey = useDataReload();
  
  return (
    <DataReloadContext.Provider value={reloadKey}>
      {children}
    </DataReloadContext.Provider>
  );
};
