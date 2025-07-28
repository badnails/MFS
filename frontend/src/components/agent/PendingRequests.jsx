// src/components/agent/PendingRequests.jsx
import React, { useState, useEffect } from 'react';
import { 
  RefreshCw, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Eye, 
  Calendar, 
  DollarSign,
  Filter,
  SortAsc
} from 'lucide-react';
import axios from 'axios';

const PendingRequests = () => {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);
  const [filter, setFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('date_desc');

  useEffect(() => {
    fetchRequests();
  }, []);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/agent/float-requests');
      setRequests(response.data.requests);
      setError('');
    } catch (err) {
      setError('Failed to load requests');
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
      const response = await axios.get(`/agent/float-request-document/${requestId}`, {
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
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Pending Requests</h2>
        </div>
        <div className="p-6">
          <div className="min-h-96 flex items-center justify-center">
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
      <div className="bg-white rounded-lg shadow">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900">Float Requests</h2>
            <button
              onClick={fetchRequests}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
          </div>
        </div>

        {/* Controls */}
        <div className="p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
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
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-6 bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
              {error}
            </div>
          )}

          {filteredAndSortedRequests().length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">No float requests found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAndSortedRequests().map((request) => (
                <div
                  key={request.request_id}
                  className="border border-gray-200 rounded-lg p-6 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
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
                          <Calendar className="h-5 w-5 text-blue-600" />
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {formatDate(request.request_date)}
                            </p>
                            <p className="text-xs text-gray-500">Request Date</p>
                          </div>
                        </div>

                        {request.processed_date && (
                          <div className="flex items-center space-x-2">
                            <Calendar className="h-5 w-5 text-purple-600" />
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {formatDate(request.processed_date)}
                              </p>
                              <p className="text-xs text-gray-500">Processed Date</p>
                            </div>
                          </div>
                        )}
                      </div>

                      {request.comments && (
                        <div className="mb-4">
                          <p className="text-sm font-medium text-gray-700 mb-1">Comments:</p>
                          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            {request.comments}
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-500">
                          Document: {request.sup_doc_filename}
                        </div>
                        <button
                          onClick={() => viewSupportingDocument(request.request_id)}
                          className="inline-flex items-center px-3 py-2 border border-blue-300 rounded-md text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100"
                        >
                          <Eye className="h-4 w-4 mr-2" />
                          View Document
                        </button>
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
    </>
  );
};

export default PendingRequests;
