import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  CreditCard,
  Plus,
  Eye,
  Calculator
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentOps } from '../../services/jsonbin-new';
import StatsCard from '../common/StatsCard';
import LoadingSpinner from '../common/LoadingSpinner';
import ExpenseForm from '../payments/ExpenseForm';
import { Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, LineChart, Line, Legend } from 'recharts';

const TreasurerDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('📥 Loading treasurer dashboard data from JSONBin...');
      // Get payments data from JSONBin
      const payments = await paymentOps.getPayments();
      console.log(`✅ Loaded ${payments.length} transactions from JSONBin`);

      // Calculate summary stats
      const income = payments.filter(p => p.type === 'income').reduce((sum, p) => sum + (p.amount || 0), 0);
      const expenses = payments.filter(p => p.type === 'expense').reduce((sum, p) => sum + (p.amount || 0), 0);

      // Calculate monthly net profit
      const monthlyNet = payments.reduce((acc, payment) => {
        const date = new Date(payment.createdAt);
        const month = date.getMonth() + 1;
        const year = date.getFullYear();
        const key = `${year}-${month}`;
        if (!acc[key]) acc[key] = { _id: { month, year }, net: 0 };
        acc[key].net += payment.type === 'income' ? payment.amount : -payment.amount;
        return acc;
      }, {});
      const monthlyPayments = Object.values(monthlyNet).sort((a, b) => a._id.year * 12 + a._id.month - b._id.year * 12 - b._id.month);

      setStats({
        payments: [
          { _id: 'income', total: income },
          { _id: 'expense', total: expenses },
          { _id: 'profit', total: income - expenses }
        ],
        monthlyPayments
      });

      setPayments(payments.slice(0, 10)); // Show first 10 payments

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);
      // Set default empty data
      setStats({
        payments: [
          { _id: 'income', total: 0 },
          { _id: 'expense', total: 0 }
        ]
      });
      setPayments([]);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getPaymentSummary = () => {
    const summary = { income: 0, expense: 0 };
    stats?.payments?.forEach(payment => {
      summary[payment._id] = payment.total;
    });
    return summary;
  };

  const paymentSummary = getPaymentSummary();
  const netIncome = paymentSummary.income - paymentSummary.expense;

  // Category breakdown pie data
  const categoryData = payments.filter(p => p.type === 'expense').reduce((acc, payment) => {
    const existing = acc.find(item => item.name === payment.category);
    if (existing) {
      existing.value += payment.amount;
    } else {
      acc.push({ name: payment.category, value: payment.amount });
    }
    return acc;
  }, []);

  const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6'];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-green-500 to-blue-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.fullName}! 💰
            </h1>
            <p className="text-green-100">
              Keep track of your finances and maximize profitability.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Income"
          value={`${paymentSummary.income.toLocaleString()} TND`}
          subtitle="This month"
          icon={TrendingUp}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        
        <StatsCard
          title="Total Expenses"
          value={`${paymentSummary.expense.toLocaleString()} TND`}
          subtitle="This month"
          icon={TrendingDown}
          color="red"
        />
        
        <StatsCard
          title="Net Income"
          value={`${netIncome.toLocaleString()} TND`}
          subtitle="Profit/Loss"
          icon={DollarSign}
          color={netIncome >= 0 ? 'green' : 'red'}
          trend={{ value: 23, isPositive: netIncome >= 0 }}
        />
        
        <StatsCard
          title="Transactions"
          value={payments.length}
          subtitle="This month"
          icon={CreditCard}
          color="blue"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Income vs Expenses</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: 'Summary', Income: paymentSummary.income, Expenses: paymentSummary.expense }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toLocaleString()} TND`} />
                <Bar dataKey="Income" fill="#10b981" />
                <Bar dataKey="Expenses" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Category Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  dataKey="value"
                  label
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `${value.toLocaleString()} TND`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Net Profit Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Net Profit Trend</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.monthlyPayments || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id.month"
                tickFormatter={(month) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[month - 1];
                }}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => `${value.toLocaleString()} TND`}
                labelFormatter={(month) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[month - 1];
                }}
              />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
          <Link 
            to="/dashboard/payments"
            className="text-sm text-green-600 hover:text-green-700 font-medium"
          >
            View all transactions
          </Link>
        </div>
        
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Order ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Category
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Amount
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {payments.slice(0, 8).map((payment) => (
                <tr key={payment._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {payment.orderId}
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
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 capitalize">
                    {payment.category.replace('_', ' ')}
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
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {/* Financial Overview Chart - can be moved here if needed */}
        </div>
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <ExpenseForm
              transactionType="both"
              onExpenseAdded={() => {
                console.log('✅ Transaction added, refreshing data...');
                fetchDashboardData();
              }}
            />
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/payments/new"
            className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group"
          >
            <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <Plus className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">Add Transaction</p>
              <p className="text-xs text-gray-500">Record income/expense</p>
            </div>
          </Link>
          
          <Link
            to="/dashboard/payments"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View All Payments</p>
              <p className="text-xs text-gray-500">Manage transactions</p>
            </div>
          </Link>
          
          <button className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group">
            <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Financial Report</p>
              <p className="text-xs text-gray-500">Generate reports</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default TreasurerDashboard;
