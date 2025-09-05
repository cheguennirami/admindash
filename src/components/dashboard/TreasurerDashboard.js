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
import RecentActivity from '../common/RecentActivity';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { paymentOps, clientOps } from '../../services/jsonbin-new';
import StatsCard from '../common/StatsCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, PieChart, Pie, LineChart, Line, Legend } from 'recharts';
import { useTranslation } from 'react-i18next';

const TreasurerDashboard = () => {
  const { t } = useTranslation();
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
      // Get payments and client data from JSONBin
      const [payments, clients] = await Promise.all([
        paymentOps.getPayments(),
        clientOps.getClients()
      ]);
      console.log(`✅ Loaded ${payments.length} transactions and ${clients.length} clients from JSONBin`);

      // Calculate summary stats for payments
      const totalIncome = payments.filter(p => p.type === 'income').reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalExpenses = payments.filter(p => p.type === 'expense').reduce((sum, p) => sum + (p.amount || 0), 0);
      const businessAssetsIncome = payments.filter(p => p.type === 'income' && p.category === 'Business Assets').reduce((sum, p) => sum + (p.amount || 0), 0);

      // Calculate client-related stats
      const totalClients = clients.length;
      const totalClientRevenue = clients.reduce((sum, client) => sum + (client.sellingPrice || 0), 0);
      const totalClientProfit = clients.reduce((sum, client) => sum + ((client.sellingPrice || 0) - (client.buyingPrice || 0)), 0);
      const totalClientBuyingPrice = clients.reduce((sum, client) => sum + (client.buyingPrice || 0), 0);

      const confirmedOrders = clients.filter(client => client.confirmation === 'confirmed').length;
      const pendingOrders = clients.filter(client => client.confirmation === 'pending').length;
      const cancelledOrders = clients.filter(client => client.confirmation === 'cancelled').length;

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
          { _id: 'income', total: totalIncome },
          { _id: 'expense', total: totalExpenses },
          { _id: 'profit', total: totalIncome - totalExpenses }
        ],
        monthlyPayments,
        totalClients,
        totalClientRevenue,
        totalClientProfit,
        totalClientBuyingPrice,
        confirmedOrders,
        pendingOrders,
        cancelledOrders,
        businessAssetsIncome
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
    const summary = { income: 0, expense: 0, profit: 0 };
    stats?.payments?.forEach(payment => {
      summary[payment._id] = payment.total;
    });
    return summary;
  };

  const paymentSummary = getPaymentSummary();
  const netIncome = paymentSummary.income - paymentSummary.expense;

  const totalClients = stats?.totalClients || 0;
  const totalClientRevenue = stats?.totalClientRevenue || 0;
  const totalClientProfit = stats?.totalClientProfit || 0;
  const confirmedOrders = stats?.confirmedOrders || 0;
  const pendingOrders = stats?.pendingOrders || 0;
  const cancelledOrders = stats?.cancelledOrders || 0;
  const businessAssetsIncome = stats?.businessAssetsIncome || 0;

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
      <div className="bg-gradient-to-br from-green-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold mb-2">
              {t('welcome_back', { name: user?.fullName })} 💰
            </h1>
            <p className="text-green-100 text-lg">
              {t('financial_dashboard_subtitle')}
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-20 w-20 bg-white bg-opacity-20 rounded-full flex items-center justify-center shadow-inner">
              <DollarSign className="h-10 w-10 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mt-6">
        <StatsCard
          title={t('total_income')}
          value={`${paymentSummary.income.toFixed(2).toLocaleString()} TND`}
          subtitle={t('this_month')}
          icon={TrendingUp}
          color="green"
          trend={{ value: 15, isPositive: true }}
        />
        
        <StatsCard
          title={t('total_expenses')}
          value={`${paymentSummary.expense.toFixed(2).toLocaleString()} TND`}
          subtitle={t('this_month')}
          icon={TrendingDown}
          color="red"
        />
        
        <StatsCard
          title={t('net_income')}
          value={`${netIncome.toFixed(2).toLocaleString()} TND`}
          subtitle={t('profit_loss')}
          icon={DollarSign}
          color={netIncome >= 0 ? 'green' : 'red'}
          trend={{ value: 23, isPositive: netIncome >= 0 }}
        />
        
        <StatsCard
          title={t('transactions')}
          value={payments.length}
          subtitle={t('this_month')}
          icon={CreditCard}
          color="blue"
        />

        <StatsCard
          title={t('total_clients')}
          value={totalClients.toLocaleString()}
          subtitle={t('all_time')}
          icon={DollarSign}
          color="blue"
        />

        <StatsCard
          title={t('total_client_revenue')}
          value={`${parseFloat(totalClientRevenue).toFixed(2).toLocaleString()} TND`}
          subtitle={`${t('from_selling_price')} / ${t('total_selling_price')}`}
          icon={TrendingUp}
          color="purple"
        />

        <StatsCard
          title={t('total_buying_price')}
          value={`${parseFloat(stats?.totalClientBuyingPrice || 0).toFixed(2).toLocaleString()} TND`}
          subtitle={t('from_buying_price')}
          icon={TrendingDown}
          color="orange"
        />

        <StatsCard
          title={t('total_client_profit')}
          value={`${totalClientProfit.toFixed(2).toLocaleString()} TND`}
          subtitle={t('from_client_orders')}
          icon={DollarSign}
          color={totalClientProfit >= 0 ? 'green' : 'red'}
        />

        {totalClientProfit < 0 && (
          <StatsCard
            title={t('client_loss')}
            value={`${Math.abs(totalClientProfit).toFixed(2).toLocaleString()} TND`}
            subtitle={t('from_client_orders')}
            icon={TrendingDown}
            color="red"
          />
        )}

        <StatsCard
          title={t('confirmed_orders')}
          value={confirmedOrders.toLocaleString()}
          subtitle={t('total_confirmed')}
          icon={DollarSign}
          color="green"
        />

        <StatsCard
          title={t('pending_orders')}
          value={pendingOrders.toLocaleString()}
          subtitle={t('total_pending')}
          icon={DollarSign}
          color="yellow"
        />

        <StatsCard
          title={t('cancelled_orders')}
          value={cancelledOrders.toLocaleString()}
          subtitle={t('total_cancelled')}
          icon={DollarSign}
          color="red"
        />

        <StatsCard
          title={t('business_assets')}
          value={`${businessAssetsIncome.toFixed(2).toLocaleString()} TND`}
          subtitle={t('income_category')}
          icon={DollarSign}
          color="blue"
        />
      </div>

      {/* Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        {/* Income vs Expenses Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('income_vs_expenses')}</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={[{ name: t('summary'), Income: paymentSummary.income, Expenses: paymentSummary.expense }]}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip formatter={(value) => `${value.toFixed(2).toLocaleString()} TND`} />
                <Bar dataKey="Income" fill="#10b981" name={t('income')} />
                <Bar dataKey="Expenses" fill="#ef4444" name={t('expenses')} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Payment Category Breakdown */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('payment_category_breakdown')}</h3>
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
                <Tooltip formatter={(value) => `${value.toFixed(2).toLocaleString()} TND`} />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Monthly Net Profit Trend */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('monthly_net_profit_trend')}</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.monthlyPayments || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="_id.month"
                tickFormatter={(month) => {
                  const months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
                  return months[month - 1];
                }}
              />
              <YAxis />
              <Tooltip
                formatter={(value) => `${value.toFixed(2).toLocaleString()} TND`}
                labelFormatter={(month) => {
                  const months = [t('jan'), t('feb'), t('mar'), t('apr'), t('may'), t('jun'), t('jul'), t('aug'), t('sep'), t('oct'), t('nov'), t('dec')];
                  return months[month - 1];
                }}
              />
              <Line type="monotone" dataKey="net" stroke="#3b82f6" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Quick Actions */}
      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mt-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{t('quick_actions')}</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/payments/overview"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">{t('view_payments_overview')}</p>
              <p className="text-xs text-gray-500">{t('manage_transactions_and_activities')}</p>
            </div>
          </Link>
          
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
            to="/dashboard/payments/reports"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <Calculator className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{t('financial_report')}</p>
              <p className="text-xs text-gray-500">{t('generate_reports')}</p>
            </div>
          </Link>
        </div>
      </div>
      <RecentActivity activities={payments} user={user} />
    </div>
  );
};

export default TreasurerDashboard;
