// utils/notificationFormatter.js
import axios from 'axios';

class NotificationMessageFormatter {
  constructor() {
    this.transactionCache = new Map();
  }

  // Format notification based on type and data
  formatNotification(rawNotification) {
    const {
      notificationid,
      accountid,
      notification_type,
      notification_data,
      created_at,
      read_at
    } = rawNotification;

    const baseNotification = {
      id: notificationid,
      notificationid,
      accountid,
      type: notification_type,
      data: notification_data || {},
      timestamp: created_at,
      created_at,
      read_at,
      read: !!read_at
    };

    // For transaction notifications, set basic message initially
    if (notification_type === 'TRX_CREDIT' || notification_type === 'TRX_DEBIT') {
      return {
        ...baseNotification,
        message: this.createMessage(notification_type, null),
        requiresDetails: true
      };
    }

    // Handle other notification types here in the future
    return {
      ...baseNotification,
      message: 'New notification received',
      requiresDetails: false
    };
  }

  // Fetch transaction details from API
  async getTransactionDetails(transactionId) {
    try {
      // Check cache first
      if (this.transactionCache.has(transactionId)) {
        return this.transactionCache.get(transactionId);
      }

      const response = await axios.get(`/transaction/details/${transactionId}`);
      
      if (response.data.valid) {
        const details = response.data.transactionDetails;
        // Cache the result
        this.transactionCache.set(transactionId, details);
        return details;
      }
      
      return null;
    } catch (error) {
      console.error('Error fetching transaction details:', error);
      return null;
    }
  }

  // Single message creator function for both toast and notification center
  createMessage(type, transactionDetails) {
    if (!transactionDetails) {
      if (type === 'TRX_CREDIT') {
        return 'You have received money';
      } else if (type === 'TRX_DEBIT') {
        return 'You have sent money';
      }
      return 'Transaction notification';
    }

    const amount = parseFloat(transactionDetails.subamount);
    const formattedAmount = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);

    if (type === 'TRX_CREDIT') {
      return `You have received ${formattedAmount} from ${transactionDetails.sender}`;
    } else if (type === 'TRX_DEBIT') {
      return `You have sent ${formattedAmount} to ${transactionDetails.recipient}`;
    }

    return `Transaction of ${formattedAmount}`;
  }

  // Format transaction type to Title Case
  formatTransactionType(transactionType) {
    if (!transactionType) return null;
    
    return transactionType
      .toLowerCase()
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  // Clear transaction cache (useful for memory management)
  clearCache() {
    this.transactionCache.clear();
  }

  // Get cached transaction details
  getCachedTransactionDetails(transactionId) {
    return this.transactionCache.get(transactionId);
  }
}

export default new NotificationMessageFormatter();
