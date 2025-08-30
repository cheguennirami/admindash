// JSONBin Service for Frontend-Only Application
const JSONBIN_BASE_URL = 'https://api.jsonbin.io/v3/b';
const JSONBIN_API_KEY = process.env.REACT_APP_JSONBIN_API_KEY || 'your-api-key';
const JSONBIN_BIN_ID = process.env.REACT_APP_JSONBIN_BIN_ID || 'your-bin-id';

const headers = {
  'Content-Type': 'application/json',
  'X-Master-Key': JSONBIN_API_KEY,
  'X-Bin-Versioning': 'false'
};

// Alternative headers for public bins (if needed)
const publicHeaders = {
  'Content-Type': 'application/json'
};

// Helper function to handle API requests
const jsonbinRequest = async (method, data = null) => {
  try {
    const config = {
      method,
      headers,
    };

    if (data && (method === 'POST' || method === 'PUT')) {
      config.body = JSON.stringify(data);
    }

    // Try with public access first (in case API key is not working)
    const tempResponse = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
      method,
      headers: publicHeaders,
    });

    if (tempResponse.ok) {
      const result = await tempResponse.json();
      return result.record;
    }

    // If public access fails, try with API key
    const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, config);

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    return result.record;
  } catch (error) {
    console.error('JSONBin request failed:', error);
    throw error;
  }
};

// Get all data from JSONBin
export const getData = async () => {
  return await jsonbinRequest('GET');
};

// Update data in JSONBin
export const updateData = async (data) => {
  return await jsonbinRequest('PUT', data);
};

// Authentication functions
export const authOps = {
  // Get user by email
  getUserByEmail: async (email) => {
    const data = await getData();
    return data.users ? data.users.find(user => user.email === email) : null;
  },

  // Update user profile
  updateUser: async (userId, updateData) => {
    const currentData = await getData();

    if (!currentData.users) currentData.users = [];

    const userIndex = currentData.users.findIndex(user => user._id === userId);

    if (userIndex === -1) {
      throw new Error('User not found');
    }

    currentData.users[userIndex] = { ...currentData.users[userIndex], ...updateData, updatedAt: new Date().toISOString() };

    await updateData(currentData);
    return currentData.users[userIndex];
  },

  // Change user password
  updateUserPassword: async (userId, newPassword) => {
    const currentData = await getData();

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

    await updateData(currentData);
    return true;
  }
};

// Client management functions
export const clientOps = {
  // Get all clients
  getClients: async () => {
    const data = await getData();
    return data.clients || [];
  },

  // Get client by ID
  getClientById: async (clientId) => {
    const data = await getData();
    return data.clients ? data.clients.find(client => client._id === clientId) : null;
  },

  // Add new client
  addClient: async (clientData) => {
    const currentData = await getData();

    if (!currentData.clients) currentData.clients = [];

    const newClient = {
      _id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...clientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    currentData.clients.push(newClient);
    await updateData(currentData);

    return newClient;
  },

  // Update client
  updateClient: async (clientId, updateData) => {
    const currentData = await getData();

    if (!currentData.clients) currentData.clients = [];

    const clientIndex = currentData.clients.findIndex(client => client._id === clientId);

    if (clientIndex === -1) {
      throw new Error('Client not found');
    }

    currentData.clients[clientIndex] = {
      ...currentData.clients[clientIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };

    await updateData(currentData);
    return currentData.clients[clientIndex];
  },

  // Delete client
  deleteClient: async (clientId) => {
    const currentData = await getData();

    if (!currentData.clients) return false;

    const clientIndex = currentData.clients.findIndex(client => client._id === clientId);

    if (clientIndex === -1) {
      throw new Error('Client not found');
    }

    currentData.clients.splice(clientIndex, 1);
    await updateData(currentData);

    return true;
  }
};

// Payment management functions
export const paymentOps = {
  // Get payments for a client
  getPaymentsByClient: async (clientId) => {
    const data = await getData();
    return data.payments ? data.payments.filter(payment => payment.clientId === clientId) : [];
  },

  // Add payment
  addPayment: async (paymentData) => {
    const currentData = await getData();

    if (!currentData.payments) currentData.payments = [];

    const newPayment = {
      _id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...paymentData,
      createdAt: new Date().toISOString()
    };

    currentData.payments.push(newPayment);
    await updateData(currentData);

    return newPayment;
  }
};

// Settings management
export const settingsOps = {
  // Get settings
  getSettings: async () => {
    const data = await getData();
    return data.settings || {};
  },

  // Update settings
  updateSettings: async (updateData) => {
    const currentData = await getData();

    currentData.settings = {
      ...currentData.settings,
      ...updateData
    };

    await updateData(currentData);
    return currentData.settings;
  }
};