import React, { useState, useEffect, useCallback } from 'react';
import {
  Edit,
  Trash2,
  Download
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { clientOps, orderOps } from '../../services/jsonbin-new'; // Import local services
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const OrderManagement = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [statusCounts, setStatusCounts] = useState({});

  const orderStatuses = [
    'in_progress',
    'bought',
    'delivered_to_france',
    'delivered_to_tunisia',
    'delivered_to_client',
  ];

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError('');
      
      const allOrders = await orderOps.getOrders();
      console.log('All orders fetched:', allOrders);
      const allClients = await clientOps.getClients();
      console.log('All clients fetched:', allClients);
      const clientMap = new Map(allClients.map(client => [client._id, client]));

      const enrichedOrders = allOrders.map(order => {
        const client = clientMap.get(order.clientId);
        return {
          ...order,
          clientName: client ? client.fullName : order.clientName || 'N/A',
          phoneNumber: client ? client.phoneNumber : order.phoneNumber || 'N/A',
        };
      });
      console.log('Enriched orders:', enrichedOrders);

      let filteredOrders = enrichedOrders;
      if (statusFilter) {
        filteredOrders = enrichedOrders.filter(order => order.status === statusFilter);
      }

      if (user?.role === 'logistics') {
        filteredOrders = filteredOrders.filter(order => order.status === 'delivered_to_france');
      }
      console.log('Filtered orders:', filteredOrders);

      const startIndex = (currentPage - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedOrders = filteredOrders.slice(startIndex, endIndex);
      console.log('Paginated orders:', paginatedOrders);

      setOrders(paginatedOrders);
      setTotalPages(Math.ceil(filteredOrders.length / 10));

      const statusCount = filteredOrders.reduce((acc, order) => {
        const status = order.status || 'in_progress';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {});

      setStatusCounts(statusCount);

    } catch (err) {
      const errorMessage = err.message || t('failed_to_fetch_orders');
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [currentPage, statusFilter, t, user?.role]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
      setError('');
      await orderOps.updateOrder(orderId, { status: newStatus });
      toast.success(t('order_status_updated_successfully'));
      fetchOrders();
    } catch (err) {
      const errorMessage = err.message || t('failed_to_update_order_status');
      setError(errorMessage);
      toast.error(errorMessage);
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (!window.confirm(t('confirm_delete_order'))) {
      return;
    }

    try {
      console.log('🗑️ Deleting order:', orderId);
      await orderOps.deleteOrder(orderId); // Use orderOps.deleteOrder
      toast.success(t('order_deleted_successfully'));
      console.log('✅ Order deleted from JSONBin');
      await fetchOrders();
    } catch (error) {
      console.error('❌ Error deleting order:', error);
      toast.error(t('failed_to_delete_order'));
    }
  };

  const handleEditOrder = (orderId) => {
    // Navigate to client edit page (since orders are clients)
    navigate(`/dashboard/clients/${orderId}/edit`);
  };

  const handleExportOrders = async () => {
    try {
      const allOrders = await orderOps.getOrders(); // Fetch actual orders
      const headers = [
        t('order_id'), t('client_name'), t('phone_number'), t('selling_price'), t('buying_price'),
        t('advance_amount'), t('remaining_amount'), t('status'), t('confirmation'), t('created_at')
      ];
      const csvRows = [headers.join(',')];

      allOrders.forEach(order => {
        csvRows.push([
          order.orderId,
          order.clientName,
          order.phoneNumber, // Assuming phoneNumber is part of the order or can be fetched
          order.sellingPrice,
          order.buyingPrice,
          order.advanceAmount, // Assuming these are part of the order
          order.remainingAmount, // Assuming these are part of the order
          order.status,
          order.confirmation,
          new Date(order.createdAt).toLocaleDateString()
        ].map(field => `"${field}"`).join(','));
      });

      const csvString = csvRows.join('\n');
      const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.setAttribute('download', 'orders_export.csv');
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success(t('orders_exported_successfully'));
    } catch (error) {
      console.error('Error exporting orders:', error);
      toast.error(t('failed_to_export_orders'));
    }
  };

  const canEdit = user?.role === 'logistics' || user?.role === 'super_admin';
  const canDelete = user?.role === 'logistics' || user?.role === 'super_admin';

  const getStatusColor = (status) => {
    switch (status) {
      case 'delivered_to_client':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'bought':
        return 'bg-blue-100 text-blue-800';
      case 'delivered_to_france':
        return 'bg-purple-100 text-purple-800';
      case 'delivered_to_tunisia':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">{t('order_management')}</h1>
        <p className="text-gray-600 mb-6">
          {t('track_and_manage_order_status')}
        </p>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {/* Status Filters and Counts */}
        <div className="mb-6 flex items-center justify-between">
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setStatusFilter('')}
              className={`px-4 py-2 rounded-md text-sm font-medium ${
                statusFilter === '' ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
            >
              {t('all_orders')} ({Object.values(statusCounts).reduce((sum, count) => sum + count, 0)})
            </button>
            {orderStatuses.map((status) => (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-4 py-2 rounded-md text-sm font-medium ${
                  statusFilter === status ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t(status.replace('_', ' '))} ({statusCounts[status] || 0})
              </button>
            ))}
          </div>
          <button
            onClick={handleExportOrders}
            className="flex items-center px-4 py-2 rounded-md text-sm font-medium bg-green-600 text-white hover:bg-green-700"
          >
            <Download className="h-4 w-4 mr-2" />
            {t('export_orders')}
          </button>
        </div>

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('order_id')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('client_name')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('phone')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('selling_price')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('status')}
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {t('actions')}
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orders.length === 0 ? (
                  <tr>
                    <td colSpan="6" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      {t('no_orders_found')}
                    </td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.orderId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.clientName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.phoneNumber || 'N/A'} {/* Use order.phoneNumber */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {order.sellingPrice?.toFixed(2) || '0.00'} TND {/* Use order.sellingPrice */}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(order.status)}`}>
                          {t(order.status.replace('_', ' '))}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-4">
                          <div className="min-w-0 flex-1">
                            <select
                              value={order.status}
                              onChange={(e) => handleStatusChange(order._id, e.target.value)}
                              className="block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                            >
                              {orderStatuses.map((status) => (
                                <option key={status} value={status}>
                                  {t(status.replace('_', ' '))}
                                </option>
                              ))}
                            </select>
                          </div>
                          {canEdit && (
                            <button
                              onClick={() => handleEditOrder(order._id)}
                              className="p-1 text-indigo-600 hover:text-indigo-900"
                              title={t('edit_order')}
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDeleteOrder(order._id)}
                              className="p-1 text-red-600 hover:text-red-900"
                              title={t('delete_order')}
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {t('previous')}
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                {t('next')}
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  {t('page')} <span className="font-medium">{currentPage}</span> {t('of')}{' '}
                  <span className="font-medium">{totalPages}</span>
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        page === currentPage
                          ? 'z-10 bg-indigo-50 border-indigo-500 text-indigo-600'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderManagement;
