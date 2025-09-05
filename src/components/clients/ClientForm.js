import React, { useState, useEffect, useCallback } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Save, PlusCircle, MinusCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { clientOps } from '../../services/jsonbin-new'; // Import JSONBin client operations
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from 'react-i18next';

// 🎯 FREE Cloud Options (Choose one)
// Option 1: GitHub Pages (100% Free) - Store images using GitHub's free pages
// Option 2: Imgur API (Free Tier) - Easy image hosting
// Option 3: Cloudinary Free Tier - 25GB storage, 25GB monthly bandwidth

// Cloud Configuration - UPDATE these URLs with your actual cloud accounts
const GITHUB_PAGES_BASE = `https://${process.env.REACT_APP_GITHUB_USERNAME || 'your-username'}.github.io/${process.env.REACT_APP_GITHUB_REPO || 'your-repo'}/screenshots/`;
const CLOUDINARY_CONFIG = {
  uploadPreset: process.env.REACT_APP_CLOUDINARY_PRESET || 'shein_screenshots',
  cloudName: process.env.REACT_APP_CLOUDINARY_CLOUD_NAME || 'dyguwxv2l'
};

// Cloudinary Upload Function (Alternative Option 2)
const uploadToCloudinary = async (file) => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);

  try {
    const response = await fetch(
      `https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`,
      {
        method: 'POST',
        body: formData
      }
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

// GitHub Pages Upload (Alternative Option 1)
// Note: This requires manual upload to your GitHub repo
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
  const [uploadMethod] = useState('cloudinary'); // 'cloudinary' or 'github'

  const { register, handleSubmit, formState: { errors }, setValue, watch, control } = useForm({
   defaultValues: {
     articles: [{ amount: 0, buyingPriceMultiplier: 1, sellingPriceMultiplier: 1.0 }],
     totalBuyingPrice: 0,
     totalSellingPrice: 0
   }
 });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "articles"
  });

  const articles = watch('articles');
  const totalBuyingPrice = watch('totalBuyingPrice');
  const totalSellingPrice = watch('totalSellingPrice');
  const fraisDeBagage = watch('fraisDeBagage'); // Watch fraisDeBagage

  useEffect(() => {
    const calculatedTotalBuyingPrice = articles.reduce((sum, article) => {
      return sum + (parseFloat(article.amount || 0) * parseFloat(article.buyingPriceMultiplier || 1));
    }, 0);
    setValue('totalBuyingPrice', calculatedTotalBuyingPrice.toFixed(2));
  }, [articles, setValue]);

  useEffect(() => {
    const calculatedTotalSellingPrice = articles.reduce((sum, article) => {
      // Selling price should be article amount * selling price multiplier
      return sum + (parseFloat(article.amount || 0) * parseFloat(article.sellingPriceMultiplier || 1));
    }, 0);
    // Add fraisDeBagage to the total selling price
    setValue('totalSellingPrice', (calculatedTotalSellingPrice + parseFloat(fraisDeBagage || 0)).toFixed(2));
  }, [articles, fraisDeBagage, setValue]); // Add fraisDeBagage to dependency array

  const fetchClient = useCallback(async () => {
    try {
      console.log('📥 Fetching client from JSONBin:', id);

      // Get all clients and find the specific one
      const clients = await clientOps.getClients();
      const client = clients.find(c => c._id === id);

      if (client) {
        console.log('✅ Client found in JSONBin:', client.full_name);
        // Set form values
        // Set form values
        Object.keys(client).forEach(key => {
          if (key === 'articles') {
            // Ensure articles are correctly set for useFieldArray
            client.articles.forEach(article => append(article));
          } else if (key !== 'screenshots') {
            setValue(key, client[key]);
          }
        });

        setExistingScreenshots(client.screenshots || []);
      } else {
        console.error('❌ Client not found:', id);
        toast.error(t('client_not_found'));
        navigate('/dashboard/clients');
      }
    } catch (error) {
      console.error('❌ Error fetching client:', error);
      toast.error(t('failed_to_fetch_client_data'));
      navigate('/dashboard/clients');
    } finally {
      setInitialLoading(false);
    }
  }, [id, setValue, navigate, t, append]);

  useEffect(() => {
    if (isEdit) {
      fetchClient();
    }
  }, [isEdit, fetchClient]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + screenshots.length + existingScreenshots.length > 5) {
      toast.error(t('maximum_5_screenshots_allowed'));
      return;
    }

    const newScreenshots = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setScreenshots(prev => [...prev, ...newScreenshots]);
  };

  const removeScreenshot = (index, isExisting = false) => {
    if (isExisting) {
      setExistingScreenshots(prev => prev.filter((_, i) => i !== index));
    } else {
      setScreenshots(prev => {
        const updated = prev.filter((_, i) => i !== index);
        // Revoke object URL to prevent memory leaks
        URL.revokeObjectURL(prev[index].preview);
        return updated;
      });
    }
  };

  const onSubmit = async (data) => {
    try {
      setLoading(true);
      console.log(`${isEdit ? '📝' : '🆕'} Saving client to JSONBin...`);

      // Prepare client data for JSONBin
      let clientData = {
        ...data,
        // Add additional fields that might be missing
        advanceAmount: data.totalSellingPrice * 0.3,
        remainingAmount: data.totalSellingPrice * 0.7,
        advancePaid: data.advancePaid || false,
        remainingPaid: data.remainingPaid || false,
        confirmation: data.confirmation || 'pending',
        status: data.status || 'in_progress',
        articles: data.articles, // Include articles array
        buyingPrice: data.totalBuyingPrice, // Store total buying price
        sellingPrice: data.totalSellingPrice, // Store total selling price
        // Add user who created this client for activity tracking
        createdBy: user ? {
          _id: user._id,
          fullName: user.full_name || user.email,
          role: user.role
        } : null,
        fraisDeBagage: data.fraisDeBagage || 0
      };

      // Handle screenshot uploads to cloud
      const uploadedScreenshots = [];

      if (screenshots.length > 0) {
        console.log('📤 Uploading screenshots to cloud...');
        const toastId = toast.loading('Uploading screenshots to cloud storage...');

        for (let i = 0; i < screenshots.length; i++) {
          const screenshot = screenshots[i];

          try {
            if (uploadMethod === 'cloudinary') {
              const uploadResult = await uploadToCloudinary(screenshot.file);
              uploadedScreenshots.push({
                filename: screenshot.name,
                url: uploadResult.url,
                publicId: uploadResult.publicId,
                uploadedAt: new Date().toISOString()
              });
            } else if (uploadMethod === 'github') {
              // For GitHub, we'll generate the expected URL (manual upload to repo required)
              const expectedUrl = generateGitHubUrl(id || `client-${Date.now()}`, screenshot.name, i);
              uploadedScreenshots.push({
                filename: screenshot.name,
                url: expectedUrl,
                method: 'github',
                uploadedAt: new Date().toISOString()
              });
            }
          } catch (error) {
            console.error(`Failed to upload ${screenshot.name}:`, error);
            toast.error(t('failed_to_upload_screenshot', { name: screenshot.name }));
          }
        }

        if (uploadedScreenshots.length > 0) {
          toast.dismiss(toastId);
          toast.success(t('screenshots_uploaded_successfully', { count: uploadedScreenshots.length }));
        } else {
          toast.dismiss(toastId);
        }
      }

      // Combine existing and new screenshots
      clientData.screenshots = [
        ...existingScreenshots,
        ...uploadedScreenshots
      ];

      if (isEdit) {
        await clientOps.updateClient(id, clientData);
        toast.success(t('client_updated_successfully'));
        console.log('✅ Client updated in JSONBin:', id);
      } else {
        const newClient = await clientOps.createClient(clientData);
        toast.success(t('client_created_successfully'));
        console.log('✅ Client created in JSONBin:', newClient._id);
      }

      navigate('/dashboard/clients');
    } catch (error) {
      console.error('❌ Error saving client:', error);
      const message = error.message || t(isEdit ? 'failed_to_update_client' : 'failed_to_create_client');
      toast.error(message);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center space-x-4">
        <button
          onClick={() => navigate('/dashboard/clients')}
          className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
        >
          <ArrowLeft className="h-5 w-5 text-gray-600" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {isEdit ? t('edit_client') : t('add_new_client')}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? t('update_client_information') : t('create_new_client_order')}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('client_information')}</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="form-label">{t('full_name')} *</label>
              <input
                type="text"
                className={`form-input ${errors.fullName ? 'border-red-500' : ''}`}
                placeholder={t('enter_client_full_name')}
                {...register('fullName', {
                  required: t('full_name_required'),
                  minLength: { value: 2, message: t('name_min_length', { count: 2 }) }
                })}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="form-label">{t('phone_number')} *</label>
              <input
                type="tel"
                className={`form-input ${errors.phoneNumber ? 'border-red-500' : ''}`}
                placeholder={t('enter_phone_number')}
                {...register('phoneNumber', {
                  required: t('phone_number_required'),
                  minLength: { value: 8, message: t('phone_number_min_length', { count: 8 }) }
                })}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="form-label">{t('address')} *</label>
              <textarea
                rows={3}
                className={`form-input ${errors.address ? 'border-red-500' : ''}`}
                placeholder={t('enter_full_address')}
                {...register('address', {
                  required: t('address_required'),
                  minLength: { value: 5, message: t('address_min_length', { count: 5 }) }
                })}
              />
              {errors.address && (
                <p className="text-red-500 text-sm mt-1">{errors.address.message}</p>
              )}
            </div>
          </div>
        </div>

        {/* Order Details */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('order_details')}</h3>
          
          <div className="space-y-6">
            {fields.map((item, index) => (
              <div key={item.id} className="p-4 border border-gray-200 rounded-lg space-y-4 relative">
                <h4 className="text-md font-semibold text-gray-800 mb-3">{t('article')} #{index + 1}</h4>
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="absolute top-2 right-2 p-1 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
                  >
                    <MinusCircle className="h-5 w-5" />
                  </button>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Article Amount */}
                  <div>
                    <label className="form-label">{t('article_amount')} *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-input ${errors.articles?.[index]?.amount ? 'border-red-500' : ''}`}
                      placeholder="0.00"
                      {...register(`articles.${index}.amount`, {
                        required: t('article_amount_required'),
                        min: { value: 0, message: t('amount_cannot_be_negative') }
                      })}
                    />
                    {errors.articles?.[index]?.amount && (
                      <p className="text-red-500 text-sm mt-1">{errors.articles[index].amount.message}</p>
                    )}
                  </div>

                  {/* Buying Price Multiplier */}
                  <div>
                    <label className="form-label">{t('buying_price_multiplier')} *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-input ${errors.articles?.[index]?.buyingPriceMultiplier ? 'border-red-500' : ''}`}
                      placeholder="1.00"
                      {...register(`articles.${index}.buyingPriceMultiplier`, {
                        required: t('multiplier_required'),
                        min: { value: 0, message: t('multiplier_cannot_be_negative') }
                      })}
                    />
                    {errors.articles?.[index]?.buyingPriceMultiplier && (
                      <p className="text-red-500 text-sm mt-1">{errors.articles[index].buyingPriceMultiplier.message}</p>
                    )}
                  </div>

                  {/* Selling Price Multiplier */}
                  <div>
                    <label className="form-label">{t('selling_price_multiplier')} *</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className={`form-input ${errors.articles?.[index]?.sellingPriceMultiplier ? 'border-red-500' : ''}`}
                      placeholder="1.00"
                      {...register(`articles.${index}.sellingPriceMultiplier`, {
                        required: t('multiplier_required'),
                        min: { value: 0, message: t('multiplier_cannot_be_negative') }
                      })}
                    />
                    {errors.articles?.[index]?.sellingPriceMultiplier && (
                      <p className="text-red-500 text-sm mt-1">{errors.articles[index].sellingPriceMultiplier.message}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}

            <button
              type="button"
              onClick={() => append({ amount: 0, buyingPriceMultiplier: 1, sellingPriceMultiplier: 1.0 })}
              className="btn-outline flex items-center justify-center w-full mt-4"
            >
              <PlusCircle className="h-5 w-5 mr-2" />
              {t('add_article')}
            </button>

            {/* Total Calculated Prices */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 pt-4 border-t border-gray-200">
              <div>
                <label className="form-label">{t('total_buying_price')} (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input bg-gray-100 cursor-not-allowed"
                  value={totalBuyingPrice}
                  readOnly
                  {...register('totalBuyingPrice')}
                />
              </div>
              <div>
                <label className="form-label">{t('total_selling_price')} (TND)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  className="form-input bg-gray-100 cursor-not-allowed"
                  value={totalSellingPrice}
                  readOnly
                  {...register('totalSellingPrice')}
                />
              </div>
            </div>

            {/* Cart */}
            <div>
              <label className="form-label">{t('cart_information')} *</label>
              <input
                type="text"
                className={`form-input ${errors.cart ? 'border-red-500' : ''}`}
                placeholder={t('cart_details')}
                {...register('cart', {
                  required: t('cart_information_required')
                })}
              />
              {errors.cart && (
                <p className="text-red-500 text-sm mt-1">{errors.cart.message}</p>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="form-label">{t('confirmation_status')}</label>
              <select
                className="form-input"
                {...register('confirmation')}
              >
                <option value="pending">{t('pending')}</option>
                <option value="confirmed">{t('confirmed')}</option>
                <option value="cancelled">{t('cancelled')}</option>
              </select>
            </div>

            {/* Advance Payment Status */}
            <div>
              <label className="form-label">{t('advance_payment')} (30%)</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="advancePaid"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    {...register('advancePaid')}
                  />
                  <label htmlFor="advancePaid" className="ml-2 block text-sm text-gray-900">
                    {t('advance_paid')}
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  {t('amount')}: {watch('sellingPrice') ? (watch('sellingPrice') * 0.3).toFixed(2) : '0.00'} TND
                </div>
              </div>
            </div>

            {/* Remaining Payment Status */}
            <div>
              <label className="form-label">{t('remaining_payment')} (70%)</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remainingPaid"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    {...register('remainingPaid')}
                  />
                  <label htmlFor="remainingPaid" className="ml-2 block text-sm text-gray-900">
                    {t('remaining_paid')}
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  {t('amount')}: {watch('sellingPrice') ? (watch('sellingPrice') * 0.7).toFixed(2) : '0.00'} TND
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="form-label">{t('description')}</label>
              <textarea
                rows={4}
                className="form-input"
                placeholder={t('additional_notes_or_description')}
                {...register('description')}
              />
            </div>
          </div>
          {/* Frais de bagage */}
          <div>
            <label className="form-label">{t('frais_de_bagage')} (TND)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className={`form-input`}
              placeholder="0.00"
              {...register('fraisDeBagage')}
            />
          </div>
        </div>

        {/* Screenshots */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">{t('screenshots')}</h3>
          
          {/* File Upload */}
          <div className="mb-6">
            <label className="form-label">{t('upload_screenshots')} (Max 5)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500">
                    <span>{t('upload_files')}</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">{t('or_drag_and_drop')}</p>
                </div>
                <p className="text-xs text-gray-500">{t('png_jpg_gif_up_to_5mb_each')}</p>
              </div>
            </div>
          </div>

          {/* Existing Screenshots */}
          {existingScreenshots.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">{t('existing_screenshots')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {existingScreenshots.map((screenshot, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={screenshot.url}
                      alt={screenshot.filename}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index, true)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* New Screenshots Preview */}
          {screenshots.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-gray-900 mb-3">{t('new_screenshots')}</h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {screenshots.map((screenshot, index) => (
                  <div key={index} className="relative group">
                    <img
                      src={screenshot.preview}
                      alt={screenshot.name}
                      className="w-full h-24 object-cover rounded-lg border border-gray-200"
                    />
                    <button
                      type="button"
                      onClick={() => removeScreenshot(index, false)}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Submit Button */}
        <div className="flex justify-end space-x-4">
          <button
            type="button"
            onClick={() => navigate('/dashboard/clients')}
            className="btn-outline"
          >
            {t('cancel')}
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {isEdit ? t('updating') : t('creating')}...
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {isEdit ? t('update_client') : t('create_client')}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
