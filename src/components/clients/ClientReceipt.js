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
      const foundClient = clients?.find(c => String(c._id) === String(id));

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
      {/* Header */}
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
          {t('print')}
        </button>
      </div>

      {/* Receipt Info */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('receipt')}</h1>
        <p className="text-gray-600">{t('order_id')}: {client.orderId || 'N/A'}</p>
        <p className="text-gray-600">{t('date')}: {new Date().toLocaleDateString()}</p>
      </div>

      {/* Client Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-gray-
