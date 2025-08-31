import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { clientOps, initializeAppData } from '../services/jsonbin-new';

const ClientContext = createContext();

export const useClients = () => {
  const context = useContext(ClientContext);
  if (!context) {
    throw new Error('useClients must be used within a ClientProvider');
  }
  return context;
};

export const ClientProvider = ({ children }) => {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Initialize and load clients
  useEffect(() => {
    const loadClients = async () => {
      try {
        setLoading(true);
        
        // Initialize data from JSONBin if available
        await initializeAppData();
        
        // Get clients from JSONBin service
        const clientData = clientOps.getClients();
        setClients(clientData);
        setError(null);
      } catch (err) {
        console.error('Error loading clients:', err);
        setError('Failed to load clients. Please try again.');
        toast.error('Failed to load clients');
      } finally {
        setLoading(false);
      }
    };

    loadClients();
  }, []);

  // Add a new client
  const addClient = async (clientData) => {
    try {
      setLoading(true);
      const newClient = clientOps.addClient(clientData);
      setClients(prev => [...prev, newClient]);
      toast.success('Client added successfully');
      return { success: true, client: newClient };
    } catch (err) {
      console.error('Error adding client:', err);
      toast.error('Failed to add client');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Update a client
  const updateClient = async (clientId, updates) => {
    try {
      setLoading(true);
      const updatedClient = clientOps.updateClient(clientId, updates);
      setClients(prev => 
        prev.map(client => client._id === clientId ? updatedClient : client)
      );
      toast.success('Client updated successfully');
      return { success: true, client: updatedClient };
    } catch (err) {
      console.error('Error updating client:', err);
      toast.error('Failed to update client');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Delete a client
  const deleteClient = async (clientId) => {
    try {
      setLoading(true);
      clientOps.deleteClient(clientId);
      setClients(prev => prev.filter(client => client._id !== clientId));
      toast.success('Client deleted successfully');
      return { success: true };
    } catch (err) {
      console.error('Error deleting client:', err);
      toast.error('Failed to delete client');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  // Get a client by ID
  const getClient = (clientId) => {
    try {
      return clientOps.getClient(clientId);
    } catch (err) {
      console.error('Error getting client:', err);
      return null;
    }
  };

  // Refresh clients from JSONBin
  const refreshClients = async () => {
    try {
      setLoading(true);
      
      // Re-initialize data from JSONBin
      await initializeAppData();
      
      // Get fresh clients data
      const clientData = clientOps.getClients();
      setClients(clientData);
      setError(null);
      toast.success('Clients refreshed from JSONBin');
      return { success: true };
    } catch (err) {
      console.error('Error refreshing clients:', err);
      setError('Failed to refresh clients. Please try again.');
      toast.error('Failed to refresh clients');
      return { success: false, error: err.message };
    } finally {
      setLoading(false);
    }
  };

  const value = {
    clients,
    loading,
    error,
    addClient,
    updateClient,
    deleteClient,
    getClient,
    refreshClients
  };

  return (
    <ClientContext.Provider value={value}>
      {children}
    </ClientContext.Provider>
  );
};