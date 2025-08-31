import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { paymentOps, initializeAppData } from '../services/jsonbin-new';

const PaymentContext = createContext();

export const usePayments = () => {
  const context = useContext(PaymentContext);
  if (!context) {
    throw new Error('usePayments must be used within a PaymentProvider');
  }
  return context;
};

export const PaymentProvider = ({ children }) => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and load payments
  useEffect(() => {
    const loadPayments = async () => {
      try {
        setLoading(true);
        
        // Initialize data from JSONBin if available
        await initializeAppData();
        
        // Get payments from JSONBin service
        const paymentData = paymentOps.getPayments();
        setPayments(paymentData);
        setError(null);
      } catch (err) {
        console.error('Error loading payments:', err);
        setError('Failed to load payments. Please try again.');
        toast.error('Failed to load payments');
      } finally {
        setLoading(false);
      }
    };

    loadPayments();
  }, []);

  // Add a new payment
  const addPayment = async (paymentData) => {
    try {
      setLoading(true);
      const newPayment = paymentOps.addPayment(paymentData);
      setPayments(prev => [...prev, newPayment]);
      toast.success('Payment added successfully');
      return { success: true, payment: newPayment };
    } catch (err) {
      console.error('Error adding payment:', err);
      toast.error('Failed to add payment');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete a payment
  const deletePayment = async (paymentId) => {
    try {
      setLoading(true);
      paymentOps.deletePayment(paymentId);
      setPayments(prev => prev.filter(payment => payment._id !== paymentId));
      toast.success('Payment deleted successfully');
      return { success: true };
    } catch (err) {
      console.error('Error deleting payment:', err);
      toast.error('Failed to delete payment');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get payments for a specific client
  const getClientPayments = (clientId) => {
    try {
      return paymentOps.getClientPayments(clientId);
    } catch (err) {
      console.error('Error getting client payments:', err);
      return [];
    }
  };

  // Refresh payments from JSONBin
  const refreshPayments = async () => {
    try {
      setLoading(true);
      
      // Re-initialize data from JSONBin
      await initializeAppData();
      
      // Get fresh payments data
      const paymentData = paymentOps.getPayments();
      setPayments(paymentData);
      setError(null);
      toast.success('Payments refreshed from JSONBin');
      return { success: true };
    } catch (err) {
      console.error('Error refreshing payments:', err);
      setError('Failed to refresh payments. Please try again.');
      toast.error('Failed to refresh payments');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    payments,
    loading,
    error,
    addPayment,
    deletePayment,
    getClientPayments,
    refreshPayments
  };

  return (
    <PaymentContext.Provider value={value}>
      {children}
    </PaymentContext.Provider>
  );
};