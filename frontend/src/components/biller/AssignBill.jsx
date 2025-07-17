import React, { useEffect, useState } from 'react';
import AccountSearch from '../common/AccountSearch';
import axios from 'axios';
import { X } from 'lucide-react';

const AssignBill = ({ onClose }) => {
    const [form, setForm] = useState({
        batchid: '',
        issuedtoaccountids: [],
        amount: '',
        issuedate: new Date().toISOString().split('T')[0],
        duedate: '',
    });
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState('');
    const [batches, setBatches] = useState([]);


    useEffect(() => {
        const fetchData = async () => {
            try {
                const [batchRes] = await Promise.all([
                    axios.get('/biller/batches'),
                    //axios.get('/accounts/customers')
                ]);
                setBatches(batchRes.data);
                //setCustomers(customerRes.data);
            } catch (err) {
                setError('Failed to load dropdown data.');
            }
        };
        fetchData();
    }, []);

    const handleChange = (e) => {
        setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            await axios.post('/biller/assignbills', {
                batchid: form.batchid,
                amount: form.amount,
                duedate: form.duedate,
                accountids: form.issuedtoaccountids.map((a) => a.accountid)
            });
            setSuccess(true);
            setTimeout(onClose, 1000);
        } catch (err) {
            setError('Failed to assign bill.');
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

                <h2 className="text-xl font-semibold mb-4">Assign Bill</h2>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700">Bill Batch</label>
                        <select
                            name="batchid"
                            value={form.batchid}
                            onChange={handleChange}
                            required
                            className="w-full border rounded px-3 py-2 mt-1"
                        >
                            <option value="">Select a batch</option>
                            {batches.map((batch) => (
                                <option key={batch.batchid} value={batch.batchid}>
                                    {batch.batchname} ({batch.batchid})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <AccountSearch
                            accountType="PERSONAL"
                            displayStyle="circles"
                            placeholder="Search personal account..."
                            onSelectAccount={(account) => {
                                if (
                                    account &&
                                    !form.issuedtoaccountids.some((a) => a.accountid === account.accountid)
                                ) {
                                    setForm((prev) => ({
                                        ...prev,
                                        issuedtoaccountids: [...prev.issuedtoaccountids, account]
                                    }));
                                }
                            }}
                        />

                    </div>
                    {form.issuedtoaccountids.length > 0 && (
                        <div className="mt-2 space-y-2">
                            {form.issuedtoaccountids.map((acc) => (
                                <div
                                    key={acc.accountid}
                                    className="flex justify-between items-center border p-2 rounded"
                                >
                                    <span>{acc.accountname} ({acc.accountid})</span>
                                    <button
                                        type="button"
                                        onClick={() =>
                                            setForm((prev) => ({
                                                ...prev,
                                                issuedtoaccountids: prev.issuedtoaccountids.filter(
                                                    (a) => a.accountid !== acc.accountid
                                                )
                                            }))
                                        }
                                        className="text-red-500 hover:underline"
                                    >
                                        Remove
                                    </button>
                                </div>
                            ))}
                        </div>
                    )}



                    <div>
                        <label className="block text-sm font-medium text-gray-700">Amount</label>
                        <input
                            type="number"
                            name="amount"
                            step="0.01"
                            required
                            value={form.amount}
                            onChange={handleChange}
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Issue Date</label>
                        <input
                            type="date"
                            name="issuedate"
                            value={form.issuedate}
                            onChange={handleChange}
                            required
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700">Due Date</label>
                        <input
                            type="date"
                            name="duedate"
                            value={form.duedate}
                            onChange={handleChange}
                            required
                            className="w-full border rounded px-3 py-2 mt-1"
                        />
                    </div>

                    {error && <p className="text-red-600 text-sm">{error}</p>}
                    {success && <p className="text-green-600 text-sm">Bill assigned successfully!</p>}

                    <div className="flex justify-end">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-yellow-600 text-white px-4 py-2 rounded hover:bg-yellow-700"
                        >
                            {loading ? 'Assigning...' : 'Assign Bill'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AssignBill;
