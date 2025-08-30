const axios = require('axios');

class JSONBinService {
  constructor() {
    this.apiKey = process.env.JSONBIN_API_KEY;
    this.binId = process.env.JSONBIN_BIN_ID;

    if (!this.apiKey || !this.binId) {
      console.warn('JSONBin API Key or Bin ID not configured. Some features may not work.');
    } else {
      this.apiUrl = `https://api.jsonbin.io/v3/b/${this.binId}`;
      this.headers = {
        'Content-Type': 'application/json',
        'X-Access-Key': this.apiKey
      };
    }
  }

  // Initialize database with default structure
  async initializeDatabase() {
    try {
      console.log('Initializing JSONBin database...');

      // Check if bin exists and has data
      const existingData = await this.getAll();

      if (!existingData || !existingData.users || existingData.users.length === 0) {
        // Initialize with empty structure
        const initialData = {
          users: [],
          clients: [],
          orders: [],
          payments: []
        };

        await axios.put(this.apiUrl, initialData, { headers: this.headers });
        console.log('JSONBin database initialized');
      }

      return { initialized: true };
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Get all data from the bin
  async getAll() {
    try {
      const response = await axios.get(this.apiUrl, { headers: this.headers });
      return response.data.record;
    } catch (error) {
      console.error('Error getting data from JSONBin:', error);
      return null;
    }
  }

  // Update entire bin
  async updateAll(data) {
    try {
      const updatedData = {
        users: data.users || [],
        clients: data.clients || [],
        orders: data.orders || [],
        payments: data.payments || []
      };

      const response = await axios.put(this.apiUrl, updatedData, { headers: this.headers });
      return response.data.record;
    } catch (error) {
      console.error('Error updating JSONBin data:', error);
      throw error;
    }
  }

  // Generic CRUD operations
  async find(collection, query = {}, options = {}) {
    try {
      const allData = await this.getAll();
      if (!allData || !allData[collection]) {
        return [];
      }

      let collectionData = [...allData[collection]];

      // Apply filters
      if (Object.keys(query).length > 0) {
        Object.keys(query).forEach(key => {
          const value = query[key];
          if (key === 'id') {
            collectionData = collectionData.filter(item => item.id === value);
          } else {
            collectionData = collectionData.filter(item => item[key] === value);
          }
        });
      }

      // Apply sorting
      if (options.sort) {
        const sortKey = Object.keys(options.sort)[0];
        const sortOrder = options.sort[sortKey] === 1 ? -1 : 1;
        collectionData.sort((a, b) => {
          if (sortOrder === 1) {
            return a[sortKey] > b[sortKey] ? 1 : -1;
          } else {
            return a[sortKey] < b[sortKey] ? 1 : -1;
          }
        });
      }

      // Apply limit
      if (options.limit) {
        collectionData = collectionData.slice(0, options.limit);
      }

      return collectionData;
    } catch (error) {
      console.error(`Error finding ${collection}:`, error);
      throw error;
    }
  }

  async findOne(collection, query) {
    try {
      const items = await this.find(collection, query, { limit: 1 });
      return items[0] || null;
    } catch (error) {
      console.error(`Error finding one ${collection}:`, error);
      throw error;
    }
  }

  async findById(collection, id) {
    return await this.findOne(collection, { id: id });
  }

  async create(collection, item) {
    try {
      const allData = await this.getAll();
      const collectionData = allData[collection] || [];

      // Generate ID if not provided
      if (!item.id) {
        const nextId = `usr_${String(collectionData.length + 1).padStart(3, '0')}`;
        item.id = nextId;
      }

      // Set createdAt
      item.createdAt = new Date().toISOString();

      collectionData.push(item);

      // Find the collection setting
      if (collection === 'users' && item.id.startsWith('usr_')) {
        // Keep sequential IDs for users
      }

      const updatedData = {
        ...allData,
        [collection]: collectionData
      };

      const result = await this.updateAll(updatedData);
      return item;
    } catch (error) {
      console.error(`Error creating ${collection}:`, error);
      throw error;
    }
  }

  async update(collection, id, updates) {
    try {
      const allData = await this.getAll();
      const collectionData = allData[collection] || [];

      const itemIndex = collectionData.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      // Merge updates
      collectionData[itemIndex] = {
        ...collectionData[itemIndex],
        ...updates,
        updatedAt: new Date().toISOString()
      };

      const updatedData = {
        ...allData,
        [collection]: collectionData
      };

      await this.updateAll(updatedData);
      return collectionData[itemIndex];
    } catch (error) {
      console.error(`Error updating ${collection}:`, error);
      throw error;
    }
  }

  async delete(collection, id) {
    try {
      const allData = await this.getAll();
      const collectionData = allData[collection] || [];

      const itemIndex = collectionData.findIndex(item => item.id === id);
      if (itemIndex === -1) {
        throw new Error('Item not found');
      }

      const deletedItem = collectionData.splice(itemIndex, 1)[0];

      const updatedData = {
        ...allData,
        [collection]: collectionData
      };

      await this.updateAll(updatedData);
      return deletedItem;
    } catch (error) {
      console.error(`Error deleting ${collection}:`, error);
      throw error;
    }
  }

  // Test connection
  async testConnection() {
    try {
      const data = await this.getAll();
      console.log('Connected to JSONBin successfully');
      return true;
    } catch (error) {
      console.error('Error connecting to JSONBin:', error);
      return false;
    }
  }

  // Find with pagination
  async findWithPagination(collection, query = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = {} } = options;

      const collectionData = await this.find(collection, query, { sort, limit: 0 });
      const total = collectionData.length;

      const from = (page - 1) * limit;
      const to = from + limit;
      const items = collectionData.slice(from, to);

      return {
        items,
        total,
        totalPages: Math.ceil(total / limit),
        currentPage: page
      };
    } catch (error) {
      console.error(`Error finding ${collection} with pagination:`, error);
      throw error;
    }
  }

  // Count documents
  async count(collection, query = {}) {
    try {
      const collectionData = await this.find(collection, query, { limit: 0 });
      return collectionData.length;
    } catch (error) {
      console.error(`Error counting ${collection}:`, error);
      throw error;
    }
  }

  // Aggregate helper
  async aggregate(collection, pipeline) {
    try {
      if (pipeline.some(stage => stage.$group)) {
        const groupStage = pipeline.find(stage => stage.$group);
        const groupBy = groupStage.$group._id;

        if (groupBy === null) {
          // Count documents
          const count = await this.count(collection, {});
          return [{ _id: null, count }];
        }

        const data = await this.find(collection, {});
        const grouped = {};

        data.forEach(item => {
          const key = groupBy === null ? 'all' : item[groupBy];
          if (!grouped[key]) {
            grouped[key] = { _id: key, count: 0 };
          }
          grouped[key].count++;
        });

        return Object.values(grouped);
      }

      return await this.find(collection, {});
    } catch (error) {
      console.error(`Error aggregating ${collection}:`, error);
      throw error;
    }
  }
}

module.exports = new JSONBinService();