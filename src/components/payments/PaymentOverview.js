import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { paymentOps, clientOps } from '../../services/jsonbin-new';
import LoadingSpinner from '../common/LoadingSpinner';
import ExpenseForm from './ExpenseForm';
import RecentActivity from '../common/RecentActivity';
import { Plus, Eye } from 'lucide-react';

const PaymentOverview = () => {
  const { t } = useTranslation();
  const [payments, setPayments] = useState([]);
  const [recentActivities, setRecentActivities] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchPaymentData = async () => {
    try {
      setLoading(true);
      const [allPayments, allClients] = await Promise.all([
        paymentOps.getPayments(),
        clientOps.getClients()
      ]);

      // Sort payments by createdAt descending for recent transactions
      const sortedPayments = allPayments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setPayments(sortedPayments);

      // For recent activities, we might want to combine client and payment activities
      // For now, let's just use recent clients as activities as per the existing RecentActivity component
      const sortedClients = allClients.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentActivities(sortedClients.slice(0, 5)); // Show 5 recent client activities

    } catch (error) {
      console.error('❌ Error fetching payment overview data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPaymentData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">{t('payments_overview')}</h1>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quick_actions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Link
            to="/dashboard/payments/new"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{t('add_transaction')}</p>
              <p className="text-xs text-gray-500">{t('record_income_expense')}</p>
            </div>
          </Link>
          
          <Link
            to="/dashboard/payments" // This will be the "View all payments" page
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{t('view_all_transactions')}</p>
              <p className="text-xs text-gray-500">{t('manage_transactions')}</p>
            </div>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Transactions Table */}
        <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">{t('recent_transactions')}</h3>
            <Link
              to="/dashboard/payments"
              className="text-sm text-green-600 hover:text-green-700 font-medium"
            >
              {t('view_all_transactions')}
            </Link>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('order_id')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('type')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('category')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('amount')}
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('date')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.slice(0, 8).map((payment) => (
                  <tr key={payment._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {payment.orderId || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        payment.type === 'income'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {t(payment.type)}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                      {t(payment.category?.replace(' ', '_').toLowerCase() || 'uncategorized')}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <span className={payment.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {payment.type === 'income' ? '+' : '-'}{payment.amount.toLocaleString()} TND
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Add Transaction Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ExpenseForm
              transactionType="both"
              onExpenseAdded={() => {
                console.log('✅ Transaction added, refreshing data...');
                fetchPaymentData();
              }}
            />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recent_activities')}</h3>
        <RecentActivity activities={recentActivities} />
      </div>
    </div>
  );
};

export default PaymentOverview;