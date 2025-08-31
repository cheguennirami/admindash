// 🎯 Complete JSONBin Service - Final Version
const STORAGE_KEY = 'shein_dashboard_data';
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';

// Environment variables
const JSONBIN_API_KEY = process.env.REACT_APP_JSONBIN_API_KEY;
const JSONBIN_BIN_ID = process.env.REACT_APP_JSONBIN_BIN_ID;


// 🌐 JSONBin API Operations
const jsonbinAPI = {
  async get() {
    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
        headers: {
          'X-Master-Key': JSONBIN_API_KEY,
          'Content-Type': 'application/json'
        }
      });
      return response.ok ? await response.json() : null;
    } catch {
      return null;
    }
  },

  async put(data) {
    try {
      const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'X-Master-Key': JSONBIN_API_KEY,
          'Content-Type': 'application/json',
          'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify(data)
      });
      return response.ok;
    } catch {
      return false;
    }
  }
};

const getEmptyData = () => ({
  users: [],
  clients: [],
  payments: [],
  settings: {
    initialized: true,
    version: "3.0.0"
  }
});

// 🏠 Local Storage Operations
const localStorageOps = {
  get() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : getEmptyData();
    } catch {
      return getEmptyData();
    }
  },

  set(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  },

  init() {
    const data = this.get();
    this.set(data);
    return data;
  }
};

// 🎯 Main Data Manager
export const dataManager = {
  async loadData() {
    console.log('📥 Loading application data...');

    if (JSONBIN_API_KEY && JSONBIN_BIN_ID) {
      const remoteData = await jsonbinAPI.get();
      if (remoteData?.record) {
        console.log('✅ Data loaded from JSONBin');
        localStorageOps.set(remoteData.record); // Sync to local
        return remoteData.record;
      }
    }

    console.log('📋 Using localStorage data');
    return localStorageOps.get();
  },

  async saveData(data) {
    localStorageOps.set(data);

    if (JSONBIN_API_KEY && JSONBIN_BIN_ID) {
      const success = await jsonbinAPI.put(data);
      if (success) {
        console.log('✅ Data synced to JSONBin');
      } else {
        console.warn('⚠️ JSONBin sync failed, data saved locally only');
      }
    }

    return data;
  }
};

// Helper functions for local storage operations
const getData = () => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    } else {
      // Return empty data structure
      return getEmptyData();
    }
  } catch (error) {
    console.error('Error reading local data:', error);
    // Fallback to empty data
    return getEmptyData();
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
  },

  // Create new user
  createUser: (userData) => {
    const currentData = getData();

    if (!currentData.users) currentData.users = [];

    // Check if email already exists
    const existingUser = currentData.users.find(user => user.email === userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    const newUser = {
      _id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    currentData.users.push(newUser);
    updateData(currentData);

    return newUser;
  },

  // Delete user by ID
  deleteUser: (userId) => {
    const currentData = getData();

    if (!currentData.users) return false;

    const userIndex = currentData.users.findIndex(user => user._id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    // Prevent deleting the last super admin
    const superAdmins = currentData.users.filter(user => user.role === 'super_admin');
    const userToDelete = currentData.users[userIndex];

    if (userToDelete.role === 'super_admin' && superAdmins.length <= 1) {
      throw new Error('Cannot delete the last super administrator');
    }

    currentData.users.splice(userIndex, 1);
    updateData(currentData);

    return true;
  },

  // Get all users
  getUsers: () => {
    const data = getData();
    return data.users || [];
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