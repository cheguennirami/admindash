import { getFinalConfig } from '../config/jsonbin';

const STORAGE_KEY = 'shein_dashboard_data';

const { apiKey: JSONBIN_API_KEY, binId: JSONBIN_BIN_ID, baseUrl: JSONBIN_BASE_URL } = getFinalConfig();

const getEmptyData = () => ({
  users: [],
  clients: [],
  payments: [],
  providerPayments: [],
  orders: [],
  categories: {
    expense: ['Office Supplies', 'Software & Tools', 'Marketing & Advertising', 'Utilities', 'Travel & Transport', 'Professional Services', 'Equipment', 'Miscellaneous'],
    income: ['Business Assets', 'Service Fees', 'Consultation', 'Maintenance', 'Licenses', 'Commissions', 'Miscellaneous']
  },
  settings: {
    initialized: true,
    version: "3.0.0"
  }
});

let pendingRequests = 0;
const maxConcurrentRequests = 3;
const requestQueue = [];

async function processQueue() {
  if (pendingRequests >= maxConcurrentRequests || requestQueue.length === 0) {
    return;
  }

  const { operation, resolve, reject } = requestQueue.shift();
  pendingRequests++;

  try {
    const result = await operation();
    resolve(result);
  } catch (error) {
    reject(error);
  } finally {
    pendingRequests--;
    setTimeout(processQueue, 100);
  }
}

function enqueueRequest(operation, retries = 3) {
  return new Promise((resolve, reject) => {
    requestQueue.push({ operation: () => executeWithRetry(operation, retries), resolve, reject });
    processQueue();
  });
}

async function executeWithRetry(operation, retries = 3) {
  for (let i = 0; i <= retries; i++) {
    try {
      return await operation();
    } catch (error) {
      if (i === retries) {
        throw error;
      }

      if (!isRetryableError(error)) {
        throw error;
      }

      const delay = Math.pow(2, i) * 1000 + Math.random() * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}

function isRetryableError(error) {
  if (error.name === 'AbortError') return true;
  if (error.message.includes('NetworkError') || error.message.includes('CORS')) return true;
  if (error.message.includes('fetch') && error.message.includes('failed')) return true;
  return false;
}

const jsonbinAPI = {
  async get() {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
      return null;
    }

    return enqueueRequest(async () => {
      try {
        const controller = new AbortController();
        const requestTimeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
          method: 'GET',
          headers: {
            'X-Master-Key': JSONBIN_API_KEY,
            'Content-Type': 'application/json'
          },
          signal: controller.signal
        });

        clearTimeout(requestTimeoutId);
        if (response.ok) {
          return await response.json();
        } else {
          if (response.status === 401) {
            throw new Error('Unauthorized: Invalid API credentials');
          } else if (response.status === 404) {
            throw new Error('Not Found: JSONBin resource not found or credentials invalid');
          } else if (response.status === 429) {
            throw new Error('Too Many Requests: Rate limit exceeded');
          } else if (response.status >= 500) {
            throw new Error(`Server Error: ${response.status} - JSONBin server error`);
          } else {
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }
    });
  },

  async put(data) {
    if (!JSONBIN_API_KEY || !JSONBIN_BIN_ID) {
      return false;
    }

    return enqueueRequest(async () => {
      try {
        const controller = new AbortController();
        const putTimeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`${JSONBIN_BASE_URL}/${JSONBIN_BIN_ID}`, {
          method: 'PUT',
          headers: {
            'X-Master-Key': JSONBIN_API_KEY,
            'Content-Type': 'application/json',
            'X-Bin-Versioning': 'false'
          },
          body: JSON.stringify(data),
          signal: controller.signal
        });

        clearTimeout(putTimeoutId);

        if (response.ok) {
          return true;
        } else {
          if (response.status === 401) {
            throw new Error('Unauthorized: Invalid or missing JSONBin API credentials');
          } else if (response.status === 403) {
            throw new Error('Forbidden: API credentials do not have write permissions');
          } else if (response.status === 404) {
            throw new Error('Not Found: JSONBin bin not found');
          } else if (response.status === 429) {
            throw new Error('Too Many Requests: Rate limit exceeded, please wait');
          } else if (response.status === 413) {
            throw new Error('Request Entity Too Large: Data payload exceeds JSONBin limits');
          } else if (response.status >= 500) {
            throw new Error(`Server Error: ${response.status} - JSONBin server unavailable`);
          } else {
            throw new Error(`HTTP Error: ${response.status} - ${response.statusText}`);
          }
        }
      } catch (error) {
        if (error.name === 'AbortError') {
          throw new Error('Request timed out');
        }
        throw error;
      }
    });
  }
};

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
  }
};

export const dataManager = {
  async loadData() {
    if (JSONBIN_API_KEY && JSONBIN_BIN_ID) {
      const remoteData = await jsonbinAPI.get();
      if (remoteData?.record) {
        localStorageOps.set(remoteData.record);
        return remoteData.record;
      }
    }

    const localData = localStorageOps.get();
    return localData;
  },

  async saveData(data) {
    localStorageOps.set(data);

    if (JSONBIN_API_KEY && JSONBIN_BIN_ID) {
      await jsonbinAPI.put(data);
    }

    return data;
  }
};

export const authOps = {
  async login(email, password) {
    const data = await dataManager.loadData();
    const user = data.users?.find(u => u.email === email && u.password === password);

    if (!user) throw new Error('Invalid credentials');
    if (!user.isActive) throw new Error('Account is deactivated');

    return user;
  },

  async getUserByEmail(email) {
    const data = await dataManager.loadData();
    return data.users?.find(u => u.email === email) || null;
  },

  async getUsers() {
    const data = await dataManager.loadData();
    return data.users || [];
  },

  async createUser(userData) {
    const data = await dataManager.loadData();

    if (data.users?.find(u => u.email === userData.email)) {
      throw new Error('User with this email already exists');
    }

    const newUser = {
      _id: `user-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...userData,
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.users = [...(data.users || []), newUser];
    await dataManager.saveData(data);

    return newUser;
  },

  async updateUser(userId, updates) {
    const data = await dataManager.loadData();
    const userIndex = data.users?.findIndex(u => u._id === userId);

    if (userIndex === -1 || userIndex === undefined) {
      throw new Error('User not found');
    }

    data.users[userIndex] = {
      ...data.users[userIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await dataManager.saveData(data);
    return data.users[userIndex];
  },

  async updateUserPassword(userId, newPassword) {
    const data = await dataManager.loadData();
    const userIndex = data.users?.findIndex(u => u._id === userId);

    if (userIndex === -1 || userIndex === undefined) {
      throw new Error('User not found');
    }

    data.users[userIndex] = {
      ...data.users[userIndex],
      password: newPassword,
      updatedAt: new Date().toISOString()
    };

    await dataManager.saveData(data);
    return data.users[userIndex];
  },

  async deleteUser(userId) {
    const data = await dataManager.loadData();
    const superAdmins = data.users?.filter(u => u.role === 'super_admin') || [];
    const userToDelete = data.users?.find(u => u._id === userId);

    if (userToDelete?.role === 'super_admin' && superAdmins.length <= 1) {
      throw new Error('Cannot delete the last super administrator');
    }

    data.users = data.users?.filter(u => u._id !== userId) || [];
    await dataManager.saveData(data);

    return true;
  }
};

export const clientOps = {
  async getClients() {
    console.log('clientOps: getClients called.');
    try {
      const data = await dataManager.loadData();
      console.log('clientOps: getClients - Data loaded. Clients count:', data.clients?.length || 0);
      return data.clients || [];
    } catch (error) {
      console.error('clientOps: getClients - Error loading data:', error);
      throw error;
    }
  },

  async createClient(clientData) {
    const data = await dataManager.loadData();

    const newClient = {
      _id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...clientData,
      orderId: clientData.orderId || `ORD-${Date.now()}`,
      status: clientData.status || 'in_progress',
      confirmation: clientData.confirmation || 'pending',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.clients = [...(data.clients || []), newClient];
    await dataManager.saveData(data);

    return newClient;
  },

  async updateClient(clientId, updates) {
    const data = await dataManager.loadData();
    const clientIndex = data.clients?.findIndex(c => c._id === clientId);

    if (clientIndex === -1 || clientIndex === undefined) {
      throw new Error('Client not found');
    }

    data.clients[clientIndex] = {
      ...data.clients[clientIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await dataManager.saveData(data);
    return data.clients[clientIndex];
  },

  async deleteClient(clientId) {
    const data = await dataManager.loadData();
    data.clients = data.clients?.filter(c => c._id !== clientId) || [];
    await dataManager.saveData(data);
    return true;
  }
};

export const paymentOps = {
  async getPayments() {
    const data = await dataManager.loadData();
    return data.payments || [];
  },

  async createPayment(paymentData) {
    const data = await dataManager.loadData();

    const newPayment = {
      _id: `payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...paymentData,
      createdAt: new Date().toISOString()
    };

    data.payments = [...(data.payments || []), newPayment];

    if (paymentData.clientId && paymentData.type === 'advance') {
      const clientToUpdate = data.clients?.find(c => c._id === paymentData.clientId);
      if (clientToUpdate) {
        if (paymentData.amount >= clientToUpdate.advanceAmount) {
          clientToUpdate.advancePaid = true;
        }
      }
    }

    await dataManager.saveData(data);

    return newPayment;
  },

  async getPaymentsByClient(clientId) {
    const payments = await this.getPayments();
    return payments.filter(p => p.clientId === clientId);
  },

  async updatePayment(paymentId, updates) {
    const data = await dataManager.loadData();
    const paymentIndex = data.payments?.findIndex(p => p._id === paymentId);

    if (paymentIndex === -1 || paymentIndex === undefined) {
      throw new Error('Payment not found');
    }

    data.payments[paymentIndex] = {
      ...data.payments[paymentIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await dataManager.saveData(data);

    return data.payments[paymentIndex];
  },

  async deletePayment(paymentId) {
    const data = await dataManager.loadData();
    const paymentIndex = data.payments?.findIndex(p => p._id === paymentId);

    if (paymentIndex === -1 || paymentIndex === undefined) {
      throw new Error('Payment not found');
    }

    data.payments.splice(paymentIndex, 1);
    await dataManager.saveData(data);

    return true;
  },

  async createExpense(expenseData) {
    const data = await dataManager.loadData();

    const newExpense = {
      _id: `expense-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'expense',
      ...expenseData,
      createdAt: new Date().toISOString()
    };

    data.payments = [...(data.payments || []), newExpense];
    await dataManager.saveData(data);

    return newExpense;
  },

  async createIncome(incomeData) {
    return this.createPayment({ type: 'income', ...incomeData });
  },

  async getExpenses() {
    const payments = await this.getPayments();
    return payments.filter(p => p.type === 'expense');
  },

  async getExpensesByClient(clientId) {
    const expenses = await this.getExpenses();
    return expenses.filter(e => e.clientId === clientId);
  },

  async deleteExpense(expenseId) {
    return this.deletePayment(expenseId);
  },

  async getFinancialStats() {
    const data = await dataManager.loadData();
    const payments = data.payments || [];

    const totalIncome = payments
      .filter(p => p.type === 'income' || p.type === 'advance')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const totalExpenses = payments
      .filter(p => p.type === 'expense')
      .reduce((sum, p) => sum + (p.amount || 0), 0);

    const netProfit = totalIncome - totalExpenses;
    const pendingPayments = data.clients?.filter(c => !c.remainingPaid && c.status !== 'delivered_to_client').length || 0;

    return {
      totalIncome,
      totalExpenses,
      netProfit,
      pendingPayments,
      totalPayments: payments.filter(p => p.type !== 'expense').length,
      totalExpensesCount: payments.filter(p => p.type === 'expense').length,
      recentPayments: payments.slice(-5)
    };
  }
};

export const orderOps = {
  async getOrders() {
    const data = await dataManager.loadData();
    return data.orders || [];
  },

  async createOrder(orderData) {
    const data = await dataManager.loadData();

    const newOrder = {
      _id: `order-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      ...orderData,
      status: orderData.status || 'in_progress',
      trackingUpdates: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    data.orders = [...(data.orders || []), newOrder];
    await dataManager.saveData(data);

    return newOrder;
  },

  async updateOrder(orderId, updates) {
    const data = await dataManager.loadData();
    const orderIndex = data.orders?.findIndex(o => o._id === orderId);

    if (orderIndex === -1 || orderIndex === undefined) {
      throw new Error('Order not found');
    }

    if (updates.status && updates.status !== data.orders[orderIndex].status) {
      const trackingUpdate = {
        status: updates.status,
        timestamp: new Date().toISOString(),
        location: 'France',
        description: `Order status updated to ${updates.status}`,
        operator: 'Logistics Team'
      };

      data.orders[orderIndex].trackingUpdates = [
        ...(data.orders[orderIndex].trackingUpdates || []),
        trackingUpdate
      ];
    }

    data.orders[orderIndex] = {
      ...data.orders[orderIndex],
      ...updates,
      updatedAt: new Date().toISOString()
    };

    await dataManager.saveData(data);
    return data.orders[orderIndex];
  },

  async addCommunication(orderId, communicationData) {
    const data = await dataManager.loadData();
    const order = data.orders?.find(o => o._id === orderId);

    if (!order) {
      throw new Error('Order not found');
    }

    const newCommunication = {
      _id: `comm-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type: 'logistics_update',
      from: 'France',
      to: 'Tunisia',
      ...communicationData,
      timestamp: new Date().toISOString()
    };

    if (!order.communications) {
      order.communications = [];
    }
    order.communications.push(newCommunication);

    const trackingUpdate = {
      status: order.status,
      timestamp: new Date().toISOString(),
      location: communicationData.location || 'France',
      description: communicationData.message || 'Logistics communication update',
      operator: 'France Logistics'
    };

    if (!order.trackingUpdates) {
      order.trackingUpdates = [];
    }
    order.trackingUpdates.push(trackingUpdate);

    order.updatedAt = new Date().toISOString();
    await dataManager.saveData(data);

    return newCommunication;
  },

  async getOrderCommunications(orderId) {
    const orders = await this.getOrders();
    const order = orders.find(o => o._id === orderId);
    return order?.communications || [];
  },

  async updateOrderStatusFromFrance(orderId, newStatus, location, notes) {
    await this.addCommunication(orderId, {
      message: `Order status updated: ${newStatus}`,
      location: location || 'France',
      notes
    });

    return this.updateOrder(orderId, { status: newStatus });
  }
};

export const providerPaymentOps = {
  async getProviderPayments() {
    const data = await dataManager.loadData();
    return data.providerPayments || [];
  },

  async createProviderPayment(paymentData) {
    const data = await dataManager.loadData();

    const newPayment = {
      id: `provider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      providerName: paymentData.providerName,
      totalAmount: Number(paymentData.totalAmount),
      amountPaid: Number(paymentData.amountPaid) || 0,
      remainingAmount: Number(paymentData.totalAmount) - (Number(paymentData.amountPaid) || 0),
      status: paymentData.status || 'pending',
      paymentDate: paymentData.paymentDate || null,
      dueDate: paymentData.dueDate,
      currency: paymentData.currency || 'USD',
      notes: paymentData.notes || '',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    if (!data.providerPayments) {
      data.providerPayments = [];
    }
    data.providerPayments = [...data.providerPayments, newPayment];
    await dataManager.saveData(data);

    return newPayment;
  },

  async updateProviderPayment(paymentId, updates) {
    const data = await dataManager.loadData();
    const paymentIndex = data.providerPayments?.findIndex(p => p.id === paymentId);

    if (paymentIndex === -1 || paymentIndex === undefined) {
      throw new Error('Provider payment not found');
    }

    const currentPayment = data.providerPayments[paymentIndex];
    const updatedPayment = {
      ...currentPayment,
      ...updates,
      remainingAmount: Number(updates.totalAmount || currentPayment.totalAmount) - Number(updates.amountPaid || currentPayment.amountPaid),
      updatedAt: new Date().toISOString()
    };

    if (!updates.status) {
      if (updatedPayment.remainingAmount === 0) {
        updatedPayment.status = 'paid';
      } else if (updatedPayment.amountPaid > 0 && updatedPayment.remainingAmount > 0) {
        updatedPayment.status = 'partially_paid';
      } else {
        updatedPayment.status = 'pending';
      }
    }

    data.providerPayments[paymentIndex] = updatedPayment;
    await dataManager.saveData(data);

    return updatedPayment;
  },

  async deleteProviderPayment(paymentId) {
    const data = await dataManager.loadData();
    const paymentIndex = data.providerPayments?.findIndex(p => p.id === paymentId);

    if (paymentIndex === -1 || paymentIndex === undefined) {
      throw new Error('Provider payment not found');
    }

    data.providerPayments.splice(paymentIndex, 1);
    await dataManager.saveData(data);

    return true;
  },

  async getProviderPaymentById(paymentId) {
    const payments = await this.getProviderPayments();
    return payments.find(p => p.id === paymentId) || null;
  },

  async getProviderPaymentsByStatus(status) {
    const payments = await this.getProviderPayments();
    return payments.filter(p => p.status === status);
  },

  async getProviderPaymentsByProvider(providerName) {
    const payments = await this.getProviderPayments();
    return payments.filter(p => p.providerName.toLowerCase().includes(providerName.toLowerCase()));
  },

  async getOverdueProviderPayments() {
    const payments = await this.getProviderPayments();
    const currentDate = new Date();
    return payments.filter(p => {
      if (!p.dueDate) return false;
      const dueDate = new Date(p.dueDate);
      return dueDate < currentDate && p.status !== 'paid';
    });
  },

  async getProviderPaymentStats() {
    const payments = await this.getProviderPayments();

    const stats = {
      total: payments.length,
      totalAmount: 0,
      totalPaid: 0,
      totalRemaining: 0,
      byStatus: {
        pending: 0,
        partially_paid: 0,
        paid: 0,
        cancelled: 0
      },
      byProvider: {},
      overdue: 0
    };

    for (const payment of payments) {
      stats.totalAmount += payment.totalAmount;
      stats.totalPaid += payment.amountPaid;
      stats.totalRemaining += payment.remainingAmount;

      if (stats.byStatus[payment.status] !== undefined) {
        stats.byStatus[payment.status]++;
      }

      if (!stats.byProvider[payment.providerName]) {
        stats.byProvider[payment.providerName] = {
          totalAmount: 0,
          paid: 0,
          remaining: 0,
          count: 0
        };
      }

      stats.byProvider[payment.providerName].totalAmount += payment.totalAmount;
      stats.byProvider[payment.providerName].paid += payment.amountPaid;
      stats.byProvider[payment.providerName].remaining += payment.remainingAmount;
      stats.byProvider[payment.providerName].count++;
    }

    stats.overdue = (await this.getOverdueProviderPayments()).length;

    return stats;
  }
};

export const categoryOps = {
  async getCategories() {
    const data = await dataManager.loadData();
    return data.categories || { expense: [], income: [] };
  },

  async addCategory(type, categoryName) {
    const data = await dataManager.loadData();
    if (!data.categories) {
      data.categories = { expense: [], income: [] };
    }
    if (!data.categories[type]) {
      data.categories[type] = [];
    }
    if (!data.categories[type].includes(categoryName)) {
      data.categories[type].push(categoryName);
      await dataManager.saveData(data);
    }
    return data.categories[type];
  }
};

export const getAppData = () => dataManager.loadData();

export const initializeAppData = () => dataManager.loadData();

authOps.getUser = async (userId) => {
  const data = await dataManager.loadData();
  const user = data.users?.find(u => u._id === userId);
  if (!user) throw new Error('User not found');
  return user;
};

authOps.getAllUsers = async () => {
  const data = await dataManager.loadData();
  return data.users || [];
};

authOps.changePassword = async (userId, currentPassword, newPassword) => {
  await authOps.updateUserPassword(userId, newPassword);
  return true;
};

paymentOps.addPayment = async (paymentData) => {
  return await paymentOps.createPayment(paymentData);
};

paymentOps.getClientPayments = async (clientId) => {
  return await paymentOps.getPaymentsByClient(clientId);
};

clientOps.addClient = async (clientData) => {
  return await clientOps.createClient(clientData);
};

clientOps.getClient = async (clientId) => {
  console.log('clientOps: getClient called with ID:', clientId);
  try {
    const clients = await clientOps.getClients();
    const client = clients.find(c => c._id === clientId);
    if (!client) {
      console.warn('clientOps: getClient - Client not found for ID:', clientId);
      throw new Error('Client not found');
    }
    console.log('clientOps: getClient - Found client:', client.fullName);
    return client;
  } catch (error) {
    console.error('clientOps: getClient - Error fetching client:', error);
    throw error;
  }
};