// src/components/admin/FloatRequestsManagement.jsx
import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  DollarSign,
  ArrowRight,
  Filter,
  SortAsc,
  User
} from 'lucide-react';
import axios from 'axios';

const FloatRequestsManagement = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [confirmModal, setConfirmModal] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/admin/float-requests');
      setRequests(response.data.requests);
      setError('');
    } catch (err) {
      setError('Failed to load float requests');
      console.error('Fetch requests error:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'APPROVED':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'REJECTED':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const viewSupportingDocument = async (requestId) => {
    try {
      const response = await axios.get(`/admin/float-request-document/${requestId}`, {
        responseType: 'blob'
      });
      
      const imageUrl = URL.createObjectURL(response.data);
      setSelectedImage(imageUrl);
    } catch (err) {
      console.error('Error loading document:', err);
      alert('Failed to load supporting document');
    }
  };

  const closeImageModal = () => {
    if (selectedImage) {
      URL.revokeObjectURL(selectedImage);
      setSelectedImage(null);
    }
  };

  const handleApproveRequest = (request) => {
    setConfirmModal({
      type: 'approve',
      request,
      currentBalance: request.agent_current_balance,
      futureBalance: request.agent_current_balance + request.amount
    });
  };

  const handleRejectRequest = (request) => {
    setConfirmModal({
      type: 'reject',
      request
    });
  };

  const confirmAction = async () => {
    if (!confirmModal) return;
    
    setActionLoading(true);
    try {
      const { type, request } = confirmModal;
      
      if (type === 'approve') {
        // First update the balance
        await axios.post('/admin/balanceupdate', {
          accountId: request.accountid,
          amount: request.amount
        });
      }
      
      // Update request status
      await axios.put(`/admin/float-request/${request.request_id}/status`, {
        status: type === 'approve' ? 'APPROVED' : 'REJECTED'
      });
      
      // Refresh requests
      await fetchRequests();
      
      setConfirmModal(null);
      
    } catch (err) {
      console.error('Action error:', err);
      alert(`Failed to ${confirmModal.type} request`);
    } finally {
      setActionLoading(false);
    }
  };

  const filteredAndSortedRequests = () => {
    let filtered = requests;
    
    // Apply filter
    if (filter !== 'ALL') {
      filtered = requests.filter(req => req.request_status === filter);
    }
    
    // Apply sorting
    const sorted = [...filtered].sort((a, b) => {
      switch (sortBy) {
        case 'date_desc':
          return new Date(b.request_date) - new Date(a.request_date);
        case 'date_asc':
          return new Date(a.request_date) - new Date(b.request_date);
        case 'amount_desc':
          return b.amount - a.amount;
        case 'amount_asc':
          return a.amount - b.amount;
        default:
          return 0;
      }
    });
    
    return sorted;
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Float Requests</h2>
          <p className="text-gray-600">Manage agent float requests and balance updates.</p>
        </div>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin text-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading requests...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Float Requests</h2>
          <p className="text-gray-600">Manage agent float requests and balance updates.</p>
        </div>

        {/* Controls */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            <div className="flex flex-col sm:flex-row gap-4">
              {/* Filter */}
              <div className="flex items-center space-x-2">
                <Filter className="h-4 w-4 text-gray-500" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="ALL">All Requests</option>
                  <option value="PENDING">Pending</option>
                  <option value="APPROVED">Approved</option>
                  <option value="REJECTED">Rejected</option>
                </select>
              </div>

              {/* Sort */}
              <div className="flex items-center space-x-2">
                <SortAsc className="h-4 w-4 text-gray-500" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value)}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="date_desc">Date (Newest)</option>
                  <option value="date_asc">Date (Oldest)</option>
                  <option value="amount_desc">Amount (High to Low)</option>
                  <option value="amount_asc">Amount (Low to High)</option>
                </select>
              </div>
            </div>

            <button
              onClick={fetchRequests}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Requests List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          {error && (
            <div className="p-6 border-b border-gray-200">
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            </div>
          )}

          {filteredAndSortedRequests().length === 0 ? (
            <div className="text-center py-12">
              <Clock className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Requests Found</h3>
              <p className="text-gray-500">
                {filter === 'ALL' ? 'No float requests have been submitted yet.' : `No ${filter.toLowerCase()} requests found.`}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredAndSortedRequests().map((request) => (
                <div key={request.request_id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-4">
                        {getStatusIcon(request.request_status)}
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium border ${getStatusColor(
                            request.request_status
                          )}`}
                        >
                          {request.request_status}
                        </span>
                        <span className="text-sm text-gray-500">
                          Request #{request.request_id}
                        </span>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
                        <div className="flex items-center space-x-2">
                          <User className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {request.agent_name}
                            </p>
                            <p className="text-xs text-gray-500">Agent ID: {request.accountid}</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <DollarSign className="h-5 w-5 text-green-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatCurrency(request.amount)}
                            </p>
                            <p className="text-xs text-gray-500">Requested Amount</p>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2">
                          <Calendar className="h-5 w-5 text-purple-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(request.request_date)}
                            </p>
                            <p className="text-xs text-gray-500">Request Date</p>
                          </div>
                        </div>

                        {request.processed_date && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-gray-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(request.processed_date)}
                              </p>
                              <p className="text-xs text-gray-500">Processed Date</p>
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Document: {request.sup_doc_filename}
                        </div>
                        <div className="flex items-center space-x-3">
                          <button
                            onClick={() => viewSupportingDocument(request.request_id)}
                            className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            View Document
                          </button>
                          
                          {request.request_status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApproveRequest(request)}
                                className="inline-flex items-center px-3 py-2 border border-green-300 rounded-md text-sm font-medium text-green-700 bg-green-50 hover:bg-green-100"
                              >
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectRequest(request)}
                                className="inline-flex items-center px-3 py-2 border border-red-300 rounded-md text-sm font-medium text-red-700 bg-red-50 hover:bg-red-100"
                              >
                                <XCircle className="h-4 w-4 mr-2" />
                                Reject
                              </button>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Image Modal */}
      {selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-[200] p-4">
          <div className="relative max-w-4xl max-h-[90vh] bg-white rounded-lg overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Supporting Document</h3>
              <button
                onClick={closeImageModal}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            <div className="p-4">
              <img
                src={selectedImage}
                alt="Supporting Document"
                className="max-w-full max-h-[70vh] object-contain mx-auto"
              />
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[200] p-4">
          <div className="bg-white rounded-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {confirmModal.type === 'approve' ? 'Approve Float Request' : 'Reject Float Request'}
              </h3>
              
              {confirmModal.type === 'approve' ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-blue-800 mb-3">
                      <strong>Agent:</strong> {confirmModal.request.agent_name}
                    </p>
                    <p className="text-sm text-blue-800 mb-3">
                      <strong>Request Amount:</strong> {formatCurrency(confirmModal.request.amount)}
                    </p>
                    <div className="flex items-center justify-center space-x-4">
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Current Balance</p>
                        <p className="text-lg font-bold text-gray-900">
                          {formatCurrency(confirmModal.currentBalance)}
                        </p>
                      </div>
                      <ArrowRight className="h-6 w-6 text-green-600" />
                      <div className="text-center">
                        <p className="text-sm text-gray-600">Future Balance</p>
                        <p className="text-lg font-bold text-green-600">
                          {formatCurrency(confirmModal.futureBalance)}
                        </p>
                      </div>
                    </div>
                  </div>
                  <p className="text-sm text-gray-600">
                    This will add {formatCurrency(confirmModal.request.amount)} to the agent's balance and mark the request as approved.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <p className="text-sm text-red-800 mb-2">
                      <strong>Agent:</strong> {confirmModal.request.agent_name}
                    </p>
                    <p className="text-sm text-red-800">
                      <strong>Request Amount:</strong> {formatCurrency(confirmModal.request.amount)}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    This will mark the request as rejected. The agent's balance will not be modified.
                  </p>
                </div>
              )}
              
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setConfirmModal(null)}
                  className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
                  disabled={actionLoading}
                >
                  Cancel
                </button>
                <button
                  onClick={confirmAction}
                  disabled={actionLoading}
                  className={`flex-1 px-4 py-2 text-white rounded-lg ${
                    confirmModal.type === 'approve'
                      ? 'bg-green-600 hover:bg-green-700'
                      : 'bg-red-600 hover:bg-red-700'
                  } disabled:opacity-50`}
                >
                  {actionLoading 
                    ? 'Processing...' 
                    : confirmModal.type === 'approve' 
                      ? 'Confirm Approval' 
                      : 'Confirm Rejection'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default FloatRequestsManagement;
