import React, { useState } from 'react';
import { Plus, DollarSign, Receipt, Users } from 'lucide-react';
import { paymentOps, clientOps, authOps, categoryOps } from '../../services/jsonbin-new';
import LoadingSpinner from '../common/LoadingSpinner';
import { useTranslation } from 'react-i18next';

const ExpenseForm = ({ onExpenseAdded, transactionType = 'both' }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    relatedEntityId: '',
    relatedEntityType: '', // 'client' or 'user'
    category: '',
    notes: '',
    type: transactionType === 'both' ? 'expense' : transactionType
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [clients, setClients] = useState([]);
  const [users, setUsers] = useState([]);
  const [expenseCategories, setExpenseCategories] = useState([]);
  const [incomeCategories, setIncomeCategories] = useState([]);

  React.useEffect(() => {
    const loadData = async () => {
      try {
        const [clientList, userList, categoriesData] = await Promise.all([
          clientOps.getClients().catch(() => []),
          authOps.getUsers().catch(() => []),
          categoryOps.getCategories().catch(() => ({ expense: [], income: [] }))
        ]);
        setClients(clientList);
        setUsers(userList);
        setExpenseCategories(categoriesData.expense);
        setIncomeCategories(categoriesData.income);
        console.log('Fetched clients:', clientList);
        console.log('Fetched users:', userList);
      } catch (err) {
        console.error('❌ Failed to load data:', err);
      }
    };

    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.description || !formData.amount) {
      setError(t('fill_all_required_fields'));
      return;
    }

    // Additional validation for related entity if selected
    if (formData.relatedEntityId && !formData.relatedEntityType) {
      setError(t('select_related_entity_type'));
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

      // Add new category if it doesn't exist
      if (formData.category && formData.type === 'expense' && !expenseCategories.includes(formData.category)) {
        await categoryOps.addCategory('expense', formData.category);
        setExpenseCategories(prev => [...prev, formData.category]);
      } else if (formData.category && formData.type === 'income' && !incomeCategories.includes(formData.category)) {
        await categoryOps.addCategory('income', formData.category);
        setIncomeCategories(prev => [...prev, formData.category]);
      }

      // Handle associations based on transaction type and related entity
      if (formData.type === 'expense' && formData.relatedEntityType === 'user' && formData.relatedEntityId) {
        transactionData.userId = formData.relatedEntityId;
        const user = users.find(u => u._id === formData.relatedEntityId);
        if (user) {
          transactionData.userName = user.fullName;
          transactionData.userEmail = user.email;
          transactionData.userRole = user.role;
        }
      } else if (formData.type === 'income' && formData.relatedEntityType === 'client' && formData.relatedEntityId) {
        transactionData.clientId = formData.relatedEntityId;
        const client = clients.find(c => c._id === formData.relatedEntityId);
        if (client) {
          transactionData.clientName = client.fullName;
          transactionData.clientEmail = client.phoneNumber;
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
        relatedEntityId: '',
        relatedEntityType: '',
        category: '',
        notes: '',
        type: transactionType === 'both' ? 'expense' : transactionType
      });

      setSuccess(t(formData.type === 'expense' ? 'expense_added_successfully' : 'income_added_successfully'));

      // Notify parent component
      if (onExpenseAdded) {
        onExpenseAdded(result);
      }

    } catch (err) {
      console.error('❌ Failed to add transaction:', err);
      setError(t('failed_to_add_transaction'));
    } finally {
      setIsLoading(false);
    }
  };

  const categoryOptions = formData.type === 'expense' ? expenseCategories : incomeCategories;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
        {formData.type === 'expense' ? (
          <>
            <Receipt className="h-5 w-5 text-red-500 mr-2" />
            {t('add_expense')}
          </>
        ) : (
          <>
            <DollarSign className="h-5 w-5 text-green-500 mr-2" />
            {t('add_income')}
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
              {t('transaction_type')} *
            </label>
            <div className="flex space-x-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="expense"
                  checked={formData.type === 'expense'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, relatedEntityId: '', relatedEntityType: '' })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{t('expense')}</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="type"
                  value="income"
                  checked={formData.type === 'income'}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value, relatedEntityId: '', relatedEntityType: '' })}
                  className="mr-2"
                />
                <span className="text-sm text-gray-700">{t('income')}</span>
              </label>
            </div>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('description')} *
          </label>
          <input
            type="text"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder={t('enter_transaction_description')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            required
          />
        </div>

        {/* Amount */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('amount')} (TND) *
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
            {t('category')}
          </label>
          <input
            type="text"
            list="categories"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder={t('enter_or_select_category')}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          <datalist id="categories">
            {categoryOptions.map(cat => (
              <option key={cat} value={cat}>{t(cat.replace(' ', '_').toLowerCase())}</option>
            ))}
          </datalist>
        </div>

        {/* User Selection (only for expenses) */}
        {formData.type === 'expense' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('related_expense_user')} *
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.relatedEntityId || ''}
                onChange={(e) => {
                  const id = e.target.value;
                  setFormData({ ...formData, relatedEntityId: id, relatedEntityType: id ? 'user' : '' });
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('select_user')}</option>
                {users.filter(user => user.isActive).map(user => (
                  <option key={user._id} value={user._id}>
                    {user.fullName} - {user.email} ({t(user.role)})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Client/User Selection (for income) */}
        {formData.type === 'income' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('related_client_user')}
            </label>
            <div className="relative">
              <Users className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <select
                value={formData.relatedEntityId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === '') {
                    setFormData({ ...formData, relatedEntityId: '', relatedEntityType: '' });
                  } else {
                    // Determine if it's a client or user based on the ID format or a separate mechanism
                    // For now, assume if it's in clients list, it's a client, else a user
                    const isClient = clients.some(client => client._id === value);
                    setFormData({ ...formData, relatedEntityId: value, relatedEntityType: isClient ? 'client' : 'user' });
                  }
                }}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">{t('select_client_or_user_optional')}</option>
                <optgroup label={t('clients')}>
                  {clients.map(client => (
                    <option key={client._id} value={client._id}>
                      {client.fullName} ({t('client')}) - {client.phoneNumber}
                    </option>
                  ))}
                </optgroup>
                <optgroup label={t('users')}>
                  {users.filter(user => user.isActive).map(user => (
                    <option key={user._id} value={user._id}>
                      {user.fullName} ({t('user')}) - {user.email}
                    </option>
                  ))}
                </optgroup>
              </select>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('notes')}
          </label>
          <textarea
            value={formData.notes}
            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
            placeholder={t('additional_notes_optional')}
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
              <span className="ml-2">{t('adding_transaction')}...</span>
            </>
          ) : (
            <>
              <Plus className="h-5 w-5 mr-2" />
              {t(formData.type === 'expense' ? 'add_expense' : 'add_income')}
            </>
          )}
        </button>
      </form>
    </div>
  );
};

export default ExpenseForm;