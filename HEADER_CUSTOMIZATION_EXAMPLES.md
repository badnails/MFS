# Header Customization Examples for SidebarLayout

## Available Customization Options

The `SidebarLayout` component now supports several header customization options:

### 1. **Custom Header Title**
```jsx
<SidebarLayout
  headerTitle="My Custom Dashboard"
  // ... other props
>
  {content}
</SidebarLayout>
```

### 2. **Custom Header Actions**
```jsx
import { Bell, Settings, User } from 'lucide-react';

const customActions = (
  <>
    <button className="p-2 rounded-lg hover:bg-gray-100">
      <Bell className="h-5 w-5" />
    </button>
    <button className="p-2 rounded-lg hover:bg-gray-100">
      <Settings className="h-5 w-5" />
    </button>
    <div className="flex items-center gap-2">
      <User className="h-5 w-5" />
      <span>Custom User Info</span>
    </div>
  </>
);

<SidebarLayout
  headerActions={customActions}
  // ... other props
>
  {content}
</SidebarLayout>
```

### 3. **Completely Custom Header**
```jsx
const customHeader = (
  <div className="px-6 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white">
    <div className="flex justify-between items-center">
      <h1 className="text-xl font-bold">My Amazing Dashboard</h1>
      <div className="flex items-center gap-4">
        {/* Your custom header content */}
      </div>
    </div>
  </div>
);

<SidebarLayout
  customHeader={customHeader}
  // ... other props
>
  {content}
</SidebarLayout>
```

### 4. **Hide Header Completely**
```jsx
<SidebarLayout
  showHeader={false}
  // ... other props
>
  {content}
</SidebarLayout>
```

## Real Examples

### Personal Dashboard with Custom Title
```jsx
<SidebarLayout
  menuItems={personalSidebarConfig.menuItems}
  brandName={personalSidebarConfig.brandName}
  headerTitle="Welcome to Your Personal Banking"
  onMenuItemClick={handleSidebarItemClick}
  activeMenuItem={activeView}
>
  {renderMainContent()}
</SidebarLayout>
```

### Admin Dashboard with Custom Actions
```jsx
import { Settings, Users, BarChart } from 'lucide-react';

const adminActions = (
  <>
    <button className="p-2 rounded-lg hover:bg-gray-100" title="System Settings">
      <Settings className="h-5 w-5" />
    </button>
    <button className="p-2 rounded-lg hover:bg-gray-100" title="User Management">
      <Users className="h-5 w-5" />
    </button>
    <button className="p-2 rounded-lg hover:bg-gray-100" title="Analytics">
      <BarChart className="h-5 w-5" />
    </button>
    <NotificationCenter />
    <UserProfile />
    <LogoutButton />
  </>
);

<SidebarLayout
  menuItems={adminSidebarConfig.menuItems}
  brandName={adminSidebarConfig.brandName}
  headerTitle="System Administration"
  headerActions={adminActions}
  onMenuItemClick={handleSidebarItemClick}
  activeMenuItem={activeView}
>
  {renderActiveComponent()}
</SidebarLayout>
```

### Dashboard with Gradient Header
```jsx
const gradientHeader = (
  <div className="px-6 py-4 bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white">
    <div className="flex justify-between items-center">
      <div>
        <h1 className="text-2xl font-bold">Personal Finance Hub</h1>
        <p className="text-indigo-100 text-sm">Manage your money with confidence</p>
      </div>
      <div className="flex items-center gap-4">
        <div className="bg-white/20 rounded-lg px-3 py-1">
          <span className="text-sm font-medium">Balance: $2,450.00</span>
        </div>
        <NotificationCenter />
        <UserProfile />
      </div>
    </div>
  </div>
);

<SidebarLayout
  customHeader={gradientHeader}
  // ... other props
>
  {content}
</SidebarLayout>
```
