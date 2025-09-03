import React, { useState, useEffect } from 'react';
import {
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Users,
  Plus,
  Eye,
  BarChart3,
  X
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { clientOps, paymentOps } from '../../services/jsonbin-new';
import StatsCard from '../common/StatsCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const MarketingDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentClients, setRecentClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showStatistics, setShowStatistics] = useState(false);
  const [detailedStats, setDetailedStats] = useState({});

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      console.log('📥 Loading marketing dashboard data from JSONBin...');

      // Get clients data from JSONBin
      const clients = await clientOps.getClients();
      const payments = await paymentOps.getPayments();

      console.log(`✅ Loaded ${clients.length} clients from JSONBin`);

      // Calculate stats
      const totalClients = clients.length;
      const totalRevenue = payments
        .filter(p => p.type === 'income')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const totalProfit = totalRevenue - payments
        .filter(p => p.type === 'expense')
        .reduce((sum, p) => sum + (p.amount || 0), 0);
      const confirmedOrders = clients.filter(c => c.confirmation === 'confirmed').length;

      const statsData = {
        totalClients,
        totalOrders: confirmedOrders,
        revenue: {
          totalRevenue,
          totalProfit,
          totalCost: totalRevenue - totalProfit
        },
        orderStatusBreakdown: [
          { _id: 'in_progress', count: clients.filter(c => c.status === 'in_progress').length },
          { _id: 'confirmed', count: clients.filter(c => c.confirmation === 'confirmed').length },
          { _id: 'bought', count: clients.filter(c => c.status === 'bought').length },
          { _id: 'delivered_to_client', count: clients.filter(c => c.status === 'delivered_to_client').length }
        ].filter(status => status.count > 0),
        monthlyRevenue: [] // Can be enhanced later for real monthly data
      };

      setStats(statsData);

      // Calculate detailed statistics
      const averageOrderValue = totalClients > 0 ?
        clients.filter(c => c.sellingPrice).reduce((sum, c) => sum + (c.sellingPrice || 0), 0) / clients.filter(c => c.sellingPrice).length : 0;

      const paymentStatusStats = {
        fullyPaid: clients.filter(c => c.advancePaid && c.remainingPaid).length,
        partiallyPaid: clients.filter(c => (c.advancePaid || c.remainingPaid)).length,
        unpaid: clients.filter(c => !c.advancePaid && !c.remainingPaid).length,
        advanceOnly: clients.filter(c => c.advancePaid && !c.remainingPaid).length,
        remainingOnly: clients.filter(c => !c.advancePaid && c.remainingPaid).length
      };

      setDetailedStats({
        averageOrderValue,
        conversionRate: totalClients > 0 ? (confirmedOrders / totalClients * 100).toFixed(1) : 0,
        priceRangeBreakdown: {
          low: clients.filter(c => (c.sellingPrice || 0) < 100).length,
          medium: clients.filter(c => (c.sellingPrice || 0) >= 100 && (c.sellingPrice || 0) < 500).length,
          high: clients.filter(c => (c.sellingPrice || 0) >= 500).length
        },
        paymentStatusStats,
        monthlyStats: [] // Can be enhanced with real date-based data
      });

      // Set recent clients (most recent 5)
      setRecentClients(clients
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
      );

      console.log(`✅ Marketing dashboard loaded with ${totalClients} clients`);

    } catch (error) {
      console.error('❌ Error fetching dashboard data:', error);

      // Set default empty data
      setStats({
        totalClients: 0,
        totalOrders: 0,
        revenue: { totalRevenue: 0, totalProfit: 0, totalCost: 0 },
        orderStatusBreakdown: [],
        monthlyRevenue: []
      });
      setRecentClients([]);
      setDetailedStats({});
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

  const totalRevenue = stats?.revenue?.totalRevenue || 0;
  const totalProfit = stats?.revenue?.totalProfit || 0;
  const profitMargin = totalRevenue > 0 ? ((totalProfit / totalRevenue) * 100).toFixed(1) : 0;

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-pink-500 to-teal-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.fullName}! 🎯
            </h1>
            <p className="text-pink-100">
              Ready to boost your sales today? Let's make it happen!
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Clients"
          value={stats?.totalClients || 0}
          subtitle="All time"
          icon={Users}
          color="blue"
          trend={{ value: 12, isPositive: true }}
        />
        
        <StatsCard
          title="Total Revenue"
          value={`${totalRevenue.toLocaleString()} TND`}
          subtitle="This month"
          icon={DollarSign}
          color="green"
          trend={{ value: 18, isPositive: true }}
        />
        
        <StatsCard
          title="Total Profit"
          value={`${totalProfit.toLocaleString()} TND`}
          subtitle={`${profitMargin}% margin`}
          icon={TrendingUp}
          color="purple"
          trend={{ value: 25, isPositive: true }}
        />
        
        <StatsCard
          title="Confirmed Orders"
          value={stats?.totalOrders || 0}
          subtitle="This month"
          icon={ShoppingCart}
          color="pink"
          trend={{ value: 8, isPositive: true }}
        />
      </div>

      {/* Revenue Chart */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Revenue Trend</h3>
          <div className="flex items-center space-x-2">
            <BarChart3 className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">Last 6 months</span>
          </div>
        </div>
        
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={stats?.monthlyRevenue || []}>
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
                formatter={(value, name) => [`${value} TND`, name === 'revenue' ? 'Revenue' : name === 'profit' ? 'Profit' : 'Cost']}
                labelFormatter={(month) => {
                  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return months[month - 1];
                }}
              />
              <Line type="monotone" dataKey="revenue" stroke="#ec4899" strokeWidth={3} />
              <Line type="monotone" dataKey="profit" stroke="#14b8a6" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Clients & Quick Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Clients */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Recent Clients</h3>
            <Link 
              to="/dashboard/clients"
              className="text-sm text-pink-600 hover:text-pink-700 font-medium"
            >
              View all
            </Link>
          </div>
          
          <div className="space-y-3">
            {recentClients.map((client) => (
              <div key={client._id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{client.fullName}</p>
                  <p className="text-xs text-gray-500">Order: {client.orderId}</p>
                  <p className="text-xs text-purple-600 truncate max-w-xs" title={client.cart || 'No cart info'}>
                    Cart: {client.cart || 'N/A'}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-semibold text-gray-900">{client.sellingPrice} TND</p>
                  <div className="space-y-1">
                    <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      client.confirmation === 'confirmed'
                        ? 'bg-green-100 text-green-800'
                        : client.confirmation === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {client.confirmation}
                    </span>
                    <div className="text-xs">
                      <span className={`inline-flex items-center px-1 py-0.5 rounded text-xs ${
                        client.advancePaid && client.remainingPaid
                          ? 'bg-green-100 text-green-700'
                          : client.advancePaid || client.remainingPaid
                          ? 'bg-yellow-100 text-yellow-700'
                          : 'bg-red-100 text-red-700'
                      }`}>
                        {client.advancePaid && client.remainingPaid
                          ? 'Fully Paid'
                          : client.advancePaid || client.remainingPaid
                          ? 'Partial'
                          : 'Unpaid'
                        }
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link
              to="/dashboard/clients/new"
              className="flex items-center p-4 bg-gradient-to-r from-pink-50 to-teal-50 rounded-lg hover:from-pink-100 hover:to-teal-100 transition-colors group"
            >
              <div className="h-10 w-10 bg-gradient-to-r from-pink-500 to-teal-500 rounded-lg flex items-center justify-center mr-3">
                <Plus className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">Add New Client</p>
                <p className="text-xs text-gray-500">Create a new client order</p>
              </div>
            </Link>
            
            <Link
              to="/dashboard/clients"
              className="flex items-center p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
                <Eye className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">View All Clients</p>
                <p className="text-xs text-gray-500">Manage existing clients</p>
              </div>
            </Link>
            
            <button
              onClick={() => setShowStatistics(true)}
              className="flex items-center w-full p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors group"
            >
              <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">View Statistics</p>
                <p className="text-xs text-gray-500">Detailed analytics</p>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Order Status Overview */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Status Overview</h3>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {stats?.orderStatusBreakdown?.map((status) => (
            <div key={status._id} className="text-center p-4 bg-gray-50 rounded-lg">
              <p className="text-2xl font-bold text-gray-900 mb-1">{status.count}</p>
              <p className="text-sm text-gray-600 capitalize">
                {status._id.replace('_', ' ')}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics Modal */}
      {showStatistics && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Detailed Statistics</h2>
                <button
                  onClick={() => setShowStatistics(false)}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                >
                  <X className="h-6 w-6 text-gray-500" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Average Order Value</h3>
                  <p className="text-3xl font-bold text-purple-600">
                    {detailedStats?.averageOrderValue?.toFixed(2)} TND
                  </p>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Conversion Rate</h3>
                  <p className="text-3xl font-bold text-blue-600">
                    {detailedStats?.conversionRate}%
                  </p>
                  <p className="text-sm text-gray-600">Confirmed vs Total Orders</p>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-teal-50 p-4 rounded-lg">
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Fully Paid Orders</h3>
                  <p className="text-3xl font-bold text-green-600">
                    {detailedStats?.paymentStatusStats?.fullyPaid || 0}
                  </p>
                  <p className="text-sm text-gray-600">Advance + Remaining</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Price Range Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{"Low (< 100 TND)"}</span>
                      <span className="font-semibold">{detailedStats?.priceRangeBreakdown?.low || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Medium (100-500 TND)</span>
                      <span className="font-semibold">{detailedStats?.priceRangeBreakdown?.medium || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">{"High (>= 500 TND)"}</span>
                      <span className="font-semibold">{detailedStats?.priceRangeBreakdown?.high || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-gray-200 rounded-lg p-6">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status Breakdown</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Fully Paid</span>
                      <span className="font-semibold text-green-600">{detailedStats?.paymentStatusStats?.fullyPaid || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Partial Payment</span>
                      <span className="font-semibold text-yellow-600">{detailedStats?.paymentStatusStats?.partiallyPaid || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Unpaid</span>
                      <span className="font-semibold text-red-600">{detailedStats?.paymentStatusStats?.unpaid || 0}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-8 flex justify-end">
                <button
                  onClick={() => setShowStatistics(false)}
                  className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MarketingDashboard;
