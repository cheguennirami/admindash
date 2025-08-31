import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';

const ProviderPaymentForm = ({ onPaymentAdded, onPaymentUpdated, initialPayment }) => {
  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  useEffect(() => {
    if (initialPayment) {
      reset({
        providerName: initialPayment.providerName || '',
        totalAmount: initialPayment.totalAmount || '',
        amountPaid: initialPayment.amountPaid || '',
        paymentDate: initialPayment.paymentDate || '',
        dueDate: initialPayment.dueDate || '',
        currency: initialPayment.currency || 'TND',
        notes: initialPayment.notes || '',
      });
    }
  }, [initialPayment, reset]);

  const generateId = () => `provider-payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

  const onSubmit = (data) => {
    const totalAmount = parseFloat(data.totalAmount);
    const amountPaid = parseFloat(data.amountPaid);
    const remainingAmount = totalAmount - amountPaid;

    let status;
    if (remainingAmount <= 0) {
      status = 'paid';
    } else if (amountPaid > 0) {
      status = 'partially_paid';
    } else {
      status = 'pending';
    }

    const paymentData = {
      ...data,
      totalAmount,
      amountPaid,
      remainingAmount,
      status,
      _id: initialPayment ? (initialPayment.id || initialPayment._id || generateId()) : generateId(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    try {
      if (initialPayment) {
        onPaymentUpdated(paymentData);
        toast.success('Payment updated successfully');
      } else {
        onPaymentAdded(paymentData);
        toast.success('Payment added successfully');
      }
      reset();
    } catch (error) {
      toast.error('Failed to save payment');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        {initialPayment ? 'Edit Provider Payment' : 'Add Provider Payment'}
      </h3>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Provider Name */}
        <div>
          <label htmlFor="providerName" className="block text-sm font-medium text-gray-700 mb-1">
            Provider Name *
          </label>
          <input
            id="providerName"
            type="text"
            {...register('providerName', { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter provider name"
          />
          {errors.providerName && <p className="text-red-500 text-sm mt-1">Provider name is required</p>}
        </div>

        {/* Total Amount */}
        <div>
          <label htmlFor="totalAmount" className="block text-sm font-medium text-gray-700 mb-1">
            Total Amount *
          </label>
          <input
            id="totalAmount"
            type="number"
            step="0.01"
            min="0"
            {...register('totalAmount', { required: true, min: 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
          {errors.totalAmount && <p className="text-red-500 text-sm mt-1">Valid total amount is required</p>}
        </div>

        {/* Amount Paid */}
        <div>
          <label htmlFor="amountPaid" className="block text-sm font-medium text-gray-700 mb-1">
            Amount Paid *
          </label>
          <input
            id="amountPaid"
            type="number"
            step="0.01"
            min="0"
            {...register('amountPaid', { required: true, min: 0 })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="0.00"
          />
          {errors.amountPaid && <p className="text-red-500 text-sm mt-1">Valid amount paid is required</p>}
        </div>

        {/* Payment Date */}
        <div>
          <label htmlFor="paymentDate" className="block text-sm font-medium text-gray-700 mb-1">
            Payment Date *
          </label>
          <input
            id="paymentDate"
            type="date"
            {...register('paymentDate', { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.paymentDate && <p className="text-red-500 text-sm mt-1">Payment date is required</p>}
        </div>

        {/* Due Date */}
        <div>
          <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">
            Due Date *
          </label>
          <input
            id="dueDate"
            type="date"
            {...register('dueDate', { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
          {errors.dueDate && <p className="text-red-500 text-sm mt-1">Due date is required</p>}
        </div>

        {/* Currency */}
        <div>
          <label htmlFor="currency" className="block text-sm font-medium text-gray-700 mb-1">
            Currency *
          </label>
          <select
            id="currency"
            {...register('currency', { required: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="TND">TND</option>
            <option value="EUR">EUR</option>
            <option value="USD">USD</option>
          </select>
          {errors.currency && <p className="text-red-500 text-sm mt-1">Currency is required</p>}
        </div>

        {/* Notes */}
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            id="notes"
            {...register('notes')}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            placeholder="Additional notes"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-blue-500 text-white py-2 px-4 rounded-lg font-medium hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {initialPayment ? 'Update Payment' : 'Add Payment'}
        </button>
      </form>
    </div>
  );
};

export default ProviderPaymentForm;