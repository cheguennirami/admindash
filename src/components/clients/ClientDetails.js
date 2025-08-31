import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit, Phone, MapPin, Calendar, DollarSign } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clientOps } from '../../services/jsonbin-new';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';

const ClientDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async () => {
    try {
      console.log('📥 Fetching client details from JSONBin:', id);
      // Get all clients and find the specific one by ID
      const clients = await clientOps.getClients();
      const foundClient = clients.find(client => client._id === id);

      if (foundClient) {
        setClient(foundClient);
        console.log('✅ Client found in JSONBin:', foundClient.full_name);
      } else {
        console.error('❌ Client not found:', id);
        toast.error('Client not found');
        navigate('/dashboard/clients');
      }
    } catch (error) {
      console.error('❌ Error fetching client:', error);
      toast.error('Failed to fetch client details');
      navigate('/dashboard/clients');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    fetchClient();
  }, [id, fetchClient]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (!client) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Client not found</p>
      </div>
    );
  }

  const canEdit = user?.role === 'marketing' || user?.role === 'super_admin';

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate('/dashboard/clients')}
            className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <ArrowLeft className="h-5 w-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Client Details</h1>
            <p className="text-gray-600 mt-1">Order ID: {client.orderId}</p>
          </div>
        </div>
        
        {canEdit && (
          <Link
            to={`/dashboard/clients/${client._id}/edit`}
            className="btn-primary flex items-center"
          >
            <Edit className="h-5 w-5 mr-2" />
            Edit Client
          </Link>
        )}
      </div>

      {/* Client Information */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Basic Information */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Basic Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Full Name</label>
                <p className="text-gray-900 font-medium">{client.fullName}</p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Phone Number</label>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 text-gray-400 mr-2" />
                  <p className="text-gray-900">{client.phoneNumber}</p>
                </div>
              </div>
              <div className="md:col-span-2">
                <label className="text-sm font-medium text-gray-500">Address</label>
                <div className="flex items-start">
                  <MapPin className="h-4 w-4 text-gray-400 mr-2 mt-1" />
                  <p className="text-gray-900">{client.address}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Order Details */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Details</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-500">Buying Price</label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-gray-900 font-medium">{client.buyingPrice} TND</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Selling Price</label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-gray-400 mr-1" />
                  <p className="text-gray-900 font-medium">{client.sellingPrice} TND</p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Profit</label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-green-500 mr-1" />
                  <p className="text-green-600 font-medium">
                    {(client.sellingPrice - client.buyingPrice).toFixed(2)} TND
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Advance Amount (30%)</label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-blue-500 mr-1" />
                  <p className="text-blue-600 font-medium">
                    {client.advanceAmount || (client.sellingPrice * 0.3).toFixed(2)} TND
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Remaining Amount (70%)</label>
                <div className="flex items-center">
                  <DollarSign className="h-4 w-4 text-orange-500 mr-1" />
                  <p className="text-orange-600 font-medium">
                    {client.remainingAmount || (client.sellingPrice * 0.7).toFixed(2)} TND
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Cart Information</label>
                <p className="text-gray-900">{client.cart}</p>
              </div>
              {client.description && (
                <div className="md:col-span-2">
                  <label className="text-sm font-medium text-gray-500">Description</label>
                  <p className="text-gray-900">{client.description}</p>
                </div>
              )}
            </div>
          </div>

          {/* Screenshots */}
          {client.screenshots && client.screenshots.length > 0 && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Screenshots</h3>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {client.screenshots.map((screenshot, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={screenshot.url}
                      alt={screenshot.filename}
                      className="w-full h-32 object-cover rounded-lg border border-gray-200 cursor-pointer hover:opacity-75 transition-opacity"
                      onClick={() => window.open(screenshot.url, '_blank')}
                    />
                    <div className="absolute bottom-2 left-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                      {screenshot.filename}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Status & Timeline */}
        <div className="space-y-6">
          {/* Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Status</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Order Status</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getStatusColor(client.status)}`}>
                    {client.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Confirmation</label>
                <div className="mt-1">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getConfirmationColor(client.confirmation)}`}>
                    {client.confirmation}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment Status Card */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Status</h3>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-500">Advance Payment</label>
                <div className="mt-1 flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    client.advancePaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {client.advancePaid ? 'Paid' : 'Unpaid'}
                  </span>
                  <span className="text-sm font-medium text-blue-600">
                    {client.advanceAmount || (client.sellingPrice * 0.3).toFixed(2)} TND
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-500">Remaining Payment</label>
                <div className="mt-1 flex items-center justify-between">
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    client.remainingPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {client.remainingPaid ? 'Paid' : 'Unpaid'}
                  </span>
                  <span className="text-sm font-medium text-orange-600">
                    {client.remainingAmount || (client.sellingPrice * 0.7).toFixed(2)} TND
                  </span>
                </div>
              </div>
              <div className="pt-2 border-t border-gray-200">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-500">Total Payment Status</span>
                  <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                    client.advancePaid && client.remainingPaid
                      ? 'bg-green-100 text-green-800'
                      : client.advancePaid || client.remainingPaid
                      ? 'bg-yellow-100 text-yellow-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {client.advancePaid && client.remainingPaid
                      ? 'Fully Paid'
                      : client.advancePaid || client.remainingPaid
                      ? 'Partially Paid'
                      : 'Unpaid'
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Timeline</h3>
            <div className="space-y-3">
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created</p>
                  <p className="text-xs text-gray-500">
                    {new Date(client.createdAt).toLocaleDateString()} at{' '}
                    {new Date(client.createdAt).toLocaleTimeString()}
                  </p>
                </div>
              </div>
              {client.updatedAt !== client.createdAt && (
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900">Last Updated</p>
                    <p className="text-xs text-gray-500">
                      {new Date(client.updatedAt).toLocaleDateString()} at{' '}
                      {new Date(client.updatedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              )}
              <div className="flex items-center">
                <Calendar className="h-4 w-4 text-gray-400 mr-2" />
                <div>
                  <p className="text-sm font-medium text-gray-900">Created By</p>
                  <p className="text-xs text-gray-500">
                    {client.createdBy?.fullName || 'Unknown'}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ClientDetails;
