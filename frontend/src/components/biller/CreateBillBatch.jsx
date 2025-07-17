import React, { useState } from 'react';
import axios from 'axios';
import { X } from 'lucide-react';

const recurrenceOptions = ['DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY']; // Adjust to match your enum

const CreateBillBatch = ({ onClose }) => {
  const [form, setForm] = useState({
    batchname: '',
    description: '',
    recurrencetype: 'MONTHLY',
    startdate: '',
    penalty: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await axios.post('/biller/createbatch', form);
      setSuccess(true);
      setTimeout(onClose, 1000); // auto-close after success
    } catch (err) {
      setError('Failed to create batch. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-800"
        >
          <X className="h-5 w-5" />
        </button>

        <h2 className="text-xl font-semibold mb-4">Create Bill Batch</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Batch Name</label>
            <input
              type="text"
              name="batchname"
              required
              value={form.batchname}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Description</label>
            <textarea
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={2}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Recurrence Type</label>
            <select
              name="recurrencetype"
              value={form.recurrencetype}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            >
              {recurrenceOptions.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Start Date</label>
            <input
              type="date"
              name="startdate"
              required
              value={form.startdate}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Penalty (optional)</label>
            <input
              type="number"
              name="penalty"
              value={form.penalty}
              onChange={handleChange}
              className="w-full border rounded px-3 py-2 mt-1"
            />
          </div>

          {error && <p className="text-red-600 text-sm">{error}</p>}
          {success && <p className="text-green-600 text-sm">Batch created successfully!</p>}

          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="bg-indigo-600 text-white px-4 py-2 rounded hover:bg-indigo-700"
            >
              {loading ? 'Creating...' : 'Create Batch'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateBillBatch;
