import React, { useState, useEffect } from 'react';
import {
  Truck,
  MessageSquare,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Send,
  Eye,
  RefreshCw,
  DollarSign,
  CreditCard
} from 'lucide-react';
import { orderOps, providerPaymentOps } from '../../services/jsonbin-new';
import ProviderPaymentForm from '../payments/ProviderPaymentForm';
import StatsCard from '../common/StatsCard';
import LoadingSpinner from '../common/LoadingSpinner';
import { PieChart, Pie, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { startOfMonth, format } from 'date-fns';

const LogisticsDashboard = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [communicationForm, setCommunicationForm] = useState({
    message: '',
    location: '',
    notes: ''
  });
  const [statusUpdates, setStatusUpdates] = useState({});
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

      const orderList = await orderOps.getOrders().catch(() => []);
      setOrders(orderList);
      console.log('✅ Loaded orders for logistics:', orderList.length);

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

  const sendCommunication = async (e) => {
    e.preventDefault();
    if (!selectedOrder || !communicationForm.message) return;

    try {
      setError(null);
      await orderOps.addCommunication(selectedOrder._id, {
        message: communicationForm.message,
        location: communicationForm.location,
        notes: communicationForm.notes
      });

      // Reset form
      setCommunicationForm({ message: '', location: '', notes: '' });

      // Reload data
      await loadData();

      console.log('✅ Communication sent to France for order:', selectedOrder._id);
    } catch (err) {
      console.error('❌ Failed to send communication:', err);
      setError('Failed to send communication');
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      setError(null);
      await orderOps.updateOrderStatusFromFrance(orderId, newStatus, statusUpdates[orderId]?.location, statusUpdates[orderId]?.notes);

      // Clear the status update form
      setStatusUpdates({ ...statusUpdates, [orderId]: {} });

      // Reload data
      await loadData();

      console.log('✅ Order status updated:', orderId, newStatus);
    } catch (err) {
      console.error('❌ Failed to update order status:', err);
      setError('Failed to update order status');
    }
  };

  // Provider Payment Handlers
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

  // Prepare data for charts
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
              Manage France communications and track order movements.
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

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatsCard
          title="Total Orders"
          value={orders.length}
          subtitle="From France"
          icon={Truck}
          color="blue"
        />

        <StatsCard
          title="In Progress"
          value={statusBreakdown.in_progress || 0}
          subtitle="Being processed"
          icon={Clock}
          color="yellow"
        />

        <StatsCard
          title="Delivered"
          value={statusBreakdown.delivered_to_client || 0}
          subtitle="Completed shipments"
          icon={CheckCircle}
          color="green"
        />

        <StatsCard
          title="Communications"
          value={orders.reduce((sum, order) => sum + (order.communications?.length || 0), 0)}
          subtitle="Total messages"
          icon={MessageSquare}
          color="purple"
        />
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
                        <td className="px-3 py-2 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => setEditingProviderPayment(payment)}
                            className="px-3 py-1 bg-blue-100 text-blue-800 rounded text-xs hover:bg-blue-200"
                          >
                            Edit
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">France Orders</h3>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {orders.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                No orders available from France
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
                  <div className="text-sm text-gray-600">
                    Communications: {order.communications?.length || 0}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Communication Panel */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          {selectedOrder ? (
            <>
              <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                <MessageSquare className="h-5 w-5 text-blue-500 mr-2" />
                Communicate with France
              </h3>

              {/* Selected Order Info */}
              <div className="mb-4 p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-gray-900">{selectedOrder.clientName}</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedOrder.status)}`}>
                    {selectedOrder.status.replace('_', ' ')}
                  </span>
                </div>
                <div className="text-sm text-gray-600">
                  Order: {selectedOrder.orderId || selectedOrder._id}
                </div>
              </div>

              {/* Communication Form */}
              <form onSubmit={sendCommunication} className="mb-4">
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Message *
                    </label>
                    <textarea
                      value={communicationForm.message}
                      onChange={(e) => setCommunicationForm({ ...communicationForm, message: e.target.value })}
                      placeholder="Enter your message to France logistics..."
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Location
                      </label>
                      <input
                        type="text"
                        value={communicationForm.location}
                        onChange={(e) => setCommunicationForm({ ...communicationForm, location: e.target.value })}
                        placeholder="e.g., Paris Warehouse"
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <input
                        type="text"
                        value={communicationForm.notes}
                        onChange={(e) => setCommunicationForm({ ...communicationForm, notes: e.target.value })}
                        placeholder="Additional notes..."
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-2 px-4 rounded-lg font-medium hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 flex items-center justify-center"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    Send to France Logistics
                  </button>
                </div>
              </form>

              {/* Status Update */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3">Update Order Status</h4>
                <div className="grid grid-cols-2 gap-2 mb-3">
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'bought')}
                    className="px-3 py-2 bg-blue-100 text-blue-800 rounded-lg text-sm font-medium hover:bg-blue-200"
                  >
                    Mark as Bought
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'in_progress')}
                    className="px-3 py-2 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium hover:bg-yellow-200"
                  >
                    In Progress
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'delivered_to_client')}
                    className="px-3 py-2 bg-green-100 text-green-800 rounded-lg text-sm font-medium hover:bg-green-200"
                  >
                    Delivered
                  </button>
                  <button
                    onClick={() => updateOrderStatus(selectedOrder._id, 'cancelled')}
                    className="px-3 py-2 bg-red-100 text-red-800 rounded-lg text-sm font-medium hover:bg-red-200"
                  >
                    Cancelled
                  </button>
                </div>
              </div>

              {/* Communications History */}
              <div className="border-t pt-4">
                <h4 className="font-medium text-gray-900 mb-3 flex items-center">
                  <Eye className="h-4 w-4 mr-2" />
                  Communication History ({selectedOrder.communications?.length || 0})
                </h4>
                <div className="max-h-48 overflow-y-auto space-y-2">
                  {selectedOrder.communications?.length > 0 ? (
                    selectedOrder.communications.map((comm, index) => (
                      <div key={comm._id || index} className="p-2 bg-gray-50 rounded border">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-medium text-blue-600">{comm.from || 'France'}</span>
                          <span className="text-xs text-gray-500">
                            {new Date(comm.timestamp).toLocaleString()}
                          </span>
                        </div>
                        <p className="text-sm text-gray-800">{comm.message}</p>
                        {comm.location && (
                          <div className="flex items-center mt-1">
                            <MapPin className="h-3 w-3 text-gray-400 mr-1" />
                            <span className="text-xs text-gray-500">{comm.location}</span>
                          </div>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="text-xs text-gray-500 text-center py-4">
                      No communications yet
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : (
            <div className="text-center text-gray-500 py-8">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>Select an order to communicate with France</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default LogisticsDashboard;
