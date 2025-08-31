import React, { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Upload, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import LoadingSpinner from '../common/LoadingSpinner';
import { clientOps } from '../../services/jsonbin-new'; // Import JSONBin client operations

const ClientForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const isEdit = Boolean(id);
  // Remove unused user variable
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(isEdit);
  const [screenshots, setScreenshots] = useState([]);
  const [existingScreenshots, setExistingScreenshots] = useState([]);
  
  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm();

  const fetchClient = useCallback(async () => {
    try {
      console.log('📥 Fetching client from JSONBin:', id);

      // Get all clients and find the specific one
      const clients = await clientOps.getClients();
      const client = clients.find(c => c._id === id);

      if (client) {
        console.log('✅ Client found in JSONBin:', client.full_name);
        // Set form values
        Object.keys(client).forEach(key => {
          if (key !== 'screenshots') {
            setValue(key, client[key]);
          }
        });

        setExistingScreenshots(client.screenshots || []);
      } else {
        console.error('❌ Client not found:', id);
        toast.error('Client not found');
        navigate('/dashboard/clients');
      }
    } catch (error) {
      console.error('❌ Error fetching client:', error);
      toast.error('Failed to fetch client data');
      navigate('/dashboard/clients');
    } finally {
      setInitialLoading(false);
    }
  }, [id, setValue, navigate]);

  useEffect(() => {
    if (isEdit) {
      fetchClient();
    }
  }, [isEdit, fetchClient]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (files.length + screenshots.length + existingScreenshots.length > 5) {
      toast.error('Maximum 5 screenshots allowed');
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
      const clientData = {
        ...data,
        // Add additional fields that might be missing
        advanceAmount: data.sellingPrice * 0.3,
        remainingAmount: data.sellingPrice * 0.7,
        advancePaid: data.advancePaid || false,
        remainingPaid: data.remainingPaid || false,
        // For now, we'll skip screenshots in database
        screenshots: [],
        confirmation: data.confirmation || 'pending',
        status: data.status || 'in_progress'
      };

      if (isEdit) {
        await clientOps.updateClient(id, clientData);
        toast.success('Client updated successfully');
        console.log('✅ Client updated in JSONBin:', id);
      } else {
        const newClient = await clientOps.createClient(clientData);
        toast.success('Client created successfully');
        console.log('✅ Client created in JSONBin:', newClient._id);
      }

      navigate('/dashboard/clients');
    } catch (error) {
      console.error('❌ Error saving client:', error);
      const message = error.message || `Failed to ${isEdit ? 'update' : 'create'} client`;
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
            {isEdit ? 'Edit Client' : 'Add New Client'}
          </h1>
          <p className="text-gray-600 mt-1">
            {isEdit ? 'Update client information' : 'Create a new client order'}
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Client Information</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Full Name */}
            <div>
              <label className="form-label">Full Name *</label>
              <input
                type="text"
                className={`form-input ${errors.fullName ? 'border-red-500' : ''}`}
                placeholder="Enter client's full name"
                {...register('fullName', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' }
                })}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm mt-1">{errors.fullName.message}</p>
              )}
            </div>

            {/* Phone Number */}
            <div>
              <label className="form-label">Phone Number *</label>
              <input
                type="tel"
                className={`form-input ${errors.phoneNumber ? 'border-red-500' : ''}`}
                placeholder="Enter phone number"
                {...register('phoneNumber', {
                  required: 'Phone number is required',
                  minLength: { value: 8, message: 'Phone number must be at least 8 digits' }
                })}
              />
              {errors.phoneNumber && (
                <p className="text-red-500 text-sm mt-1">{errors.phoneNumber.message}</p>
              )}
            </div>

            {/* Address */}
            <div className="md:col-span-2">
              <label className="form-label">Address *</label>
              <textarea
                rows={3}
                className={`form-input ${errors.address ? 'border-red-500' : ''}`}
                placeholder="Enter full address"
                {...register('address', {
                  required: 'Address is required',
                  minLength: { value: 5, message: 'Address must be at least 5 characters' }
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
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Order Details</h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Buying Price */}
            <div>
              <label className="form-label">Buying Price (TND) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-input ${errors.buyingPrice ? 'border-red-500' : ''}`}
                placeholder="0.00"
                {...register('buyingPrice', {
                  required: 'Buying price is required',
                  min: { value: 0, message: 'Price cannot be negative' }
                })}
              />
              {errors.buyingPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.buyingPrice.message}</p>
              )}
            </div>

            {/* Selling Price */}
            <div>
              <label className="form-label">Selling Price (TND) *</label>
              <input
                type="number"
                step="0.01"
                min="0"
                className={`form-input ${errors.sellingPrice ? 'border-red-500' : ''}`}
                placeholder="0.00"
                {...register('sellingPrice', {
                  required: 'Selling price is required',
                  min: { value: 0, message: 'Price cannot be negative' }
                })}
              />
              {errors.sellingPrice && (
                <p className="text-red-500 text-sm mt-1">{errors.sellingPrice.message}</p>
              )}
            </div>

            {/* Cart */}
            <div>
              <label className="form-label">Cart Information *</label>
              <input
                type="text"
                className={`form-input ${errors.cart ? 'border-red-500' : ''}`}
                placeholder="Cart details"
                {...register('cart', {
                  required: 'Cart information is required'
                })}
              />
              {errors.cart && (
                <p className="text-red-500 text-sm mt-1">{errors.cart.message}</p>
              )}
            </div>

            {/* Confirmation */}
            <div>
              <label className="form-label">Confirmation Status</label>
              <select
                className="form-input"
                {...register('confirmation')}
              >
                <option value="pending">Pending</option>
                <option value="confirmed">Confirmed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            {/* Advance Payment Status */}
            <div>
              <label className="form-label">Advance Payment (30%)</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="advancePaid"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    {...register('advancePaid')}
                  />
                  <label htmlFor="advancePaid" className="ml-2 block text-sm text-gray-900">
                    Advance Paid
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  Amount: {watch('sellingPrice') ? (watch('sellingPrice') * 0.3).toFixed(2) : '0.00'} TND
                </div>
              </div>
            </div>

            {/* Remaining Payment Status */}
            <div>
              <label className="form-label">Remaining Payment (70%)</label>
              <div className="space-y-2">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="remainingPaid"
                    className="h-4 w-4 text-pink-600 focus:ring-pink-500 border-gray-300 rounded"
                    {...register('remainingPaid')}
                  />
                  <label htmlFor="remainingPaid" className="ml-2 block text-sm text-gray-900">
                    Remaining Paid
                  </label>
                </div>
                <div className="text-sm text-gray-500">
                  Amount: {watch('sellingPrice') ? (watch('sellingPrice') * 0.7).toFixed(2) : '0.00'} TND
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="md:col-span-2">
              <label className="form-label">Description</label>
              <textarea
                rows={4}
                className="form-input"
                placeholder="Additional notes or description"
                {...register('description')}
              />
            </div>
          </div>
        </div>

        {/* Screenshots */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Screenshots</h3>

          {/* File Upload */}
          <div className="mb-6">
            <label className="form-label">Upload Screenshots (Max 5)</label>
            <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-gray-400 transition-colors">
              <div className="space-y-1 text-center">
                <Upload className="mx-auto h-12 w-12 text-gray-400" />
                <div className="flex text-sm text-gray-600">
                  <label className="relative cursor-pointer bg-white rounded-md font-medium text-pink-600 hover:text-pink-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-pink-500">
                    <span>Upload files</span>
                    <input
                      type="file"
                      multiple
                      accept="image/*"
                      onChange={handleFileChange}
                      className="sr-only"
                    />
                  </label>
                  <p className="pl-1">or drag and drop</p>
                </div>
                <p className="text-xs text-gray-500">PNG, JPG, GIF up to 5MB each</p>
              </div>
            </div>
          </div>

          {/* Existing Screenshots */}
          {existingScreenshots.length > 0 && (
            <div className="mb-6">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Existing Screenshots</h4>
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
              <h4 className="text-sm font-medium text-gray-900 mb-3">New Screenshots</h4>
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
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="btn-primary flex items-center"
          >
            {loading ? (
              <>
                <LoadingSpinner size="sm" className="mr-2" />
                {isEdit ? 'Updating...' : 'Creating...'}
              </>
            ) : (
              <>
                <Save className="h-5 w-5 mr-2" />
                {isEdit ? 'Update Client' : 'Create Client'}
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default ClientForm;
