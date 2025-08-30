// Local JSON Storage Service (JSONBin alternative for deactivated accounts)
const STORAGE_KEY = 'shein_dashboard_data';

// Default data structure
const DEFAULT_DATA = {
  "users": [
    {
      "_id": "admin-001",
      "full_name": "Super Administrator",
      "email": "admin@sheintoyou.com",
      "password": "AdminPassword123!",
      "role": "super_admin",
      "isActive": true,
      "avatar": "",
      "phone": "",
      "createdAt": new Date().toISOString(),
      "updatedAt": new Date().toISOString()
    }
  ],
  "clients": [],
  "payments": [],
  "settings": {
    "initialized": true,
    "version": "1.0.0"
  }
};

// Helper functions for local storage operations
const getData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    } else {
      // Initialize with default data
      localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
      return DEFAULT_DATA;
    }
  } catch (error) {
    console.error('Error reading local data:', error);
    // Fallback to default data
    localStorage.setItem(STORAGE_KEY, JSON.stringify(DEFAULT_DATA));
    return DEFAULT_DATA;
  }
};

const updateData = (data) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    return data;
  } catch (error) {
    console.error('Error saving local data:', error);
    throw error;
  }
};

// Authentication functions
export const authOps = {
  // Get user by email
  getUserByEmail: (email) => {
    const data = getData();
    return data.users ? data.users.find(user => user.email === email) : null;
  },

  // Update user profile
  updateUser: (userId, updates) => {
    const currentData = getData();

    if (!currentData.users) currentData.users = [];

    const userIndex = currentData.users.findIndex(user => user._id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    currentData.users[userIndex] = {
      ...currentData.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    updateData(currentData);
    return currentData.users[userIndex];
  },

  // Change user password
  updateUserPassword: (userId, newPassword) => {
    const currentData = getData();

    if (!currentData.users) currentData.users = [];

    const userIndex = currentData.users.findIndex(user => user._id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    currentData.users[userIndex] = {
      ...currentData.users[userIndex],
      password: newPassword,
      updatedAt: new Date().toISOString()
    };

    updateData(currentData);
    return true;
  }
};

// Client management functions
export const clientOps = {
  // Get all clients
  getClients: () => {
    const data = getData();
    return data.clients || [];
  },

  // Get client by ID
  getClientById: (clientId) => {
    const data = getData();
    return data.clients ? data.clients.find(client => client._id === clientId) : null;
  },

  // Add new client
  addClient: (clientData) => {
    const currentData = getData();

    if (!currentData.clients) currentData.clients = [];

    const newClient = {
      _id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...clientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    currentData.clients.push(newClient);
    updateData(currentData);

    return newClient;
  },

  // Update client
  updateClient: (clientId, updates) => {
    const currentData = getData();

    if (!currentData.clients) currentData.clients = [];

    const clientIndex = currentData.clients.findIndex(client => client._id === clientId);

    if (clientIndex === -1) {
      throw new Error('Client not found');
    }

    currentData.clients[clientIndex] = {
      ...currentData.clients[clientIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    updateData(currentData);
    return currentData.clients[clientIndex];
  },

  // Delete client
  deleteClient: (clientId) => {
    const currentData = getData();

    if (!currentData.clients) return false;

    const clientIndex = currentData.clients.findIndex(client => client._id === clientId);

    if (clientIndex === -1) {
      throw new Error('Client not found');
    }

    currentData.clients.splice(clientIndex, 1);
    updateData(currentData);

    return true;
  }
};

// Payment management functions
export const paymentOps = {
  // Get payments for a client
  getPaymentsByClient: (clientId) => {
    const data = getData();
    return data.payments ? data.payments.filter(payment => payment.clientId === clientId) : [];
  },

  // Add payment
  addPayment: (paymentData) => {
    const currentData = getData();

    if (!currentData.payments) currentData.payments = [];

    const newPayment = {
      _id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...paymentData,
      createdAt: new Date().toISOString()
    };

    currentData.payments.push(newPayment);
    updateData(currentData);

    return newPayment;
  }
};

// Settings management
export const settingsOps = {
  // Get settings
  getSettings: () => {
    const data = getData();
    return data.settings || {};
  },

  // Update settings
  updateSettings: (updates) => {
    const currentData = getData();

    currentData.settings = {
      ...currentData.settings,
      ...updates
    };

    updateData(currentData);
    return currentData.settings;
  }
};