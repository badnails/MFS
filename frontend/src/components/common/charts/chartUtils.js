// Chart utility functions for the MFS analytics system

// Generate time intervals for the x-axis based on the time period
export const generateTimeIntervals = (startDate, endDate, totalPoints = 20) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const timeDiff = end.getTime() - start.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  let intervals = [];
  let intervalSize;
  let formatString;
  
  // Determine interval size based on the date range
  if (daysDiff <= 7) {
    // For a week or less, show hourly intervals
    intervalSize = Math.max(1, Math.floor((timeDiff / (1000 * 3600)) / totalPoints));
    intervalSize = intervalSize * 1000 * 3600; // Convert to milliseconds
    formatString = 'HH:mm';
  } else if (daysDiff <= 31) {
    // For a month or less, show daily intervals
    intervalSize = Math.max(1, Math.floor(daysDiff / totalPoints));
    intervalSize = intervalSize * 24 * 60 * 60 * 1000; // Convert to milliseconds
    formatString = 'MM/dd';
  } else if (daysDiff <= 365) {
    // For a year or less, show weekly intervals
    intervalSize = Math.max(7, Math.floor(daysDiff / totalPoints));
    intervalSize = intervalSize * 24 * 60 * 60 * 1000; // Convert to milliseconds
    formatString = 'MM/dd';
  } else {
    // For more than a year, show monthly intervals
    intervalSize = Math.max(30, Math.floor(daysDiff / totalPoints));
    intervalSize = intervalSize * 24 * 60 * 60 * 1000; // Convert to milliseconds
    formatString = 'yyyy/MM';
  }
  
  let currentTime = start.getTime();
  while (currentTime <= end.getTime()) {
    intervals.push({
      timestamp: new Date(currentTime),
      formatted: formatDate(new Date(currentTime), formatString)
    });
    currentTime += intervalSize;
  }
  
  // Ensure we include the end date
  if (intervals.length === 0 || intervals[intervals.length - 1].timestamp.getTime() < end.getTime()) {
    intervals.push({
      timestamp: end,
      formatted: formatDate(end, formatString)
    });
  }
  
  return intervals;
};

// Format date according to the specified format
export const formatDate = (date, format) => {
  const d = new Date(date);
  
  switch (format) {
    case 'HH:mm':
      return d.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit', 
        hour12: false 
      });
    case 'MM/dd':
      return d.toLocaleDateString('en-US', { 
        month: '2-digit', 
        day: '2-digit' 
      });
    case 'yyyy/MM':
      return d.toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: '2-digit' 
      });
    default:
      return d.toLocaleDateString('en-US');
  }
};

// Format currency values
export const formatCurrency = (amount) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount || 0);
};

// Generate chart colors for different series
export const getChartColors = () => ({
  primary: '#3B82F6',     // Blue
  secondary: '#10B981',   // Green
  tertiary: '#F59E0B',    // Yellow
  quaternary: '#EF4444',  // Red
  quinary: '#8B5CF6',     // Purple
  senary: '#06B6D4',      // Cyan
  septenary: '#84CC16',   // Lime
  octonary: '#F97316'     // Orange
});

// Default chart configuration for consistent styling
export const getDefaultChartConfig = () => ({
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top',
      labels: {
        usePointStyle: true,
        padding: 20,
        font: {
          size: 12,
          family: 'Inter, sans-serif'
        }
      }
    },
    tooltip: {
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      titleColor: '#fff',
      bodyColor: '#fff',
      borderColor: '#374151',
      borderWidth: 1,
      cornerRadius: 8,
      displayColors: true,
      mode: 'index',
      intersect: false
    }
  },
  scales: {
    x: {
      grid: {
        display: true,
        color: '#F3F4F6'
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        },
        color: '#6B7280'
      }
    },
    y: {
      grid: {
        display: true,
        color: '#F3F4F6'
      },
      ticks: {
        font: {
          size: 11,
          family: 'Inter, sans-serif'
        },
        color: '#6B7280'
      }
    }
  }
});

// Merge transaction data with time intervals to ensure all time points are represented
export const mergeDataWithIntervals = (intervals, data, valueKey = 'amount') => {
  return intervals.map(interval => {
    const matchingData = data.find(d => {
      const dataDate = new Date(d.date);
      const intervalDate = interval.timestamp;
      // Check if dates are within the same interval period
      return Math.abs(dataDate.getTime() - intervalDate.getTime()) < (12 * 60 * 60 * 1000); // 12 hours tolerance
    });
    
    return {
      x: interval.formatted,
      timestamp: interval.timestamp,
      y: matchingData ? parseFloat(matchingData[valueKey]) : 0
    };
  });
};

// Calculate percentage for pie chart data
export const calculatePercentages = (data, totalKey = 'count') => {
  const total = data.reduce((sum, item) => sum + parseFloat(item[totalKey] || 0), 0);
  
  return data.map(item => ({
    ...item,
    percentage: total > 0 ? ((parseFloat(item[totalKey] || 0) / total) * 100).toFixed(1) : 0
  }));
};

// Generate pie chart colors based on status
export const getStatusColors = () => ({
  'COMPLETED': '#10B981',
  'PENDING': '#F59E0B', 
  'FAILED': '#EF4444',
  'FAILED_TIMEOUT': '#DC2626'
});

// Aggregate data by time period
export const aggregateByTimePeriod = (data, period = 'day') => {
  const grouped = {};
  
  data.forEach(item => {
    const date = new Date(item.timestamp || item.date);
    let key;
    
    switch (period) {
      case 'hour':
        key = date.toISOString().substring(0, 13); // YYYY-MM-DDTHH
        break;
      case 'day':
        key = date.toISOString().substring(0, 10); // YYYY-MM-DD
        break;
      case 'week':
        const weekStart = new Date(date);
        weekStart.setDate(date.getDate() - date.getDay());
        key = weekStart.toISOString().substring(0, 10);
        break;
      case 'month':
        key = date.toISOString().substring(0, 7); // YYYY-MM
        break;
      default:
        key = date.toISOString().substring(0, 10);
    }
    
    if (!grouped[key]) {
      grouped[key] = {
        date: key,
        totalAmount: 0,
        feesAmount: 0,
        count: 0,
        items: []
      };
    }
    
    grouped[key].totalAmount += parseFloat(item.subamount || item.amount || 0);
    grouped[key].feesAmount += parseFloat(item.feesamount || item.fees || 0);
    grouped[key].count += 1;
    grouped[key].items.push(item);
  });
  
  return Object.values(grouped).sort((a, b) => new Date(a.date) - new Date(b.date));
};
