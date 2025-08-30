import React, { useState, useEffect } from 'react';
import { 
  Truck, 
  Package, 
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  Eye
} from 'lucide-react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';
import StatsCard from '../common/StatsCard';
import LoadingSpinner from '../common/LoadingSpinner';

const LogisticsDashboard = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState(null);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const [statsResponse, ordersResponse] = await Promise.all([
        axios.get('/dashboard/stats'),
        axios.get('/orders?limit=10')
      ]);
      
      setStats(statsResponse.data);
      setOrders(ordersResponse.data.orders || []);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId, newStatus) => {
    try {
      await axios.put(`/orders/${orderId}/status`, { status: newStatus });
      // Refresh data
      fetchDashboardData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const getStatusCounts = () => {
    const counts = {
      in_progress: 0,
      bought: 0,
      delivered_to_france: 0,
      delivered_to_tunisia: 0,
      delivered_to_client: 0
    };
    
    stats?.orderStatusBreakdown?.forEach(status => {
      counts[status._id] = status.count;
    });
    
    return counts;
  };

  const statusCounts = getStatusCounts();

  const getStatusIcon = (status) => {
    switch (status) {
      case 'in_progress':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'bought':
        return <Package className="h-5 w-5 text-blue-500" />;
      case 'delivered_to_france':
        return <MapPin className="h-5 w-5 text-purple-500" />;
      case 'delivered_to_tunisia':
        return <Truck className="h-5 w-5 text-orange-500" />;
      case 'delivered_to_client':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'bought':
        return 'bg-blue-100 text-blue-800';
      case 'delivered_to_france':
        return 'bg-purple-100 text-purple-800';
      case 'delivered_to_tunisia':
        return 'bg-orange-100 text-orange-800';
      case 'delivered_to_client':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold mb-2">
              Welcome back, {user?.fullName}! 🚚
            </h1>
            <p className="text-blue-100">
              Track and manage all your deliveries efficiently.
            </p>
          </div>
          <div className="hidden md:block">
            <div className="h-16 w-16 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
              <Truck className="h-8 w-8 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <StatsCard
          title="In Progress"
          value={statusCounts.in_progress}
          subtitle="Orders"
          icon={Clock}
          color="yellow"
        />
        
        <StatsCard
          title="Bought"
          value={statusCounts.bought}
          subtitle="Ready to ship"
          icon={Package}
          color="blue"
        />
        
        <StatsCard
          title="In France"
          value={statusCounts.delivered_to_france}
          subtitle="Transit"
          icon={MapPin}
          color="purple"
        />
        
        <StatsCard
          title="In Tunisia"
          value={statusCounts.delivered_to_tunisia}
          subtitle="Local delivery"
          icon={Truck}
          color="teal"
        />
        
        <StatsCard
          title="Delivered"
          value={statusCounts.delivered_to_client}
          subtitle="Completed"
          icon={CheckCircle}
          color="green"
        />
      </div>

      {/* Order Management */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900">Order Tracking</h3>
          <Link 
            to="/dashboard/orders"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
          >
            View all orders
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
                  Client
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Value
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {orders.slice(0, 8).map((order) => (
                <tr key={order._id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {order.orderId}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900">{order.fullName}</div>
                      <div className="text-sm text-gray-500">{order.phoneNumber}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(order.status)}
                      <span className={`ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {order.sellingPrice} TND
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <select
                      value={order.status}
                      onChange={(e) => updateOrderStatus(order._id, e.target.value)}
                      className="text-sm border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="in_progress">In Progress</option>
                      <option value="bought">Bought</option>
                      <option value="delivered_to_france">Delivered to France</option>
                      <option value="delivered_to_tunisia">Delivered to Tunisia</option>
                      <option value="delivered_to_client">Delivered to Client</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to="/dashboard/orders"
            className="flex items-center p-4 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors group"
          >
            <div className="h-10 w-10 bg-blue-500 rounded-lg flex items-center justify-center mr-3">
              <Eye className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View All Orders</p>
              <p className="text-xs text-gray-500">Manage order status</p>
            </div>
          </Link>
          
          <Link
            to="/dashboard/clients"
            className="flex items-center p-4 bg-purple-50 rounded-lg hover:bg-purple-100 transition-colors group"
          >
            <div className="h-10 w-10 bg-purple-500 rounded-lg flex items-center justify-center mr-3">
              <Package className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-900">View Clients</p>
              <p className="text-xs text-gray-500">Read-only access</p>
            </div>
          </Link>
          
          <button className="flex items-center p-4 bg-green-50 rounded-lg hover:bg-green-100 transition-colors group">
            <div className="h-10 w-10 bg-green-500 rounded-lg flex items-center justify-center mr-3">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">Delivery Report</p>
              <p className="text-xs text-gray-500">Generate reports</p>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default LogisticsDashboard;
