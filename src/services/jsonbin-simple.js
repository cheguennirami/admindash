import { getFinalConfig } from '../config/jsonbin';

// Simple JSONBin Service
const STORAGE_KEY = 'shein_dashboard_data';

// Use guaranteed configuration
const { apiKey: JSONBIN_API_KEY, binId: JSONBIN_BIN_ID, baseUrl: JSONBIN_BASE_URL } = getFinalConfig();

// Log configuration on load
console.log('🔧 JSONBin Service Configuration:');
console.log(`🔗 API URL: ${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID ? JSONBIN_BIN_ID : '[bin-id-missing]'}`);


const getEmptyData = () => ({
  users: [],
  clients: [],
  payments: [],
  settings: {
    initialized: true,
    version: "1.0.0"
  }
});

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

const updateData = async (data) => {
  try {
    // If JSONBin credentials are available, sync to JSONBin only
    if (JSONBIN_API_KEY && JSONBIN_BIN_ID) {
      const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
        method: 'PUT',
        headers: {
          'X-Master-Key': JSONBIN_API_KEY,
          'Content-Type': 'application/json',
          'X-Bin-Versioning': 'false'
        },
        body: JSON.stringify(data)
      });

      if (response.ok) {
        console.log('✅ Data synced to JSONBin');
      } else {
        console.warn('⚠️ JSONBin sync failed');
        throw new Error('Failed to sync data');
      }
    } else {
      console.warn('⚠️ JSONBin not configured, cannot save data');
      throw new Error('JSONBin not configured');
    }

    return data;
  } catch (error) {
    console.error('Error saving data:', error);
    throw error;
  }
};

// Initialize data from JSONBin with proper error handling
export const initializeData = async () => {
  const apiKey = JSONBIN_API_KEY;
  const binId = JSONBIN_BIN_ID;

  if (!apiKey || !binId) {
    console.warn('❌ Environment variables missing - using default empty data');
    console.warn('Required: REACT_APP_JSONBIN_API_KEY and REACT_APP_JSONBIN_BIN_ID');
    return getEmptyData();
  }

  try {
    console.log('🔄 Connecting to JSONBin...');

    const response = await fetch(`${JSONBIN_BASE_URL}/${binId}`, {
      method: 'GET',
      headers: {
        'X-Master-Key': apiKey,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const data = await response.json();
      if (data && data.record) {
        console.log('✅ Successfully connected to JSONBin!');
        console.log(`📊 Loaded ${data.record.users?.length || 0} users`);
        console.log(`📦 Loaded ${data.record.clients?.length || 0} clients`);
        console.log(`💰 Loaded ${data.record.payments?.length || 0} payments`);
        return data.record;
      } else {
        console.warn('⚠️ JSONBin connected but returned no valid data');
        return getEmptyData();
      }
    } else if (response.status === 404) {
      console.error('❌ Bin not found - please check your BIN_ID');
      console.error(`Targeted bin: ${binId}`);
      return getEmptyData();
    } else if (response.status === 401) {
      console.error('❌ Unauthorized - please check your API_KEY');
      return getEmptyData();
    } else {
      console.error(`❌ JSONBin returned status: ${response.status}`);
      return getEmptyData();
    }
  } catch (error) {
    console.error('❌ Network error connecting to JSONBin:', error.message);
    console.error('🔌 Check your internet connection and API credentials');
    return getEmptyData();
  }
};

// Authentication functions
export const authOps = {
  // Login user
  login: async (email, password) => {
    // Initialize data from JSONBin if available
    const data = await initializeData();
    
    // Find user with matching email and password
    const user = data.users.find(u => u.email === email && u.password === password);
    
    if (!user) {
      throw new Error('Invalid email or password');
    }
    
    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Get user by ID
  getUser: (userId) => {
    const data = getData();
    const user = data.users.find(u => u._id === userId);
    
    if (!user) {
      throw new Error('User not found');
    }
    
    // Return user data (without password)
    const { password: _, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Update user profile
  updateUser: (userId, updates) => {
    const data = getData();
    const userIndex = data.users.findIndex(u => u._id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Don't allow password updates through this method
    const { password, ...safeUpdates } = updates;
    
    // Update user
    data.users[userIndex] = {
      ...data.users[userIndex],
      ...safeUpdates,
      updatedAt: new Date().toISOString()
    };
    
    // Save data
    updateData(data);
    
    // Return updated user (without password)
    const { password: _, ...userWithoutPassword } = data.users[userIndex];
    return userWithoutPassword;
  },
  
  // Change password
  changePassword: (userId, currentPassword, newPassword) => {
    const data = getData();
    const userIndex = data.users.findIndex(u => u._id === userId);
    
    if (userIndex === -1) {
      throw new Error('User not found');
    }
    
    // Verify current password
    if (data.users[userIndex].password !== currentPassword) {
      throw new Error('Current password is incorrect');
    }
    
    // Update password
    data.users[userIndex].password = newPassword;
    data.users[userIndex].updatedAt = new Date().toISOString();
    
    // Save data
    updateData(data);
    
    return true;
  },
  
  // Get all users (for admin)
  getAllUsers: () => {
    const data = getData();
    
    // Return users without passwords
    return data.users.map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
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
  getClient: (clientId) => {
    const data = getData();
    const client = data.clients.find(c => c._id === clientId);
    
    if (!client) {
      throw new Error('Client not found');
    }
    
    return client;
  },
  
  // Add new client
  addClient: (clientData) => {
    const data = getData();
    
    const newClient = {
      _id: `client-${Date.now()}`,
      ...clientData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    data.clients.push(newClient);
    updateData(data);
    
    return newClient;
  },
  
  // Update client
  updateClient: (clientId, updates) => {
    const data = getData();
    const clientIndex = data.clients.findIndex(c => c._id === clientId);
    
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }
    
    data.clients[clientIndex] = {
      ...data.clients[clientIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };
    
    updateData(data);
    return data.clients[clientIndex];
  },
  
  // Delete client
  deleteClient: (clientId) => {
    const data = getData();
    const clientIndex = data.clients.findIndex(c => c._id === clientId);
    
    if (clientIndex === -1) {
      throw new Error('Client not found');
    }
    
    data.clients.splice(clientIndex, 1);
    updateData(data);
    
    return true;
  }
};

// Payment management functions
export const paymentOps = {
  // Get all payments
  getPayments: () => {
    const data = getData();
    return data.payments || [];
  },
  
  // Get payments for a client
  getClientPayments: (clientId) => {
    const data = getData();
    return data.payments.filter(p => p.clientId === clientId) || [];
  },
  
  // Add payment
  addPayment: (paymentData) => {
    const data = getData();
    
    const newPayment = {
      _id: `payment-${Date.now()}`,
      ...paymentData,
      createdAt: new Date().toISOString()
    };
    
    data.payments.push(newPayment);
    updateData(data);
    
    return newPayment;
  },
  
  // Delete payment
  deletePayment: (paymentId) => {
    const data = getData();
    const paymentIndex = data.payments.findIndex(p => p._id === paymentId);
    
    if (paymentIndex === -1) {
      throw new Error('Payment not found');
    }
    
    data.payments.splice(paymentIndex, 1);
    updateData(data);
    
    return true;
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
    const data = getData();
    
    data.settings = {
      ...data.settings,
      ...updates
    };
    
    updateData(data);
    return data.settings;
  }
};

// Export a function to initialize data
export const initializeAppData = initializeData;