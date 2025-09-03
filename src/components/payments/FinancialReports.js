import React, { useState, useEffect, useCallback } from 'react';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import {
  Download,
  TrendingUp,
  DollarSign,
  CreditCard,
  FileText,
  RefreshCw
} from 'lucide-react';

const FinancialReports = () => {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({});
  const [dateRange, setDateRange] = useState('month');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  const fetchReports = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching financial reports data from JSONBin...');

      // Import the payment operations
      const { paymentOps } = await import('../../services/jsonbin-new');

      // Get all payments data from JSONBin
      const payments = await paymentOps.getPayments();
      console.log(`✅ Fetched ${payments.length} transactions for reports`);

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

      console.log('✅ Financial reports generated successfully');

    } catch (error) {
      console.error('❌ Error fetching financial reports:', error);
      toast.error('Failed to fetch financial reports');

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
      setLoading(false);
    }
  }, [dateRange, customStartDate, customEndDate]);

  useEffect(() => {
    fetchReports();
  }, [fetchReports]);

  const exportReport = async (format = 'pdf') => {
    try {
      // TODO: Implement actual export functionality
      // For now, just show message
      console.log(`Export format: ${format}, period: ${dateRange}`);
      toast.success('Export functionality coming soon!');
    } catch (error) {
      console.error('Error exporting report:', error);
      toast.error('Export failed');
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
            <h1 className="text-2xl font-bold text-gray-900">Financial Reports</h1>
            <p className="text-gray-600 mt-1">Comprehensive financial overview and analytics</p>
          </div>
          <div className="flex items-center space-x-3 mt-4 lg:mt-0">
            <button
              onClick={() => exportReport('pdf')}
              className="btn-primary"
            >
              <Download className="h-4 w-4 mr-2" />
              Export PDF
            </button>
            <button
              onClick={() => exportReport('excel')}
              className="btn-outline"
            >
              <Download className="h-4 w-4 mr-2" />
              Export Excel
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
            <option value="week">Last Week</option>
            <option value="month">Last Month</option>
            <option value="quarter">Last Quarter</option>
            <option value="year">Last Year</option>
            <option value="custom">Custom Range</option>
          </select>

          {dateRange === 'custom' && (
            <>
              <input
                type="date"
                value={customStartDate}
                onChange={(e) => setCustomStartDate(e.target.value)}
                className="form-input"
                placeholder="Start Date"
              />
              <input
                type="date"
                value={customEndDate}
                onChange={(e) => setCustomEndDate(e.target.value)}
                className="form-input"
                placeholder="End Date"
              />
            </>
          )}

          <button
            onClick={fetchReports}
            className="btn-secondary"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
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
              <p className="text-sm font-medium text-gray-600">Total Income</p>
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
              <p className="text-sm font-medium text-gray-600">Total Expenses</p>
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
              <p className="text-sm font-medium text-gray-600">Net Profit</p>
              <p className={`text-lg font-bold ${data.summary?.netProfit >= 0 ? 'text-blue-600' : 'text-red-600'}`}>
                {data.summary?.netProfit?.toFixed(2) || '0.00'} TND
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends Chart Placeholder */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Revenue Trends</h3>
        <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-gray-400 mx-auto mb-2" />
            <p className="text-gray-500">Monthly revenue trends chart</p>
            <p className="text-sm text-gray-400">(Implementation coming soon)</p>
          </div>
        </div>
      </div>

      {/* Category Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Category Breakdown</h3>
          <div className="space-y-3">
            {data.categoryBreakdown && data.categoryBreakdown.length > 0 ? (
              data.categoryBreakdown.map((category, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{category.name}</span>
                  <span className="text-sm font-bold text-gray-900">{category.value?.toFixed(2)} TND</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <FileText className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No category data available</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
          <div className="space-y-3">
            {data.paymentMethods && data.paymentMethods.length > 0 ? (
              data.paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-600">{method.name}</span>
                  <span className="text-sm font-bold text-gray-900">{method.amount?.toFixed(2)} TND</span>
                </div>
              ))
            ) : (
              <div className="text-center py-8">
                <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-gray-500">No payment method data available</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Transactions</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Description</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
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
                    No recent transactions available
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