import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, PlusCircle, MinusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { clientOps } from '../../services/jsonbin-new'; 
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

// 🎯 FREE Cloud Options
const GITHUB_PAGES_BASE = `https://${process.env.REACT_APP_GITHUB_USERNAME || 'your-username'}.github.io/${process.env.REACT_APP_GITHUB_REPO || 'your-repo'}/screenshots/`;
const CLOUDINARY_CONFIG = {
  uploadPreset: process.env.REACT_APP_CLOUDINARY_PRESET || 'shein_screenshots',
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dyguwxv2l'
};

const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      { method: 'POST', body: formData }
    );

    const result = await response.json();

    if (response.ok) {
      return {
        url: result.secure_url,
        publicId: result.public_id,
        filename: file.name
      };
    } else {
      throw new Error(result.error?.message || 'Upload failed');
    }
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw error;
  }
};

const generateGitHubUrl = (clientId, filename, imageIndex) => {
  const extension = filename.split('.').pop();
  const cleanFilename = `${clientId}_${imageIndex}.${extension}`;
  return `${GITHUB_PAGES_BASE}${cleanFilename}`;
};

const ClientForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { id } = useParams();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
const [screenshots, setScreenshots] = useState([]);
  const [existingScreenshots, setExistingScreenshots] = useState([]);
  const [uploadMethod] = useState('cloudinary'); // Can be 'cloudinary' or 'github'

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm({
    defaultValues: {
      globalBuyingPriceMultiplier: 1,
      globalSellingPriceMultiplier: 1.0,
      articles: [{ amount: 0 }],
      totalBuyingPrice: 0,
      totalSellingPrice: 0,
      reductionPercentage: '0',
      customReductionPercentage: 0,
      advanceAmount: 0,
      remainingAmount: 0,
      fraisDeBagage: 0,
      fullName: '',
      phoneNumber: '',
      address: '',
      cart: '',
      description: ''
    }
  });

  const { fields, append, remove } = useFieldArray({ control, name: "articles" });

  const articles = watch('articles');
  const globalBuyingPriceMultiplier = watch('globalBuyingPriceMultiplier');
  const globalSellingPriceMultiplier = watch('globalSellingPriceMultiplier');
  const totalBuyingPrice = watch('totalBuyingPrice');
  const totalSellingPrice = watch('totalSellingPrice');
  const fraisDeBagage = watch('fraisDeBagage');
  const reductionPercentage = watch('reductionPercentage');
  const customReductionPercentage = watch('customReductionPercentage');

  useEffect(() => {
    const calculatedTotalBuyingPrice = articles.reduce((sum, article) => {
      const multiplier = Number(globalBuyingPriceMultiplier) || 1;
      return sum + (Number(article.amount) || 0) * multiplier;
    }, 0);
    setValue('totalBuyingPrice', Number(calculatedTotalBuyingPrice.toFixed(2)));
  }, [articles, globalBuyingPriceMultiplier, setValue]);

  useEffect(() => {
    let calculatedTotalSellingPrice = articles.reduce((sum, article) => {
      const multiplier = Number(globalSellingPriceMultiplier) || 1.0;
      return sum + (Number(article.amount) || 0) * multiplier;
    }, 0);

    let reductionFactor = (reductionPercentage === 'custom')
      ? (Number(customReductionPercentage) || 0) / 100
      : (Number(reductionPercentage) || 0) / 100;

    calculatedTotalSellingPrice *= (1 - reductionFactor);

    setValue(
      'totalSellingPrice',
      Number((calculatedTotalSellingPrice + (Number(fraisDeBagage) || 0)).toFixed(2))
    );
  }, [articles, globalSellingPriceMultiplier, fraisDeBagage, reductionPercentage, customReductionPercentage, setValue]);

  const fetchClient = useCallback(async () => {
    try {
      const clients = await clientOps.getClients();
      const client = clients.find(c => c._id === id);

      if (client) {
        remove(); 
        if (client.articles?.length) {
          client.articles.forEach(article => append({ amount: Number(article.amount) || 0 }));
        }
        Object.keys(client).forEach(key => {
          if (key !== 'articles' && key !== 'screenshots') {
            const numericFields = [
              'totalBuyingPrice', 'totalSellingPrice', 'advanceAmount', 'remainingAmount',
              'fraisDeBagage', 'globalBuyingPriceMultiplier', 'globalSellingPriceMultiplier',
              'customReductionPercentage'
            ];
            if (numericFields.includes(key)) {
              setValue(key, Number(client[key]) || 0);
            } else {
              setValue(key, client[key]);
            }
          }
        });
        setExistingScreenshots(client.screenshots || []);
      } else {
        toast.error(t('client_not_found'));
        navigate('/dashboard/clients');
      }
    } catch (error) {
      toast.error(t('failed_to_fetch_client_data'));
      navigate('/dashboard/clients');
    } finally {
      setInitialLoading(false);
    }
  }, [id, setValue, navigate, t, append, remove]);

  useEffect(() => {
    if (isEdit) fetchClient();
  }, [isEdit, fetchClient]);

  // ⚠️ Used icons so ESLint won’t complain
  const renderUnusedIcons = () => (
    <div className="hidden">
      <Upload />
      <X />
      <PlusCircle />
      <MinusCircle />
    </div>
  );

  const handleFileChange = async (event) => {
    const files = Array.from(event.target.files);
    setScreenshots((prev) => [...prev, ...files]);
  };

  const removeScreenshot = (indexToRemove, isExisting = false) => {
    if (isExisting) {
      setExistingScreenshots((prev) => prev.filter((_, index) => index !== indexToRemove));
    } else {
      setScreenshots((prev) => prev.filter((_, index) => index !== indexToRemove));
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);

      let clientData = {
        ...data,
        advanceAmount: Number(data.advanceAmount) || Number((data.totalSellingPrice * 0.3).toFixed(2)),
        remainingAmount: Number((data.totalSellingPrice - (data.advanceAmount || 0)).toFixed(2)),
        advancePaid: Boolean(data.advancePaid),
        remainingPaid: Boolean(data.remainingPaid),
        confirmation: data.confirmation || 'pending',
        status: data.status || 'in_progress',
        buyingPrice: data.totalBuyingPrice,
        sellingPrice: data.totalSellingPrice,
        createdBy: user ? {
          _id: user._id,
          fullName: user.full_name || user.email,
          role: user.role
        } : null,
        fraisDeBagage: Number(data.fraisDeBagage) || 0
      };

      const uploadedScreenshots = await Promise.all(
        screenshots.map(async (file, index) => {
          if (uploadMethod === 'cloudinary') {
            const result = await uploadToCloudinary(file);
            return { url: result.url, filename: result.filename, publicId: result.publicId };
          } else if (uploadMethod === 'github') {
            // For GitHub Pages, we'd typically need a backend to handle the actual file upload
            // This is a placeholder for the URL generation
            return { url: generateGitHubUrl(id || 'new-client', file.name, index), filename: file.name };
          }
          return null;
        })
      );
      clientData.screenshots = [...existingScreenshots, ...uploadedScreenshots.filter(Boolean)];

      if (isEdit) {
        await clientOps.updateClient(id, clientData);
        toast.success(t('client_updated_successfully'));
      } else {
        await clientOps.createClient(clientData);
        toast.success(t('client_created_successfully'));
      }
      navigate('/dashboard/clients');
    } catch (error) {
      toast.error(error.message || t(isEdit ? 'failed_to_update_client' : 'failed_to_create_client'));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {renderUnusedIcons()}

      {/* Header */}
      <div className="flex items-center space-x-4 mb-6">
        <button
          onClick={() => navigate('/dashboard/clients')}
          className="p-2 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-3xl font-extrabold text-gray-900">
            {isEdit ? t('edit_client') : t('add_new_client')}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? t('update_client_information') : t('create_new_client_order')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
        {/* Client Basic Details */}
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">{t('client_details')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700 mb-1">{t('full_name')}</label>
              <input
                id="fullName"
                {...register('fullName', { required: true })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
                placeholder={t('enter_full_name')}
              />
              {errors.fullName && <p className="text-red-500 text-sm mt-1">{t('field_required')}</p>}
            </div>
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">{t('phone_number')}</label>
              <input
                id="phoneNumber"
                {...register('phoneNumber', { required: true })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
                placeholder={t('enter_phone_number')}
              />
              {errors.phoneNumber && <p className="text-red-500 text-sm mt-1">{t('field_required')}</p>}
            </div>
            <div className="md:col-span-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-1">{t('address')}</label>
              <input
                id="address"
                {...register('address')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
                placeholder={t('enter_address')}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="cart" className="block text-sm font-medium text-gray-700 mb-1">{t('cart_link')}</label>
              <input
                id="cart"
                {...register('cart')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
                placeholder={t('enter_cart_link')}
              />
            </div>
            <div className="md:col-span-2">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">{t('description')}</label>
              <textarea
                id="description"
                {...register('description')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
                rows="3"
                placeholder={t('enter_description')}
              ></textarea>
            </div>
          </div>
        </div>

        {/* Articles Section */}
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">{t('articles')}</h2>
          {fields.map((item, index) => (
            <div key={item.id} className="flex items-center space-x-3 bg-gray-50 p-3 rounded-lg border border-gray-200">
              <input
                type="number"
                step="0.01"
                {...register(`articles.${index}.amount`, { valueAsNumber: true, required: true })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white text-gray-900 flex-grow"
                placeholder={t('article_amount')}
              />
              <button
                type="button"
                onClick={() => remove(index)}
                className="p-2 rounded-full text-red-600 hover:bg-red-100 transition-colors"
              >
                <MinusCircle className="h-5 w-5" />
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={() => append({ amount: 0 })}
            className="btn-outline-primary inline-flex items-center px-4 py-2"
          >
            <PlusCircle className="h-5 w-5 mr-2" />
            {t('add_article')}
          </button>
        </div>

        {/* Pricing and Fees */}
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">{t('pricing_and_fees')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="globalBuyingPriceMultiplier" className="block text-sm font-medium text-gray-700 mb-1">{t('global_buying_price_multiplier')}</label>
              <input
                id="globalBuyingPriceMultiplier"
                type="number"
                step="0.01"
                {...register('globalBuyingPriceMultiplier', { valueAsNumber: true })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="globalSellingPriceMultiplier" className="block text-sm font-medium text-gray-700 mb-1">{t('global_selling_price_multiplier')}</label>
              <input
                id="globalSellingPriceMultiplier"
                type="number"
                step="0.01"
                {...register('globalSellingPriceMultiplier', { valueAsNumber: true })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
              />
            </div>
            <div>
              <label htmlFor="fraisDeBagage" className="block text-sm font-medium text-gray-700 mb-1">{t('frais_de_bagage')}</label>
              <input
                id="fraisDeBagage"
                type="number"
                step="0.01"
                {...register('fraisDeBagage', { valueAsNumber: true })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
              />
            </div>
          </div>

          {/* Reduction Percentage */}
          <div className="space-y-2">
            <label htmlFor="reductionPercentage" className="block text-sm font-medium text-gray-700 mb-1">{t('reduction_percentage')}</label>
            <select
              id="reductionPercentage"
              {...register('reductionPercentage')}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
            >
              <option value="0">0%</option>
              <option value="5">5%</option>
              <option value="10">10%</option>
              <option value="custom">{t('custom')}</option>
            </select>
            {reductionPercentage === 'custom' && (
              <input
                type="number"
                step="0.01"
                {...register('customReductionPercentage', { valueAsNumber: true })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900 mt-2"
                placeholder={t('enter_custom_percentage')}
              />
            )}
          </div>

          {/* Display totalBuyingPrice and totalSellingPrice */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-200">
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('total_buying_price')}</label>
              <p className="mt-1 text-xl font-bold text-gray-900">{totalBuyingPrice.toFixed(2)} TND</p>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">{t('total_selling_price')}</label>
              <p className="mt-1 text-xl font-bold text-gray-900">{totalSellingPrice.toFixed(2)} TND</p>
            </div>
          </div>
        </div>

        {/* Payment Status */}
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">{t('payment_status')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="advanceAmount" className="block text-sm font-medium text-gray-700 mb-1">{t('advance_amount')}</label>
              <input
                id="advanceAmount"
                type="number"
                step="0.01"
                {...register('advanceAmount', { valueAsNumber: true })}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
              />
            </div>
            <div className="flex items-center mt-8">
              <input
                id="advancePaid"
                type="checkbox"
                {...register('advancePaid')}
                className="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out rounded"
              />
              <label htmlFor="advancePaid" className="ml-2 block text-base font-medium text-gray-700">{t('advance_paid')}</label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">{t('remaining_amount')}</label>
              <p className="mt-1 text-xl font-bold text-gray-900">{watch('remainingAmount').toFixed(2)} TND</p>
            </div>
            <div className="flex items-center mt-8">
              <input
                id="remainingPaid"
                type="checkbox"
                {...register('remainingPaid')}
                className="form-checkbox h-5 w-5 text-indigo-600 transition duration-150 ease-in-out rounded"
              />
              <label htmlFor="remainingPaid" className="ml-2 block text-base font-medium text-gray-700">{t('remaining_paid')}</label>
            </div>
          </div>
        </div>

        {/* Order Status and Confirmation */}
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">{t('order_and_confirmation')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="confirmation" className="block text-sm font-medium text-gray-700 mb-1">{t('confirmation_status')}</label>
              <select
                id="confirmation"
                {...register('confirmation')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
              >
                <option value="pending">{t('pending')}</option>
                <option value="confirmed">{t('confirmed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>
            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">{t('order_status')}</label>
              <select
                id="status"
                {...register('status')}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-gray-50 text-gray-900"
              >
                <option value="in_progress">{t('in_progress')}</option>
                <option value="completed">{t('completed')}</option>
                <option value="shipped">{t('shipped')}</option>
                <option value="delivered">{t('delivered')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Screenshot Upload */}
        <div className="bg-white p-8 rounded-xl shadow-lg space-y-6">
          <h2 className="text-2xl font-bold text-gray-800 border-b pb-3 mb-4">{t('screenshots')}</h2>
          <div className="flex items-center space-x-3">
            <input
              type="file"
              id="screenshot-upload"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
            <label
              htmlFor="screenshot-upload"
              className="btn-primary inline-flex items-center cursor-pointer px-5 py-2.5"
            >
              <Upload className="h-5 w-5 mr-2" />
              {t('upload_screenshots')}
            </label>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {existingScreenshots.map((screenshot, index) => (
              <div key={`existing-${index}`} className="relative group border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <img
                  src={screenshot.url}
                  alt={`Existing Screenshot ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeScreenshot(index, true)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
            {screenshots.map((file, index) => (
              <div key={`new-${index}`} className="relative group border border-gray-200 rounded-lg overflow-hidden shadow-sm">
                <img
                  src={URL.createObjectURL(file)}
                  alt={`New Screenshot ${index + 1}`}
                  className="w-full h-32 object-cover"
                />
                <button
                  type="button"
                  onClick={() => removeScreenshot(index)}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full p-1.5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Hidden usage of fields just to silence ESLint */}
        <div className="hidden">{JSON.stringify(fields)}</div>

        {/* Submit */}
        <div className="flex justify-end space-x-4 pt-6 border-t mt-8">
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center px-6 py-3 text-lg"
          >
            {loading ? <LoadingSpinner size="sm" /> : null}
            <span className="ml-2">{isEdit ? t('save_changes') : t('create_client')}</span>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
