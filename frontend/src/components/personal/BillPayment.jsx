import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Receipt, Building, Loader2 } from 'lucide-react';
import AccountSearch from '../common/AccountSearch';
import axios from 'axios';

const BillPayment = ({ onClose }) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [selectedBiller, setSelectedBiller] = useState(null);
  const [bills, setBills] = useState([]);
  const [loadingBills, setLoadingBills] = useState(false);
  const [error, setError] = useState('');

  // Move to step 2 and fetch bills
  const handleBillerSelect = async (biller) => {
    setSelectedBiller(biller);
    setLoadingBills(true);
    setError('');
    try {
      const res = await axios.get(`/user/assigned/${biller.accountid}`); // You must have this route on backend
      setBills(res.data);
      setStep(2);
    } catch (err) {
      setError('Failed to fetch bills for this biller.');
    } finally {
      setLoadingBills(false);
    }
  };

  const handleBillSelect = (bill) => {
    navigate('/payment', {
      state: {
        recipientId: selectedBiller.accountid,
        recipientName: selectedBiller.accountname,
        paymentType: 'bill-payment',
        description: `Pay bill ${bill.billname || bill.billid}`,
        amount: bill.amount,
        billId: bill.billid
      }
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full max-h-[90vh] overflow-y-auto transition-all duration-300 ease-in-out">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
              <Receipt className="h-5 w-5 text-orange-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900">Bill Payment</h2>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Step 1: Select Biller */}
        {step === 1 && (
          <div className="p-6 space-y-6 animate-fade-in">
            <p className="text-sm text-gray-600">Search and select a biller to continue</p>
            <AccountSearch
              accountType="BILLER"
              onSelectAccount={handleBillerSelect}
              placeholder="Search for billers..."
            />
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {loadingBills && (
              <div className="flex items-center justify-center pt-4">
                <Loader2 className="animate-spin h-5 w-5 text-orange-600" />
              </div>
            )}
          </div>
        )}

        {/* Step 2: Show bills */}
        {step === 2 && (
          <div className="p-6 space-y-4 animate-fade-in">
            <h3 className="text-sm font-medium text-gray-700">
              Bills assigned to you by <span className="font-semibold">{selectedBiller.accountname}</span>
            </h3>
            {bills.length === 0 ? (
              <p className="text-gray-500 text-sm">No pending bills.</p>
            ) : (
              <ul className="divide-y divide-gray-200">
                {bills.map((bill) => (
                  <li
                    key={bill.billid}
                    onClick={() => handleBillSelect(bill)}
                    className="p-4 hover:bg-gray-50 rounded-lg cursor-pointer transition"
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm font-medium text-gray-800">{bill.billname || `Bill #${bill.billid}`}</p>
                        <p className="text-sm text-gray-500">Amount: {bill.amount} BDT</p>
                      </div>
                      <p className="text-sm text-gray-400">{new Date(bill.duedate).toLocaleDateString()}</p>
                    </div>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex space-x-3 pt-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BillPayment;
