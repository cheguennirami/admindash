import React, { useState, useEffect } from 'react';
import {
  Users,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  CheckCircle,
  Clock
} from 'lucide-react';
import { PieChart, Pie, LineChart, Line, ResponsiveContainer, Tooltip, Cell, XAxis, YAxis, CartesianGrid } from 'recharts';
import { startOfMonth, format } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { authOps, clientOps, paymentOps, orderOps } from '../../services/jsonbin-new';
import StatsCard from '../common/StatsCard';
import RecentActivity from '../common/RecentActivity';
import LoadingSpinner from '../common/LoadingSpinner';

const SuperAdminDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      setLoading(true);

      // Load all data from JSONBin
      const [users, clients, payments, orders] = await Promise.all([
        authOps.getUsers().catch(() => []),
        clientOps.getClients().catch(() => []),
        paymentOps.getPayments().catch(() => []),
        orderOps.getOrders().catch(() => [])
      ]);

      console.log('✅ Loaded dashboard data:', {
        users: users.length,
        clients: clients.length,
        payments: payments.length,
        orders: orders.length
      });

      // Calculate stats
      const userStats = {};
      users.forEach(u => {
        if (!userStats[u.role]) userStats[u.role] = { count: 0, active: 0 };
        userStats[u.role].count++;
        if (u.status === 'active') userStats[u.role].active++;
      });

      const orderStats = {};
      orders.forEach(o => {
        if (!orderStats[o.status]) orderStats[o.status] = { count: 0 };
        orderStats[o.status].count++;
      });

      const revenue = {
        totalRevenue: payments.reduce((sum, p) => sum + (p.type === 'income' ? p.amount : 0), 0),
        totalProfit: payments.reduce((sum, p) => {
          if (p.type === 'income') return sum + p.amount;
          if (p.type === 'expense') return sum - p.amount;
          return sum;
        }, 0)
      };

      // Process monthly revenue for chart
      const monthlyRevenue = {};
      payments.forEach(payment => {
        if (payment.type === 'income') {
          const month = format(startOfMonth(new Date(payment.createdAt || Date.now())), 'yyyy-MM');
          monthlyRevenue[month] = (monthlyRevenue[month] || 0) + payment.amount;
        }
      });

      const monthlyRevenueData = Object.entries(monthlyRevenue)
        .map(([month, amount]) => ({ month, revenue: amount }))
        .sort((a, b) => a.month.localeCompare(b.month));

      setStats({
        users: Object.entries(userStats).map(([role, data]) => ({ _id: role, ...data })),
        totalClients: clients.length,
        revenue,
        orderStatusBreakdown: Object.entries(orderStats).map(([status, data]) => ({ _id: status, count: data.count })),
        monthlyRevenueData,
        recentActivity: [
          ...payments.slice(-3).map(p => ({ type: 'payment', description: `${p.type}: ${p.amount} TND`, createdAt: p.createdAt })),
          ...orders.slice(-2).map(o => ({ type: 'order', description: `New order for ${o.clientName}`, createdAt: o.createdAt }))
        ].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 5)
      });

    } catch (err) {
      console.error('❌ Failed to load dashboard data:', err);
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

  const totalUsers = stats?.users?.reduce((sum, user) => sum + user.count, 0) || 0;
  const activeUsers = stats?.users?.reduce((sum, user) => sum + user.active, 0) || 0;
  const totalRevenue = stats?.revenue?.totalRevenue || 0;
  const totalProfit = stats?.revenue?.totalProfit || 0;

  // Prepare chart data
  const userRoleData = stats?.users?.map(user => ({
    name: user._id.replace('_', ' '),
    value: user.count
  })) || [];

  const orderStatusData = stats?.orderStatusBreakdown?.map(status => ({
    name: status._id.replace('_', ' '),
    value: status.count
  })) || [];

  const ORDER_STATUS_COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300'];

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-pink-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.fullName}! 👋
            </h1>
            <p className="text-pink-100">
              Here's what's happening with your business today.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Activity className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Users"
          value={totalUsers}
          subtitle={`${activeUsers} active`}
          icon={Users}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        
        <StatsCard
          title="Total Clients"
          value={stats?.totalClients || 0}
          subtitle="All time"
          icon={ShoppingCart}
          color="green"
          trend={{ value: 8, isPositive: true }}
        />
        
        <StatsCard
          title="Total Revenue"
          value={`${totalRevenue.toLocaleString()} TND`}
          subtitle="This month"
          icon={DollarSign}
          color="yellow"
          trend={{ value: 15, isPositive: true }}
        />
        
        <StatsCard
          title="Total Profit"
          value={`${totalProfit.toLocaleString()} TND`}
          subtitle="This month"
          icon={TrendingUp}
          color="purple"
          trend={{ value: 23, isPositive: true }}
        />
      </div>

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* User Role Distribution Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Role Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={userRoleData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {userRoleData.map((entry, index) => (
                  <Cell key={`user-cell-${index}`} fill={ORDER_STATUS_COLORS[index % ORDER_STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Order Status Breakdown Pie Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Breakdown</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={orderStatusData}
                cx="50%"
                cy="50%"
                outerRadius={80}
                dataKey="value"
                label={({ name, value }) => `${name}: ${value}`}
              >
                {orderStatusData.map((entry, index) => (
                  <Cell key={`order-cell-${index}`} fill={ORDER_STATUS_COLORS[index % ORDER_STATUS_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Revenue Trend Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Revenue Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={stats?.monthlyRevenueData || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="revenue" stroke="#8884d8" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Status Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Order Status */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Overview</h3>
          <div className="space-y-3">
            {stats?.orderStatusBreakdown?.map((status) => (
              <div key={status._id} className="flex items-center justify-between">
                <div className="flex items-center">
                  {status._id === 'delivered_to_client' && <CheckCircle className="h-5 w-5 text-green-500 mr-2" />}
                  {status._id === 'in_progress' && <Clock className="h-5 w-5 text-yellow-500 mr-2" />}
                  {status._id === 'bought' && <AlertCircle className="h-5 w-5 text-blue-500 mr-2" />}
                  <span className="text-sm font-medium text-gray-700 capitalize">
                    {status._id.replace('_', ' ')}
                  </span>
                </div>
                <span className="text-sm font-semibold text-gray-900">{status.count}</span>
              </div>
            ))}
          </div>
        </div>

        {/* User Roles */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">User Roles</h3>
          <div className="space-y-3">
            {stats?.users?.map((userRole) => (
              <div key={userRole._id} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700 capitalize">
                  {userRole._id.replace('_', ' ')}
                </span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm text-gray-500">{userRole.active}/{userRole.count}</span>
                  <span className="text-sm font-semibold text-gray-900">active</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Activity</h3>
        <RecentActivity activities={stats?.recentActivity || []} />
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => window.location.href = '/dashboard/users'} // Navigate to User Management
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Users className="h-6 w-6 text-pink-500 mb-2" />
            <p className="text-sm font-medium text-gray-900">Add New User</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard/clients'} // Navigate to Client Management
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <ShoppingCart className="h-6 w-6 text-teal-500 mb-2" />
            <p className="text-sm font-medium text-gray-900">View All Clients</p>
          </button>
          
          <button
            onClick={() => window.location.href = '/dashboard/payments'} // Navigate to Payment Management
            className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <DollarSign className="h-6 w-6 text-yellow-500 mb-2" />
            <p className="text-sm font-medium text-gray-900">Financial Reports</p>
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuperAdminDashboard;
