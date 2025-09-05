import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Download,
  TrendingUp,
  DollarSign,
  CreditCard,
  RefreshCw
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell
} from 'recharts';

const FinancialReports = () => {
  const { t } = useTranslation();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6', '#06b6d4', '#f43f5e'];

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching financial reports data for FinancialReports component...');

      // Ensure paymentOps is imported correctly
      const { paymentOps } = await import('../../services/jsonbin-new');
      console.log('✅ paymentOps imported.');

      // Get all payments data
      const payments = await paymentOps.getPayments();
      console.log(`✅ Fetched ${payments.length} transactions for reports.`);
      console.log('Payments data:', payments);

      // Apply date filtering if custom range specified
      let filteredPayments = payments;
      if (dateRange === 'custom' && customStartDate && customEndDate) {
        const startDate = new Date(customStartDate);
        const endDate = new Date(customEndDate);
        endDate.setHours(23, 59, 59, 999); // Include the entire end date

        filteredPayments = payments.filter(payment => {
          const paymentDate = new Date(payment.createdAt);
          return paymentDate >= startDate && paymentDate <= endDate;
        });
        console.log(`📅 Filtered payments by custom date range: ${filteredPayments.length}`);
      } else {
        // Apply default filtering based on dateRange
        const now = new Date();
        let startDate;

        switch (dateRange) {
          case 'week':
            startDate = new Date(now.setDate(now.getDate() - 7));
            break;
          case 'month':
            startDate = new Date(now.setMonth(now.getMonth() - 1));
            break;
          case 'quarter':
            startDate = new Date(now.setMonth(now.getMonth() - 3));
            break;
          case 'year':
            startDate = new Date(now.setFullYear(now.getFullYear() - 1));
            break;
          default:
            startDate = new Date(0); // Beginning of time
        }

        if (dateRange !== 'custom') {
          filteredPayments = payments.filter(payment =>
            new Date(payment.createdAt) >= startDate
          );
        }
      }

      // Calculate summary statistics
      const incomeData = filteredPayments.filter(p => p.type === 'income');
      const expenseData = filteredPayments.filter(p => p.type === 'expense');

      const totalIncome = incomeData.reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalExpenses = expenseData.reduce((sum, p) => sum + (p.amount || 0), 0);
      const netProfit = totalIncome - totalExpenses;

      // Category breakdown (only expenses for now)
      const categoryBreakdown = expenseData.reduce((acc, payment) => {
        const category = payment.category || 'Uncategorized';
        const existing = acc.find(item => item.name === category);
        if (existing) {
          existing.value += payment.amount || 0;
        } else {
          acc.push({ name: category, value: payment.amount || 0 });
        }
        return acc;
      }, []).sort((a, b) => b.value - a.value); // Sort by amount descending

      // Recent transactions (last 10)
      const recentTransactions = filteredPayments
        .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0))
        .slice(0, 10)
        .map(payment => ({
          ...payment,
          date: payment.createdAt
        }));

      // Calculate monthly trends
      const monthlyTrends = filteredPayments.reduce((acc, payment) => {
        const date = new Date(payment.createdAt);
        const monthYear = `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}`;

        if (!acc[monthYear]) {
          acc[monthYear] = {
            _id: {
              year: date.getFullYear(),
              month: date.getMonth() + 1
            },
            income: 0,
            expenses: 0,
            net: 0
          };
        }

        if (payment.type === 'income') {
          acc[monthYear].income += payment.amount || 0;
        } else {
          acc[monthYear].expenses += payment.amount || 0;
        }
        acc[monthYear].net = acc[monthYear].income - acc[monthYear].expenses;

        return acc;
      }, {});

      const monthlyPayments = Object.values(monthlyTrends)
        .sort((a, b) => `${a._id.year}-${a._id.month}`.localeCompare(`${b._id.year}-${b._id.month}`));

      // Set the calculated data
      setData({
        summary: { totalIncome, totalExpenses, netProfit },
        monthlyTrends: monthlyPayments,
        categoryBreakdown,
        paymentMethods: [], // TODO: Implement payment methods if needed
        clientPayments: [],
        overduePayments: [],
        recentTransactions
      });

      console.log('✅ Financial reports generated successfully.');

    } catch (error) {
      console.error('❌ Error fetching financial reports:', error);
      toast.error(t('failed_to_fetch_financial_reports'));

      // Set fallback empty data
      setData({
        summary: { totalIncome: 0, totalExpenses: 0, netProfit: 0 },
        monthlyTrends: [],
        categoryBreakdown: [],
        paymentMethods: [],
        clientPayments: [],
        overduePayments: [],
        recentTransactions: []
      });
    } finally {
      setLoading(false); // Ensure loading is set to false even on error
      console.log('🔄 Financial reports loading state set to false.');
    }
  }, [dateRange, customStartDate, customEndDate, t, setLoading, setData]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const exportReport = async (format = 'pdf') => {
    try {
      // TODO: Implement actual export functionality
      // For now, just show message
      console.log(`Export format: ${format}, period: ${dateRange}`);
      toast.success(t('export_functionality_coming_soon'));
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error(t('export_failed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with controls */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{t('financial_reports')}</h1>
            <p className="text-gray-600 mt-1">{t('comprehensive_financial_overview')}</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={() => exportReport('pdf')}
              className="btn-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('export_pdf')}
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="btn-outline"
            >
              <Download className="h-4 w-4 mr-2" />
              {t('export_excel')}
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <select
            value={dateRange}
            onChange={(e) => setDateRange(e.target.value)}
            className="form-input"
          >
            <option value="week">{t('last_week')}</option>
            <option value="month">{t('last_month')}</option>
            <option value="quarter">{t('last_quarter')}</option>
            <option value="year">{t('last_year')}</option>
            <option value="custom">{t('custom_range')}</option>
          </select>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="form-input"
                placeholder={t('start_date')}
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="form-input"
                placeholder={t('end_date')}
              />
            </>
          )}

          <button
            onClick={fetchReports}
            className="btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            {t('refresh')}
          </button>
        </div>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('total_income')}</p>
              <p className="text-lg font-bold text-green-600">{data.summary?.totalIncome?.toFixed(2) || '0.00'} TND</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-red-100 rounded-lg">
              <DollarSign className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('total_expenses')}</p>
              <p className="text-lg font-bold text-red-600">{data.summary?.totalExpenses?.toFixed(2) || '0.00'} TND</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="p-3 bg-blue-100 rounded-lg">
              <CreditCard className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">{t('net_profit')}</p>
              <p className={`text-lg font-bold ${data.summary?.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {data.summary?.netProfit?.toFixed(2) || '0.00'} TND
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('monthly_revenue_trends')}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.monthlyTrends}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id.month"
                tickFormatter={(month) => {
                  const months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
                  return months[month - 1];
                }}
              />
              <YAxis />
              <Tooltip formatter={(value) => `${value.toFixed(2)} TND`} />
              <Legend />
              <Line type="monotone" dataKey="income" stroke="#10b981" name={t('income')} />
              <Line type="monotone" dataKey="expenses" stroke="#ef4444" name={t('expenses')} />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" name={t('net_profit')} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('category_breakdown')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data.categoryBreakdown}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {data.categoryBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toFixed(2)} TND`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Methods - Placeholder for now */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('payment_methods')}</h3>
          <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
            <div className="text-center">
              <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-500">{t('payment_methods_chart')}</p>
              <p className="text-sm text-gray-400">{t('implementation_coming_soon')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('recent_transactions')}</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('date')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('description')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('category')}</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{t('amount')}</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {data.recentTransactions && data.recentTransactions.length > 0 ? (
                data.recentTransactions.map((transaction, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(transaction.date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {transaction.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {transaction.category}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold">
                      <span className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}>
                        {transaction.type === 'income' ? '+' : '-'}{transaction.amount?.toFixed(2)} TND
                      </span>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                    {t('no_recent_transactions_available')}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default FinancialReports;