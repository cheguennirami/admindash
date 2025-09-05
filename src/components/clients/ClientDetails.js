import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Edit } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { clientOps } from '../../services/jsonbin-new';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ClientDetails = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async () => {
    try {
      console.log('ClientDetails: Fetching client with ID:', id);
      const clients = await clientOps.getClients();
      console.log('ClientDetails: All clients fetched:', clients.length);
      console.log('ClientDetails: Full clients array:', clients); // Log the full array
      console.log('ClientDetails: ID from useParams:', id, 'Type:', typeof id); // Log ID and its type
      const foundClient = clients.find(c => c._id === id);
      console.log('ClientDetails: Found client:', foundClient);

      if (foundClient) {
        setClient(foundClient);
      } else {
        toast.error(t('client_not_found'));
        navigate('/dashboard/clients');
      }
    } catch (error) {
      console.error('❌ Error fetching client:', error);
      toast.error(t('failed_to_fetch_client_details'));
      navigate('/dashboard/clients');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, t]);

  useEffect(() => {
    fetchClient();
  }, [fetchClient]);

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
        <p className="text-gray-500">{t('client_not_found')}</p>
      </div>
    );
  }

  const canEdit = user?.role === 'marketing' || user?.role === 'super_admin';



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
            <h1 className="text-2xl font-bold text-gray-900">{t('client_details')}</h1>
            <p className="text-gray-600 mt-1">{t('order_id')}: {client.orderId}</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <button
            onClick={() => navigate(`/dashboard/clients/${client._id}/receipt`)}
            className="btn-outline flex items-center"
          >
            View Receipt
          </button>
          {canEdit && (
            <Link
              to={`/dashboard/clients/${client._id}/edit`}
              className="btn-primary flex items-center"
            >
              <Edit className="h-5 w-5 mr-2" />
              {t('edit_client')}
            </Link>
          )}
        </div>
      </div>

      {/* Client Information */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('client_information')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">{t('full_name')}</p>
            <p className="text-base text-gray-900">{client.fullName}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t('phone_number')}</p>
            <p className="text-base text-gray-900">{client.phoneNumber}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">{t('address')}</p>
            <p className="text-base text-gray-900">{client.address}</p>
          </div>
        </div>
      </div>

      {/* Order Details */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-4">{t('order_details')}</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-500">{t('article_amount')}</p>
            <p className="text-base text-gray-900">{client.articleAmount}</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t('buying_price')}</p>
            <p className="text-base text-gray-900">{client.buyingPrice} TND</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t('selling_price')}</p>
            <p className="text-base text-gray-900">{client.sellingPrice} TND</p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-500">{t('cart_information')}</p>
            <p className="text-base text-gray-900">{client.cart || t('no_cart_information')}</p>
          </div>
          <div className="md:col-span-2">
            <p className="text-sm font-medium text-gray-500">{t('description')}</p>
            <p className="text-base text-gray-900">{client.description || t('no_description')}</p>
          </div>
        </div>
      </div>

      {/* Status and Payments */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('status')}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('order_status')}</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                client.status === 'delivered_to_client' ? 'bg-green-100 text-green-800' :
                client.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                'bg-yellow-100 text-yellow-800'
              }`}>
                {t(client.status.replace('_', ' '))}
              </span>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('confirmation_status')}</p>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                client.confirmation === 'confirmed' ? 'bg-green-100 text-green-800' :
                client.confirmation === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {t(client.confirmation)}
              </span>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('payments')}</h2>
          <div className="space-y-3">
            <div>
              <p className="text-sm font-medium text-gray-500">{t('advance_payment')}</p>
              <p className="text-base text-gray-900">
                {client.advanceAmount || (client.sellingPrice * 0.3).toFixed(2)} TND
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  client.advancePaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {client.advancePaid ? t('paid') : t('unpaid')}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">{t('remaining_payment')}</p>
              <p className="text-base text-gray-900">
                {client.remainingAmount || (client.sellingPrice * 0.7).toFixed(2)} TND
                <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
                  client.remainingPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {client.remainingPaid ? t('paid') : t('unpaid')}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Screenshots */}
      {client.screenshots && client.screenshots.length > 0 && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('screenshots')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {client.screenshots.map((screenshot, index) => (
              <div key={index} className="relative w-full h-32 bg-gray-100 rounded-lg overflow-hidden">
                <img
                  src={screenshot.url}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientDetails;
