import React, { useState } from 'react';
import { Plus, DollarSign, Receipt, Users } from 'lucide-react';
import { paymentOps, clientOps } from '../../services/jsonbin-new';
import LoadingSpinner from '../common/LoadingSpinner';

const ExpenseForm = ({ onExpenseAdded, transactionType = 'both' }) => {
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    clientId: '',
    category: '',
    notes: '',
    type: transactionType === 'both' ? 'expense' : transactionType
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [clients, setClients] = useState([]);

  React.useEffect(() => {
    const loadClients = async () => {
      try {
        const clientList = await clientOps.getClients().catch(() => []);
        setClients(clientList);
      } catch (err) {
        console.error('❌ Failed to load clients:', err);
      }
    };

    loadClients();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount || (!formData.clientId && formData.type === 'expense')) {
      setError('Please fill in all required fields');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let transactionData = {
        description: formData.description,
        amount: parseFloat(formData.amount),
        category: formData.category,
        notes: formData.notes
      };

      // Add client association for expenses
      if (formData.type === 'expense' && formData.clientId) {
        transactionData.clientId = formData.clientId;
      }

      // Add client info if available
      if (formData.clientId) {
        const client = clients.find(c => c._id === formData.clientId);
        if (client) {
          transactionData.clientName = client.name;
          transactionData.clientEmail = client.email;
        }
      }

      let result;
      if (formData.type === 'expense') {
        result = await paymentOps.createExpense(transactionData);
      } else {
        result = await paymentOps.createIncome(transactionData);
      }

      console.log('✅ Transaction added:', result._id);

      // Reset form
      setFormData({
        description: '',
        amount: '',
        clientId: '',
        category: '',
        notes: '',
        type: transactionType === 'both' ? 'expense' : transactionType
      });

      setSuccess(`${formData.type === 'expense' ? 'Expense' : 'Income'} added successfully!`);

      // Notify parent component
      if (onExpenseAdded) {
        onExpenseAdded(result);
      }

    } catch (err) {
      console.error('❌ Failed to add transaction:', err);
      setError('Failed to add transaction. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = formData.type === 'expense'
    ? [
        'Office Supplies',
        'Software & Tools',
        'Marketing & Advertising',
        'Utilities',
        'Travel & Transport',
        'Professional Services',
        'Equipment',
        'Miscellaneous'
      ]
    : [
        'Service Fees',
        'Consultation',
        'Maintenance',
        'Licenses',
        'Commissions',
        'Miscellaneous'
      ];

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        {formData.type === 'expense' ? (
          <>
            <Receipt className="h-5 w-5 text-red-500 mr-2" />
            Add Expense
          </>
        ) : (
          <>
            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
            Add Income
          </>
        )}
      </h3>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
          {success}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Transaction Type Selector (only if type is 'both') */}
        {transactionType === 'both' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Transaction Type *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Expense</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">Income</span>
              </label>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="Enter transaction description"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Amount (TND) *
          </label>
          <input
            type="number"
            min="0"
            step="0.01"
            value={formData.amount}
            onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
            placeholder="0.00"
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Category
          </label>
          <select
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">Select category (optional)</option>
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Client Selection (only for expenses) */}
        {formData.type === 'expense' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Related Client *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.clientId}
                onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select client</option>
                {clients.map(client => (
                  <option key={client._id} value={client._id}>
                    {client.name} - {client.email}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder="Additional notes (optional)"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          />
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
        >
          {isLoading ? (
            <>
              <LoadingSpinner size="sm" color="white" />
              <span className="ml-2">Adding Transaction...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              Add {formData.type === 'expense' ? 'Expense' : 'Income'}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;