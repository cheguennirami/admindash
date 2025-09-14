import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { clientOps } from '../../services/jsonbin-new';
import LoadingSpinner from '../common/LoadingSpinner';
import toast from 'react-hot-toast';
import { useTranslation } from 'react-i18next';

const ClientReceipt = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const [client, setClient] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchClient = useCallback(async () => {
    try {
      const clients = await clientOps.getClients();
      const foundClient = clients.find(c => c._id === id);

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

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 p-6 bg-white rounded-xl shadow-sm border border-gray-200 print:shadow-none print:border-none">
      <div className="flex items-center justify-between print:hidden">
        <button
          onClick={() => navigate(-1)}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <button
          onClick={handlePrint}
          className="btn-primary flex items-center"
        >
          Print
        </button>
      </div>

      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('receipt')}</h1>
        <p className="text-gray-600">{t('order_id')}: {client.orderId}</p>
        <p className="text-gray-600">{t('date')}: {new Date().toLocaleDateString()}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-200 pt-6">
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
        <div>
          <p className="text-sm font-medium text-gray-500">{t('selling_price')}</p>
          <p className="text-base text-gray-900">{client.sellingPrice} TND</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{t('advance_payment')}</p>
          <p className="text-base text-gray-900">
            {client.advanceAmount !== undefined && client.advanceAmount !== null ? client.advanceAmount.toFixed(2) : '0.00'} TND
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
            {client.remainingAmount !== undefined && client.remainingAmount !== null ? client.remainingAmount.toFixed(2) : '0.00'} TND
            <span className={`ml-2 px-2 py-0.5 rounded-full text-xs font-medium ${
              client.remainingPaid ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
              {client.remainingPaid ? t('paid') : t('unpaid')}
            </span>
          </p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{t('order_status')}</p>
          <p className="text-base text-gray-900">{t(client.status.replace('_', ' '))}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{t('confirmation_status')}</p>
          <p className="text-base text-gray-900">{t(client.confirmation)}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-500">{t('cart_information')}</p>
          <p className="text-base text-gray-900">{client.cart || t('no_cart_information')}</p>
        </div>
        <div className="md:col-span-2">
          <p className="text-sm font-medium text-gray-500">{t('description')}</p>
          <p className="text-base text-gray-900">{client.description || t('no_description')}</p>
        </div>
        <div>
          <p className="text-sm font-medium text-gray-500">{t('created_at')}</p>
          <p className="text-base text-gray-900">{new Date(client.createdAt).toLocaleDateString()}</p>
        </div>
        {client.updatedAt !== client.createdAt && (
          <div>
            <p className="text-sm font-medium text-gray-500">{t('last_updated')}</p>
            <p className="text-base text-gray-900">{new Date(client.updatedAt).toLocaleDateString()}</p>
          </div>
        )}
      </div>

      {client.screenshots && client.screenshots.length > 0 && (
        <div className="border-t border-gray-200 pt-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">{t('screenshots')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {client.screenshots.map((screenshot, index) => (
              <div key={index} className="relative w-full bg-gray-100 rounded-lg overflow-hidden print:h-auto print:w-full">
                <img
                  src={screenshot.url}
                  alt={`Screenshot ${index + 1}`}
                  className="w-full h-full object-contain print:object-contain"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ClientReceipt;
