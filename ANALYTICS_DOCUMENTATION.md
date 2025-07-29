# MFS Analytics System Documentation

## Overview

The MFS (Mobile Financial Services) Analytics System provides comprehensive insights and visualization for different user types within the financial platform. The system features reusable chart components and role-based analytics access.

## Architecture

### Frontend Components

#### Chart Components (`frontend/src/components/common/charts/`)

1. **chartUtils.js** - Utility functions for chart operations
   - Time interval generation
   - Data formatting and merging
   - Chart configuration
   - Currency formatting
   - Color schemes

2. **TransactionVolumeChart.jsx** - Line chart for transaction volume over time
   - Shows total amount and fees amount
   - Configurable time periods (hourly, daily, weekly, monthly)
   - Interactive date range selection
   - Summary statistics display

3. **TransactionStatusChart.jsx** - Pie chart for transaction status distribution
   - Shows PENDING, COMPLETED, FAILED, FAILED_TIMEOUT transactions
   - Percentage breakdown
   - Amount distribution by status

4. **AuthenticationChart.jsx** - Bar chart for authentication attempts (Admin only)
   - Successful vs failed authentication attempts
   - Configurable by authentication type (PIN, TOTP, PASSWORD)
   - Time-based analysis

5. **BillsChart.jsx** - Bar chart for bills analytics (Biller only)
   - Paid, unpaid, and unassigned bills
   - Stacked bar visualization
   - Amount tracking

#### User-Specific Analytics Components

1. **Admin Analytics** (`frontend/src/components/admin/Analytics.jsx`)
   - System-wide transaction volume
   - Transaction status distribution
   - Authentication attempts analysis

2. **Personal Analytics** (`frontend/src/components/personal/PersonalAnalytics.jsx`)
   - Personal transaction volume
   - Personal transaction status

3. **Agent Analytics** (`frontend/src/components/agent/AgentAnalytics.jsx`)
   - Cash-in/cash-out operations
   - Commission tracking

4. **Biller Analytics** (`frontend/src/components/biller/BillerAnalytics.jsx`)
   - Bills management insights
   - Payment status tracking

### Backend Controllers

#### Analytics Controller (`backend/controllers/admin/analyticsController.js`)

**Endpoints:**

1. **GET /admin/analytics/transactions/volume**
   - Query params: `startDate`, `endDate`, `period`
   - Returns: Transaction volume data aggregated by time period

2. **GET /admin/analytics/transactions/status**
   - Query params: `startDate`, `endDate`
   - Returns: Transaction status distribution

3. **GET /admin/analytics/authentication**
   - Query params: `startDate`, `endDate`, `period`, `authType`
   - Returns: Authentication attempts data

4. **GET /user/analytics/transactions/volume/:accountId**
   - Personal transaction volume for specific user

5. **GET /user/analytics/transactions/status/:accountId**
   - Personal transaction status for specific user

6. **GET /biller/analytics/bills/:accountId**
   - Bills analytics for specific biller

## Features

### Chart Capabilities

#### Time-Based Analysis
- Configurable time periods (hour, day, week, month)
- Automatic interval calculation for optimal display
- No data smoothing - shows actual data points
- Handles missing data points by showing zero values

#### Interactive Controls
- Date range pickers
- Quick date range buttons (7d, 30d, 90d)
- Time period selectors
- Filter options by type/status

#### Responsive Design
- Mobile-friendly layouts
- Configurable chart heights
- Grid-based layouts for multiple charts

### Security & Access Control

#### Role-Based Access
- **Admin**: Access to all system data
- **Personal Users**: Only their own transaction data
- **Agents**: Only their cash-in/cash-out operations
- **Billers**: Only their billing operations

#### Data Privacy
- Account ID filtering in database queries
- JWT authentication required for all endpoints
- User context validation

## Technical Implementation

### Database Queries

#### Transaction Volume Query Example
```sql
SELECT 
  DATE_TRUNC('day', t.initiationtimestamp) as date,
  COUNT(*) as count,
  COALESCE(SUM(t.subamount), 0) as totalAmount,
  COALESCE(SUM(t.feesamount), 0) as feesAmount
FROM transactions t
WHERE t.initiationtimestamp >= $1 
  AND t.initiationtimestamp <= $2
  AND (t.sourceaccountid = $3 OR t.destinationaccountid = $3)
GROUP BY DATE_TRUNC('day', t.initiationtimestamp)
ORDER BY date ASC
```

#### Authentication Analysis Query
```sql
SELECT 
  DATE_TRUNC('day', ae.eventtimestamp) as date,
  COUNT(CASE WHEN ae.issuccessful = true THEN 1 END) as successful_attempts,
  COUNT(CASE WHEN ae.issuccessful = false THEN 1 END) as failed_attempts
FROM authenticationevents ae
WHERE ae.eventtimestamp >= $1 
  AND ae.eventtimestamp <= $2
GROUP BY DATE_TRUNC('day', ae.eventtimestamp)
ORDER BY date ASC
```

### Frontend Chart Configuration

#### Chart.js Setup
- Responsive charts with proper aspect ratios
- Custom tooltips with currency formatting
- Consistent color schemes across all charts
- Accessibility-friendly design

#### Data Processing
- Time interval merging for consistent x-axis
- Percentage calculations for pie charts
- Currency formatting with locale support
- Zero-value handling for missing data points

## Usage Examples

### Admin Dashboard
```jsx
import Analytics from '../admin/Analytics';

// In AdminDashboard component
case 'analytics':
  return <Analytics />;
```

### Personal Dashboard
```jsx
import PersonalAnalytics from '../personal/PersonalAnalytics';

// In PersonalDashboard component
case 'analytics':
  return <PersonalAnalytics />;
```

### Custom Chart Usage
```jsx
import TransactionVolumeChart from '../common/charts/TransactionVolumeChart';

// For admin (system-wide data)
<TransactionVolumeChart height={400} />

// For personal user
<TransactionVolumeChart accountId={user.accountid} height={400} />
```

## API Response Formats

### Transaction Volume Response
```json
{
  "valid": true,
  "data": [
    {
      "date": "2025-01-01T00:00:00.000Z",
      "count": 15,
      "totalAmount": 5000.00,
      "feesAmount": 150.00
    }
  ]
}
```

### Transaction Status Response
```json
{
  "valid": true,
  "data": [
    {
      "status": "COMPLETED",
      "count": 120,
      "total_amount": 45000.00
    },
    {
      "status": "PENDING",
      "count": 8,
      "total_amount": 2500.00
    }
  ]
}
```

## Installation & Dependencies

### Frontend Dependencies
```bash
npm install chart.js react-chartjs-2
```

### Chart.js Components Used
- CategoryScale
- LinearScale
- PointElement
- LineElement
- BarElement
- ArcElement
- Tooltip
- Legend
- Filler

## Configuration

### Environment Variables
- Chart API endpoints configured in axios defaults
- Base URL: `http://localhost:3000`

### Chart Defaults
- Default height: 400px
- Default time period: 30 days
- Default chart colors: Blue, Green, Yellow, Red, Purple themes

## Future Enhancements

### Planned Features
1. Export functionality (PDF, CSV)
2. Real-time data updates with WebSocket
3. Advanced filtering options
4. Comparative analysis between time periods
5. Drill-down capabilities
6. Custom dashboard creation
7. Alert system for anomalies
8. Mobile app integration

### Performance Optimizations
1. Data caching strategies
2. Lazy loading for large datasets
3. Pagination for historical data
4. Background data refresh
5. Progressive data loading

## Troubleshooting

### Common Issues

1. **Charts not loading**
   - Check Chart.js dependencies
   - Verify API endpoints are accessible
   - Check authentication tokens

2. **Data not showing**
   - Verify date ranges are valid
   - Check account permissions
   - Ensure database has data for selected period

3. **Performance issues**
   - Reduce date range for large datasets
   - Check network connectivity
   - Monitor browser console for errors

### Debug Mode
Enable debug logging by setting `console.log` statements in chart components for troubleshooting data flow.

## Contributing

When adding new chart types:
1. Create reusable components in `/common/charts/`
2. Add appropriate backend endpoints
3. Implement proper error handling
4. Add responsive design considerations
5. Update documentation
