import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import {
  Plus,
  Search,
  Edit,
  Trash2,
  Eye,
  Download
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook
import { clientOps } from '../../services/jsonbin-new'; // Import JSONBin client operations
import LoadingSpinner from '../common/LoadingSpinner';
import ClientForm from './ClientForm';
import ClientDetails from './ClientDetails';
import ClientReceipt from './ClientReceipt';
import toast from 'react-hot-toast';

const ClientList = () => {
  const { user } = useAuth(); // Use useAuth hook to get user
  const navigate = useNavigate();
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [confirmationFilter, setConfirmationFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchClients = useCallback(async () => {
    try {
      setLoading(true);
      console.log('📥 Fetching clients from JSONBin...');

      // Get all clients from JSONBin
      let allClients = await clientOps.getClients();
      console.log(`✅ Fetched ${allClients.length} clients from JSONBin`);

      // Apply search filter
      if (searchTerm) {
        allClients = allClients.filter(client =>
          client.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          client.phoneNumber.includes(searchTerm)
        );
        console.log(`🔍 Filtered clients by search term:`, allClients.length);
      }

      // Apply status filter
      if (statusFilter) {
        allClients = allClients.filter(client => client.status === statusFilter);
        console.log(`🎯 Filtered clients by status:`, allClients.length);
      }

      // Apply confirmation filter
      if (confirmationFilter) {
        allClients = allClients.filter(client => client.confirmation === confirmationFilter);
        console.log(`✅ Filtered clients by confirmation:`, allClients.length);
      }

      // Apply pagination
      const startIndex = (currentPage - 1) * 10;
      const endIndex = startIndex + 10;
      const paginatedClients = allClients.slice(startIndex, endIndex);

      const currentTotalBuyingPrice = allClients.reduce((sum, client) => sum + parseFloat(client.buyingPrice || 0), 0);
      const currentTotalSellingPrice = allClients.reduce((sum, client) => sum + parseFloat(client.sellingPrice || 0), 0);

      setClients(paginatedClients);
      setTotalPages(Math.ceil(allClients.length / 10));
      setTotalBuyingPrice(currentTotalBuyingPrice);
      setTotalSellingPrice(currentTotalSellingPrice);

      console.log(`📄 Showing page ${currentPage} with ${paginatedClients.length} clients`);
    } catch (error) {
      console.error('❌ Error fetching clients:', error);
      toast.error('Failed to fetch clients');
    } finally {
      setLoading(false);
    }
  }, [currentPage, searchTerm, statusFilter, confirmationFilter]);

  const [totalBuyingPrice, setTotalBuyingPrice] = useState(0);
  const [totalSellingPrice, setTotalSellingPrice] = useState(0);

  useEffect(() => {
    fetchClients();
  }, [fetchClients]);

  const handleDelete = async (clientId) => {
    if (!window.confirm('Are you sure you want to delete this client?')) {
      return;
    }

    try {
      console.log('🗑️ Deleting client:', clientId);
      await clientOps.deleteClient(clientId);
      toast.success('Client deleted successfully');
      console.log('✅ Client deleted from JSONBin');
      await fetchClients(); // Refresh the list
    } catch (error) {
      console.error('❌ Error deleting client:', error);
      toast.error('Failed to delete client');
    }
  };

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

  const getConfirmationColor = (confirmation) => {
    switch (confirmation) {
      case 'confirmed':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'cancelled':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const canEdit = user?.role === 'marketing' || user?.role === 'super_admin';
  const canDelete = user?.role === 'marketing' || user?.role === 'super_admin';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Client Management</h1>
          <p className="text-gray-600 mt-1">Manage your clients and orders</p>
        </div>
        {canEdit && (
          <Link
            to="/dashboard/clients/new"
            className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 bg-gradient-to-r from-pink-500 to-teal-500 text-white font-medium rounded-lg hover:from-pink-600 hover:to-teal-600 transition-colors"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add New Client
          </Link>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="text"
              placeholder="Search clients..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 form-input"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Statuses</option>
            <option value="in_progress">In Progress</option>
            <option value="bought">Bought</option>
            <option value="delivered_to_france">Delivered to France</option>
            <option value="delivered_to_tunisia">Delivered to Tunisia</option>
            <option value="delivered_to_client">Delivered to Client</option>
          </select>

          {/* Confirmation Filter */}
          <select
            value={confirmationFilter}
            onChange={(e) => setConfirmationFilter(e.target.value)}
            className="form-input"
          >
            <option value="">All Confirmations</option>
            <option value="pending">Pending</option>
            <option value="confirmed">Confirmed</option>
            <option value="cancelled">Cancelled</option>
          </select>

          {/* Export Button */}
          <button className="btn-outline flex items-center justify-center">
            <Download className="h-5 w-5 mr-2" />
            Export
          </button>
        </div>
      </div>

      {/* Client Table */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <LoadingSpinner size="lg" />
          </div>
        ) : (
          <>
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
                      Contact
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Prices
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cart
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Advance (30%)
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Payment Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Confirmation
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {clients.map((client) => (
                    <tr key={client._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{client.orderId}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">{client.fullName}</div>
                          <div className="text-sm text-gray-500 truncate max-w-xs">{client.address}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{client.phoneNumber}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div>Buy: {client.buyingPrice} TND</div>
                          <div className="font-medium">Sell: {client.sellingPrice} TND</div>
                          <div className="text-xs text-green-600">Profit: {(client.sellingPrice - client.buyingPrice).toFixed(2)} TND</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div className="truncate max-w-xs" title={client.cart || 'No cart information'}>
                          {client.cart || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <div>
                          <div className="font-medium text-blue-600">{client.advanceAmount || (client.sellingPrice * 0.3).toFixed(2)} TND</div>
                          <div className="text-xs text-gray-500">Remaining: {client.remainingAmount || (client.sellingPrice * 0.7).toFixed(2)} TND</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="space-y-1">
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              client.advancePaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              Advance: {client.advancePaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                          <div className="flex items-center">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              client.remainingPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                            }`}>
                              Remaining: {client.remainingPaid ? 'Paid' : 'Unpaid'}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(client.status)}`}>
                          {client.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getConfirmationColor(client.confirmation)}`}>
                          {client.confirmation}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => navigate(`/dashboard/clients/${client._id}`)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {canEdit && (
                            <button
                              onClick={() => navigate(`/dashboard/clients/${client._id}/edit`)}
                              className="text-yellow-600 hover:text-yellow-900"
                            >
                              <Edit className="h-4 w-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              onClick={() => handleDelete(client._id)}
                              className="text-red-600 hover:text-red-900"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-gray-100 font-bold">
                    <td className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider" colSpan="3">Totals (Current View)</td>
                    <td className="px-6 py-3 text-left text-xs font-medium text-gray-700 uppercase tracking-wider">
                      <div>Buy: {totalBuyingPrice.toFixed(2)} TND</div>
                      <div>Sell: {totalSellingPrice.toFixed(2)} TND</div>
                      <div className="text-green-600">Profit: {(totalSellingPrice - totalBuyingPrice).toFixed(2)} TND</div>
                    </td>
                    <td colSpan="6"></td> {/* Span remaining columns */}
                  </tr>
                </tfoot>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
                <div className="flex-1 flex justify-between sm:hidden">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </div>
                <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm text-gray-700">
                      Page <span className="font-medium">{currentPage}</span> of{' '}
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
                              ? 'z-10 bg-pink-50 border-pink-500 text-pink-600'
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
          </>
        )}
      </div>
    </div>
  );
};

const ClientManagement = () => {
  return (
    <Routes>
      <Route path="/" element={<ClientList />} />
      <Route path="/new" element={<ClientForm />} />
      <Route path="/:id" element={<ClientDetails />} />
      <Route path="/:id/edit" element={<ClientForm />} />
      <Route path="/:id/receipt" element={<ClientReceipt />} />
    </Routes>
  );
};

export default ClientManagement;
