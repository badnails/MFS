# Transaction History Component

This component provides a comprehensive transaction history view with pagination and filtering capabilities for the MFS (Mobile Financial Services) application.

## Features

### Core Functionality
- **Pagination**: Navigate through transactions with customizable page sizes (10, 25, 50 per page)
- **Filtering**: Filter transactions by:
  - Direction (sent, received, all)
  - Status (completed, pending, failed)
  - Transaction type
  - Date range (start date to end date)
- **Real-time Data**: Fetches transaction data from the backend API
- **Responsive Design**: Works on desktop and mobile devices

### Backend API Endpoints

#### Get Transaction History
```
GET /transactions/history/:accountid
```

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10)
- `status` (string): Filter by transaction status
- `type` (string): Filter by transaction type
- `direction` (string): 'sent', 'received', or 'all'
- `startDate` (ISO date string): Start date for filtering
- `endDate` (ISO date string): End date for filtering

**Response:**
```json
{
  "valid": true,
  "data": {
    "transactions": [...],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalRecords": 47,
      "hasNextPage": true,
      "hasPreviousPage": false,
      "limit": 10
    }
  }
}
```

#### Get Transaction Types
```
GET /transactions/types
```

**Response:**
```json
{
  "valid": true,
  "types": ["SEND_MONEY", "CASH_IN", "CASH_OUT", "BILL_PAYMENT", "MERCHANT_PAYMENT"]
}
```

## Component Usage

### As a Modal
```jsx
import TransactionHistory from './common/TransactionHistory';

// In your component
{showHistory && (
  <TransactionHistory 
    accountId={user.accountid} 
    onClose={() => setShowHistory(false)} 
    isModal={true} 
  />
)}
```

### As a Full Page
```jsx
import TransactionHistory from './common/TransactionHistory';

// In your component
<TransactionHistory 
  accountId={user.accountid} 
  isModal={false} 
/>
```

### Standalone Page Component
```jsx
import TransactionHistoryPage from './TransactionHistoryPage';

// Use in routing
<Route path="/transactions" component={TransactionHistoryPage} />
```

## Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `accountId` | string | Yes | The account ID to fetch transactions for |
| `onClose` | function | No | Callback function when modal is closed (only for modal mode) |
| `isModal` | boolean | No | Whether to render as a modal or full component |

## Database Schema

The component expects the following database schema:

```sql
CREATE TABLE public.transactions (
  transactionid text PRIMARY KEY,
  transactiontype text NOT NULL,
  transactionstatus public.transaction_status NOT NULL,
  sourceaccountid text,
  destinationaccountid text,
  subamount numeric(19, 4) NOT NULL,
  feesamount numeric(19, 4) DEFAULT 0,
  initiationtimestamp timestamp with time zone NOT NULL,
  completiontimestamp timestamp with time zone,
  reference varchar(100),
  -- Foreign key constraints
  CONSTRAINT transactions_destinationaccountid_fkey 
    FOREIGN KEY (destinationaccountid) REFERENCES accounts (accountid),
  CONSTRAINT transactions_sourceaccountid_fkey 
    FOREIGN KEY (sourceaccountid) REFERENCES accounts (accountid),
  CONSTRAINT transactions_transactiontype_fkey 
    FOREIGN KEY (transactiontype) REFERENCES transactiontype (transactiontype_name)
);
```

## Features in Detail

### Pagination
- Displays current page, total pages, and total records
- Navigation buttons (Previous/Next)
- Direct page number navigation (shows up to 5 page numbers)
- Configurable page size

### Filtering
- **Direction Filter**: Show only sent transactions, received transactions, or all
- **Status Filter**: Filter by transaction status (completed, pending, failed)
- **Type Filter**: Filter by transaction type (dynamically loaded from database)
- **Date Range**: Filter transactions within a specific date range
- **Clear Filters**: Reset all filters to default values

### Transaction Display
- Shows transaction type, direction (sent/received), and status with icons
- Displays transaction amounts with proper formatting
- Shows source/destination account information
- Displays initiation and completion timestamps
- Shows transaction reference numbers and fees

### UI/UX Features
- Loading states with spinner animations
- Error handling with retry functionality
- Responsive design for mobile and desktop
- Hover effects and smooth transitions
- Clear visual indicators for transaction direction and status
- Empty state when no transactions are found

## Integration

The component is already integrated into:
- **PersonalDashboard**: Available as a quick action button
- **AgentDashboard**: Available in the history modal
- **Standalone Page**: Can be used as a dedicated transaction history page

## Future Enhancements

Potential improvements that could be added:
- Export functionality (CSV, PDF)
- Advanced search by transaction ID or reference
- Transaction details modal with full information
- Bulk operations on transactions
- Real-time updates via WebSocket
- Transaction categories and tagging
- Visual charts and analytics
