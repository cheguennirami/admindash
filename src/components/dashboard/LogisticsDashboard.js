import React, { useState, useEffect } from 'react';
import {
  Truck,
  RefreshCw,
  CreditCard,
  Clock,
  CheckCircle,
  AlertCircle,
  Eye
} from 'lucide-react';
import { orderOps, providerPaymentOps } from '../../services/jsonbin-new';
import ProviderPaymentForm from '../payments/ProviderPaymentForm';
import StatsCard from '../common/StatsCard';
import LoadingSpinner from '../common/LoadingSpinner';
import OrderStatusForm from '../../components/orders/OrderStatusForm';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfMonth, format } from 'date-fns';

const LogisticsDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [error, setError] = useState(null);
  const [providerPayments, setProviderPayments] = useState([]);
  const [loadingProvider, setLoadingProvider] = useState(false);
  const [editingProviderPayment, setEditingProviderPayment] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setLoadingProvider(true);
      setError(null);

      const orderList = await orderOps.getOrders().catch(() => []);
      
      // Calculate more granular order status counts
      const boughtOrders = orderList.filter(order => order.status === 'bought').length;
      const deliveredToFranceOrders = orderList.filter(order => order.status === 'delivered_to_france').length;
      const deliveredToTunisiaOrders = orderList.filter(order => order.status === 'delivered_to_tunisia').length;
      const deliveredToClientOrders = orderList.filter(order => order.status === 'delivered_to_client').length;
      const inProgressOrders = orderList.filter(order => order.status === 'in_progress').length;

      // Calculate pending logistics tasks
      const pendingToBuy = orderList.filter(order => order.status === 'in_progress').length;
      const pendingToShipToFrance = orderList.filter(order => order.status === 'bought').length;
      const pendingToShipToTunisia = orderList.filter(order => order.status === 'delivered_to_france').length;
      const pendingToDeliverToClient = orderList.filter(order => order.status === 'delivered_to_tunisia').length;

      setOrders(orderList);
      setStats({
        boughtOrders,
        deliveredToFranceOrders,
        deliveredToTunisiaOrders,
        deliveredToClientOrders,
        inProgressOrders,
        pendingToBuy,
        pendingToShipToFrance,
        pendingToShipToTunisia,
        pendingToDeliverToClient,
      });

      const providerPaymentsList = await providerPaymentOps.getProviderPayments().catch(() => []);
      setProviderPayments(providerPaymentsList);
      console.log('✅ Loaded provider payments:', providerPaymentsList.length);
    } catch (err) {
      console.error('❌ Failed to load data:', err);
      setError('Failed to load data');
    } finally {
      setLoading(false);
      setLoadingProvider(false);
    }
  };

  const getStatusColor = (status) => {
    const colors = {
      'in_progress': 'bg-yellow-100 text-yellow-800',
      'bought': 'bg-blue-100 text-blue-800',
      'delivered_to_client': 'bg-green-100 text-green-800',
      'cancelled': 'bg-red-100 text-red-800'
    };
    return colors[status] || 'bg-gray-100 text-gray-800';
  };

  const handlePaymentAdded = async (paymentData) => {
    const mappedData = { ...paymentData, id: paymentData._id };
    delete mappedData._id;

    try {
      setError(null);
      await providerPaymentOps.createProviderPayment(mappedData);
      await loadData();
      console.log('✅ Provider payment added');
    } catch (err) {
      console.error('❌ Failed to add provider payment:', err);
      setError('Failed to add provider payment');
    }
  };

  const handlePaymentUpdated = async (paymentData) => {
    const paymentId = paymentData.id || paymentData._id;
    const mappedData = { ...paymentData };
    delete mappedData._id;
    delete mappedData.id;

    try {
      setError(null);
      await providerPaymentOps.updateProviderPayment(paymentId, mappedData);
      await loadData();
      console.log('✅ Provider payment updated');
    } catch (err) {
      console.error('❌ Failed to update provider payment:', err);
      setError('Failed to update provider payment');
    }
  };

  const handleDeletePayment = async (paymentId) => {
    if (!window.confirm('Are you sure you want to delete this provider payment?')) {
      return;
    }
    try {
      setError(null);
      await providerPaymentOps.deleteProviderPayment(paymentId);
      await loadData();
      console.log('✅ Provider payment deleted');
    } catch (err) {
      console.error('❌ Failed to delete provider payment:', err);
      setError('Failed to delete provider payment');
    }
  };

  const statusBreakdown = orders.reduce((acc, order) => {
    acc[order.status] = (acc[order.status] || 0) + 1;
    return acc;
  }, {});

  const paymentStatusBreakdown = providerPayments.reduce((acc, payment) => {
    acc[payment.status] = (acc[payment.status] || 0) + 1;
    return acc;
  }, {});

  const monthlyOrders = orders.reduce((acc, order) => {
    if (order.createdAt) {
      const month = format(startOfMonth(new Date(order.createdAt)), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + 1;
    } else {
      const month = format(startOfMonth(new Date()), 'yyyy-MM');
      acc[month] = (acc[month] || 0) + 1;
    }
    return acc;
  }, {});

  const orderStatusData = Object.entries(statusBreakdown).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count
  }));

  const paymentStatusData = Object.entries(paymentStatusBreakdown).map(([status, count]) => ({
    name: status.replace('_', ' '),
    value: count
  }));

  const monthlyOrdersData = Object.entries(monthlyOrders).map(([month, count]) => ({
    month,
    orders: count
  })).sort((a, b) => a.month.localeCompare(b.month));

  if (loading || loadingProvider) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Logistics Dashboard 🚚
            </h1>
            <p className="text-blue-100">
              Follow order status and manage logistics.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center">
            <AlertCircle className="h-5 w-5 text-red-500 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {/* Overall Order Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value={orders.length}
          subtitle="All orders"
          icon={Truck}
          color="blue"
        />
        <StatsCard
          title="Orders In Progress"
          value={stats?.inProgressOrders || 0}
          subtitle="Currently being processed"
          icon={Clock}
          color="yellow"
        />
        <StatsCard
          title="Orders Bought"
          value={stats?.boughtOrders || 0}
          subtitle="Purchased from supplier"
          icon={CheckCircle}
          color="blue"
        />
        <StatsCard
          title="Delivered to Client"
          value={stats?.deliveredToClientOrders || 0}
          subtitle="Final delivery completed"
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Detailed Delivery Status Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatsCard
          title="Delivered to France"
          value={stats?.deliveredToFranceOrders || 0}
          subtitle="Arrived in France"
          icon={Truck}
          color="purple"
        />
        <StatsCard
          title="Delivered to Tunisia"
          value={stats?.deliveredToTunisiaOrders || 0}
          subtitle="Arrived in Tunisia"
          icon={Truck}
          color="teal"
        />
        <StatsCard
          title="Total Communications"
          value={orders.reduce((sum, order) => sum + (order.communications?.length || 0), 0)}
          subtitle="All order messages"
          icon={Eye}
          color="orange"
        />
      </div>

      {/* Pending Logistics Tasks */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Pending Logistics Tasks</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Pending to Buy"
            value={stats?.pendingToBuy || 0}
            subtitle="Orders awaiting purchase"
            icon={Clock}
            color="red"
          />
          <StatsCard
            title="Pending Ship to France"
            value={stats?.pendingToShipToFrance || 0}
            subtitle="Bought, awaiting shipment to France"
            icon={Truck}
            color="yellow"
          />
          <StatsCard
            title="Pending Ship to Tunisia"
            value={stats?.pendingToShipToTunisia || 0}
            subtitle="In France, awaiting shipment to Tunisia"
            icon={Truck}
            color="orange"
          />
          <StatsCard
            title="Pending Deliver to Client"
            value={stats?.pendingToDeliverToClient || 0}
            subtitle="In Tunisia, awaiting client delivery"
            icon={Truck}
            color="purple"
          />
        </div>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Order Status Pie Chart */}
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
                  <Cell key={`order-cell-${index}`} fill={['#8884d8', '#82ca9d', '#ffc658', '#ff7300'][index % 4]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Provider Payment Status Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Provider Payment Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={paymentStatusData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#8884d8" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Monthly Order Volume Line Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Order Volume</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyOrdersData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="orders" stroke="#8884d8" />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Provider Payments Section */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
            <CreditCard className="h-5 w-5 text-green-500 mr-2" />
            Provider Payments
          </h3>
          <button
            onClick={loadData}
            className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Payments Summary Table */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">Payment Summary</h4>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {providerPayments.length === 0 ? (
                <div className="text-center text-gray-500 py-8">
                  No provider payments yet
                </div>
              ) : (
                <table className="w-full table-auto">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Provider</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Total</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Paid</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Remaining</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Due Date</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {providerPayments.map((payment) => (
                      <tr key={payment.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {payment.providerName}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {payment.totalAmount} {payment.currency}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {payment.amountPaid} {payment.currency}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-900">
                          {payment.remainingAmount} {payment.currency}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            payment.status === 'paid' ? 'bg-green-100 text-green-800' :
                            payment.status === 'partially_paid' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {payment.status.replace('_', ' ')}
                          </span>
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500">
                          {payment.dueDate ? new Date(payment.dueDate).toLocaleDateString() : '-'}
                        </td>
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium flex space-x-2">
                          <button
                            onClick={() => setEditingProviderPayment(payment)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleDeletePayment(payment.id)}
                            className="px-3 py-1 bg-red-100 text-red-800 rounded text-xs hover:bg-red-200"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Payment Form */}
          <div>
            <h4 className="font-medium text-gray-900 mb-3">
              {editingProviderPayment ? 'Edit Payment' : 'Add New Payment'}
            </h4>
            {editingProviderPayment && (
              <div className="mb-3">
                <button
                  onClick={() => setEditingProviderPayment(null)}
                  className="px-3 py-1 bg-gray-100 text-gray-800 rounded text-xs hover:bg-gray-200"
                >
                  Cancel Edit
                </button>
              </div>
            )}
            <ProviderPaymentForm
              onPaymentAdded={handlePaymentAdded}
              onPaymentUpdated={handlePaymentUpdated}
              initialPayment={editingProviderPayment}
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Orders List */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Orders to Follow</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orders.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No orders available to follow
              </div>
            ) : (
              orders.map((order) => (
                <div
                  key={order._id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedOrder?._id === order._id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setSelectedOrder(order)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{order.clientName || 'Unknown Client'}</h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                      {order.status.replace('_', ' ')}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    Order: {order.orderId || order._id}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Order Status Form */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <OrderStatusForm
            selectedOrder={selectedOrder}
            onStatusUpdated={loadData}
            error={error}
          />
        </div>
      </div>
    </div>
  );
};

export default LogisticsDashboard;
