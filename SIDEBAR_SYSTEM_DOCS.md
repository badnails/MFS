# Modular Sidebar System Documentation

## Overview

A modern, retractable sidebar system that can be easily integrated into any dashboard in the MFS application. The sidebar is completely modular, responsive, and customizable for each dashboard type.

## Features

- **Retractable**: Sidebar can be collapsed/expanded with smooth animations
- **Responsive**: Works on desktop and mobile devices
- **Modular**: Each dashboard can have different menu items
- **Modern Design**: Clean, professional appearance with hover effects
- **Accessible**: Keyboard navigation and screen reader friendly
- **Configurable**: Easy to customize branding, icons, and menu items

## Architecture

### Core Components

1. **`Sidebar`** (`src/components/common/Sidebar.jsx`)
   - The reusable sidebar component
   - Handles UI, animations, and user interactions

2. **`SidebarLayout`** (`src/components/layouts/SidebarLayout.jsx`)
   - Layout wrapper that combines sidebar with main content
   - Includes header with notifications and user info

3. **`useSidebar`** (`src/hooks/useSidebar.js`)
   - Custom hook for sidebar state management

4. **Sidebar Configurations** (`src/config/sidebarConfigs.js`)
   - Pre-defined menu configurations for different dashboard types

## Usage

### Basic Implementation

```jsx
import React, { useState } from 'react';
import SidebarLayout from './layouts/SidebarLayout';
import { personalSidebarConfig } from '../config/sidebarConfigs';
import { Wallet } from 'lucide-react';

const MyDashboard = () => {
  const [activeView, setActiveView] = useState('dashboard');

  const handleSidebarItemClick = (itemId) => {
    setActiveView(itemId);
  };

  const renderContent = () => {
    switch (activeView) {
      case 'dashboard':
        return <DashboardContent />;
      case 'profile':
        return <ProfileContent />;
      default:
        return <DashboardContent />;
    }
  };

  return (
    <SidebarLayout
      menuItems={personalSidebarConfig.menuItems}
      brandName={personalSidebarConfig.brandName}
      brandIcon={Wallet}
      onMenuItemClick={handleSidebarItemClick}
      activeMenuItem={activeView}
    >
      {renderContent()}
    </SidebarLayout>
  );
};
```

### Custom Sidebar Configuration

```jsx
// Custom menu items
const customMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: Home },
  { id: 'analytics', label: 'Analytics', icon: BarChart },
  { id: 'settings', label: 'Settings', icon: Settings }
];

// Usage
<SidebarLayout
  menuItems={customMenuItems}
  brandName="Custom Dashboard"
  brandIcon={CustomIcon}
  onMenuItemClick={handleMenuClick}
  activeMenuItem={activeItem}
>
  {content}
</SidebarLayout>
```

## Props Reference

### SidebarLayout Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `children` | ReactNode | Yes | Main content to display |
| `menuItems` | Array | Yes | Array of menu item objects |
| `brandName` | string | No | Brand name for sidebar header |
| `brandIcon` | Component | No | Icon component for branding |
| `onMenuItemClick` | function | Yes | Callback when menu item is clicked |
| `activeMenuItem` | string | Yes | ID of currently active menu item |
| `showHeader` | boolean | No | Whether to show the header (default: true) |

### Menu Item Object Structure

```javascript
{
  id: 'unique-id',      // string: Unique identifier
  label: 'Menu Label',  // string: Display text
  icon: IconComponent   // Component: Lucide React icon
}
```

## Pre-configured Dashboard Types

### Personal Dashboard
- Dashboard overview
- Send Money
- Cash Out  
- Pay Merchant
- Pay Bills
- Transaction History
- Profile

### Agent Dashboard
- Dashboard overview
- Cash In
- Cash Out
- Transaction History
- Statistics
- Profile

### Merchant Dashboard
- Dashboard overview
- Create Bill
- Pending Bills
- Transaction History
- Statistics
- Profile

### Biller Dashboard
- Dashboard overview
- Assign Bill
- Create Bill Batch
- Bill History
- Statistics
- Profile

### Admin Dashboard
- Overview
- Balance Update
- Accounts Management
- Transactions
- Settings

## Mobile Responsiveness

The sidebar automatically adapts to mobile screens:
- On mobile: Sidebar overlays content with backdrop
- On desktop: Sidebar pushes content to the right
- Smooth transitions between states

## Customization

### Styling
The sidebar uses Tailwind CSS classes and can be customized by:
- Modifying the `className` prop
- Updating CSS classes in the component
- Adding custom CSS for specific behaviors

### Icons
Uses Lucide React icons. You can:
- Import any Lucide icon
- Use custom SVG icons
- Create icon components

### Branding
Customize branding by:
- Setting `brandName` prop
- Providing custom `brandIcon`
- Modifying the brand section styling

## Migration Guide

### From AdminDashboard (Example)

**Before:**
```jsx
// Old AdminDashboard implementation
<div className="flex">
  <AdminSidebar collapsed={collapsed} activeTab={tab} setActiveTab={setTab} />
  <div className={`flex-1 ${collapsed ? 'ml-16' : 'ml-64'}`}>
    <header>...</header>
    <main>{content}</main>
  </div>
</div>
```

**After:**
```jsx
// New modular implementation
<SidebarLayout
  menuItems={adminSidebarConfig.menuItems}
  brandName={adminSidebarConfig.brandName}
  onMenuItemClick={setActiveTab}
  activeMenuItem={activeTab}
>
  {renderActiveComponent()}
</SidebarLayout>
```

### Steps to Update Existing Dashboard

1. Import required components:
   ```jsx
   import SidebarLayout from './layouts/SidebarLayout';
   import { yourDashboardConfig } from '../config/sidebarConfigs';
   ```

2. Add state for active view:
   ```jsx
   const [activeView, setActiveView] = useState('dashboard');
   ```

3. Create menu click handler:
   ```jsx
   const handleSidebarItemClick = (itemId) => {
     setActiveView(itemId);
   };
   ```

4. Replace layout structure with SidebarLayout

5. Update content rendering based on `activeView`

## Best Practices

1. **State Management**: Use a single state variable for active view
2. **Content Rendering**: Use switch statements for clean view rendering
3. **Modal Handling**: Keep modals separate from sidebar navigation
4. **Loading States**: Show loading indicators for async operations
5. **Error Handling**: Display error messages with retry options
6. **Accessibility**: Ensure proper ARIA labels and keyboard navigation

## Troubleshooting

### Common Issues

1. **Menu items not showing**: Check that `menuItems` array is properly formatted
2. **Icons not displaying**: Verify icon imports from lucide-react
3. **Active state not working**: Ensure `activeMenuItem` matches menu item `id`
4. **Mobile layout issues**: Check responsive classes and z-index values

### Performance Tips

1. Use `React.memo` for menu item components if needed
2. Implement lazy loading for heavy dashboard content
3. Debounce sidebar toggle for better UX
4. Use proper key props for menu item lists

## Future Enhancements

- [ ] Sidebar themes (dark/light mode)
- [ ] Collapsible menu groups
- [ ] Drag & drop menu reordering
- [ ] User preference persistence
- [ ] Multi-level navigation
- [ ] Search within sidebar
- [ ] Keyboard shortcuts display
- [ ] Integration with router for URL-based navigation
