// src/hooks/useSidebar.js
import { useState } from 'react';

export const useSidebar = (initialCollapsed = false) => {
  const [collapsed, setCollapsed] = useState(initialCollapsed);
  const [activeItem, setActiveItem] = useState(null);

  const toggleSidebar = () => setCollapsed(prev => !prev);
  
  const setActive = (itemId) => setActiveItem(itemId);

  return {
    collapsed,
    activeItem,
    toggleSidebar,
    setActive
  };
};
