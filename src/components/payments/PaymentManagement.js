import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Download,
  Filter,
  CreditCard,
  Edit,
  Trash2
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { paymentOps } from '../../services/jsonbin-new';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import ExpenseForm from './ExpenseForm';
import FinancialReports from './FinancialReports';

const PaymentsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [editingPayment, setEditingPayment] = useState(null);
  const [showEditModal, setShowEditModal] = useState(false);

  const fetchPayments = useCallback(async () => {
    try {
      setLoading(true);

      let allPayments = await paymentOps.getPayments();

      if (searchTerm) {
        allPayments = allPayments.filter(payment =>
          payment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
          (payment.orderId && payment.orderId.toLowerCase().includes(searchTerm.toLowerCase())) ||
          payment.category.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      if (typeFilter) {
        allPayments = allPayments.filter(payment => payment.type === typeFilter);
      }

      if (categoryFilter) {
        allPayments = allPayments.filter(payment => payment.category === categoryFilter);
      }

      // Sort by date (most recent first)
      allPayments.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

      // Apply pagination
      const pageSize = 20;
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      const paginatedPayments = allPayments.slice(startIndex, endIndex);

      setPayments(paginatedPayments);
      setTotalPages(Math.ceil(allPayments.length / pageSize));

    } catch (error) {
      toast.error('Failed to fetch payments');
      setPayments([]);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, typeFilter, categoryFilter, currentPage]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  // Get unique categories for filter dropdown
  const categories = [...new Set(payments.map(p => p.category).filter(Boolean))];

  const collectUsers = async () => {
    try {
      const { authOps } = await import('../../services/jsonbin-new');
      const users = await authOps.getUsers();
      return users.filter(user => user.isActive);
    } catch {
      return [];
    }
  };

  const collectClients = async () => {
    try {
      const { clientOps } = await import('../../services/jsonbin-new');
      const clients = await clientOps.getClients();
      return clients;
    } catch {
      return [];
    }
  };

  const handleEdit = async (payment) => {
    setEditingPayment({ ...payment });
    setShowEditModal(true);
  };

  const handleDelete = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this payment? This action cannot be undone.')) {
      return;
    }

    try {
      await paymentOps.deletePayment(paymentId);
      toast.success('Payment deleted successfully');
      await fetchPayments(); // Refresh the payments list
    } catch (error) {
      toast.error('Failed to delete payment');
    }
  };

  const handleSaveEdit = async (updatedPaymentData) => {
    try {
      await paymentOps.updatePayment(editingPayment._id, updatedPaymentData);
      toast.success('Payment updated successfully');
      setShowEditModal(false);
      setEditingPayment(null);
      await fetchPayments(); // Refresh the payments list
    } catch (error) {
      toast.error('Failed to update payment');
    }
  };

  const exportPayments = () => {
    try {
      // Simple CSV export
      const csvData = payments.map(p => ({
        Date: new Date(p.createdAt).toLocaleDateString(),
        Type: p.type,
        Description: p.description,
        Category: p.category || 'N/A',
        'Related To': p.type === 'expense' ?
          (p.userName ? `${p.userName} (${p.userRole})` : 'N/A') :
          (p.clientName ? `${p.clientName} (${p.clientEmail || 'No Email'})` : 'N/A'),
        'Order ID': p.orderId || 'N/A',
        Amount: p.amount || 0,
        Notes: p.notes || 'N/A'
      }));

      const csvString = [
        Object.keys(csvData[0]).join(','),
        ...csvData.map(row => Object.values(row).join(','))
      ].join('\n');

      const blob = new Blob([csvString], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'payments_export.csv';
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success('Payments exported successfully');
    } catch {
      toast.error('Export failed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payment Management</h1>
          <p className="text-gray-600 mt-1">View and manage all payments and transactions</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={exportPayments}
            className="btn-outline flex items-center"
            disabled={!payments.length}
          >
            <Download className="h-4 w-4 mr-2" />
            Export
          </button>
          {(user?.role === 'treasurer' || user?.role === 'super_admin') && (
            <button
              onClick={() => navigate('/payments/new')}
              className="btn-primary flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Payment
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 form-input"
            />
          </div>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Types</option>
            <option value="income">Income</option>
            <option value="expense">Expense</option>
          </select>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>

          {/* Filter Reset */}
          <button
            onClick={() => {
              setSearchTerm('');
              setTypeFilter('');
              setCategoryFilter('');
              setCurrentPage(1);
            }}
            className="btn-secondary flex items-center justify-center"
          >
            <Filter className="h-4 w-4 mr-2" />
            Reset
          </button>
        </div>
      </div>

      {/* Payments Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Description
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Related To
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {payments.length > 0 ? payments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.createdAt ? new Date(payment.createdAt).toLocaleDateString() : 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          payment.type === 'income'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {payment.type}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900 truncate max-w-xs" title={payment.description}>
                          {payment.description}
                        </div>
                        {payment.notes && (
                          <div className="text-xs text-gray-500 truncate max-w-xs" title={payment.notes}>
                            {payment.notes}
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                        {payment.category || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.type === 'expense' && payment.userName ? (
                          <div>
                            <div className="text-xs text-gray-500">User: {payment.userName}</div>
                            <div className="text-xs text-gray-400">{payment.userRole}</div>
                          </div>
                        ) : payment.type === 'income' && payment.clientName ? (
                          <div>
                            <div className="text-xs text-gray-500">Client: {payment.clientName}</div>
                            {payment.clientEmail && <div className="text-xs text-gray-400">{payment.clientEmail}</div>}
                          </div>
                        ) : (
                          'N/A'
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.orderId || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                        <span className={payment.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                          {payment.type === 'income' ? '+' : '-'}{payment.amount ? payment.amount.toLocaleString() : '0'} TND
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleEdit(payment)}
                            className="text-blue-600 hover:text-blue-900"
                            title="Edit payment"
                          >
                            <Edit className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(payment._id)}
                            className="text-red-600 hover:text-red-900"
                            title="Delete payment"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  )) : (
                    <tr>
                      <td colSpan="8" className="px-6 py-12 text-center">
                        <div className="flex flex-col items-center">
                          <CreditCard className="h-12 w-12 text-gray-400 mb-4" />
                          <p className="text-gray-500 text-lg font-medium">No payments found</p>
                          <p className="text-gray-400">Try adjusting your filters or add some transactions</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Showing page <span className="font-medium">{currentPage}</span> of{' '}
                      <span className="font-medium">{totalPages}</span>
                    </p>
                  </div>
                  <div>
                    <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                      <button
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        disabled={currentPage === 1}
                        className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ‹
                      </button>
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        const pageNum = Math.max(1, Math.min(totalPages, currentPage - 2 + i));
                        return (
                          <button
                            key={pageNum}
                            onClick={() => setCurrentPage(pageNum)}
                            className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                              pageNum === currentPage
                                ? 'z-10 bg-pink-50 border-pink-500 text-pink-600'
                                : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                            }`}
                          >
                            {pageNum}
                          </button>
                        );
                      })}
                      <button
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        disabled={currentPage === totalPages}
                        className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        ›
                      </button>
                    </nav>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Payment Modal */}
      {showEditModal && editingPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Edit Payment</h2>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingPayment(null);
                  }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <Trash2 className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.target);
                  const updatedData = {
                    description: formData.get('description'),
                    amount: parseFloat(formData.get('amount')),
                    category: formData.get('category'),
                    type: formData.get('type'),
                    orderId: formData.get('orderId'),
                    notes: formData.get('notes')
                  };
                  handleSaveEdit(updatedData);
                }}
                className="space-y-4"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Description *
                    </label>
                    <input
                      type="text"
                      name="description"
                      defaultValue={editingPayment.description}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Amount (TND) *
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      name="amount"
                      defaultValue={editingPayment.amount}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Category
                    </label>
                    <input
                      type="text"
                      name="category"
                      defaultValue={editingPayment.category}
                      list="edit-categories"
                      placeholder="Enter category"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <datalist id="edit-categories">
                      {categories.map(cat => (
                        <option key={cat} value={cat} />
                      ))}
                    </datalist>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Type *
                    </label>
                    <select
                      name="type"
                      defaultValue={editingPayment.type}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    >
                      <option value="income">Income</option>
                      <option value="expense">Expense</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Order ID
                  </label>
                  <input
                    type="text"
                    name="orderId"
                    defaultValue={editingPayment.orderId}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notes
                  </label>
                  <textarea
                    name="notes"
                    defaultValue={editingPayment.notes}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                  />
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingPayment(null);
                    }}
                    className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const PaymentManagement = () => {
  return (
    <Routes>
      <Route path="/" element={<PaymentsList />} />
      <Route path="/new" element={<ExpenseForm />} />
      <Route path="/reports" element={<FinancialReports />} />
    </Routes>
  );
};

export default PaymentManagement;
