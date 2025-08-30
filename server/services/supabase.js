const { createClient } = require('@supabase/supabase-js');
const { v4: uuidv4 } = require('uuid');

class SupabaseService {
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL || 'https://rvauqtjxfqyogoipdsfb.supabase.co';
    this.supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJ2YXVxdGp4ZnF5b2dvaXBkc2ZiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY0ODUzMTEsImV4cCI6MjA3MjA2MTMxMX0.EW8D63TqAWgRFMzUhuarMNDW_oeeyRd_w2Ej3tD92dw';

    if (!this.supabaseUrl || !this.supabaseKey) {
      console.warn('Supabase URL or API Key not configured. Some features may not work.');
    } else {
      this.supabase = createClient(this.supabaseUrl, this.supabaseKey);
    }
  }

  // Initialize database with default structure
  async initializeDatabase() {
    try {
      console.log('Initializing Supabase database...');

      // Use service role for initialization to bypass RLS
      const serviceSupabase = require('../supabaseClient');

      console.log('Default roles are managed as strings in users table');

      // Create default admin user with role as string
      const adminEmail = process.env.ADMIN_EMAIL || 'admin@sheintoyou.com';
      const adminExists = await serviceSupabase
        .from('users')
        .select('id')
        .eq('email', adminEmail)
        .single();

      if (adminExists.error && adminExists.error.code === 'PGRST116') {
        const bcrypt = require('bcryptjs');
        const adminPasswordHash = await bcrypt.hash('AdminPassword123!', 12);

        const { data: adminUser, error } = await serviceSupabase
          .from('users')
          .insert({
            full_name: 'Super Administrator',
            email: adminEmail,
            password: adminPasswordHash,
            role: 'super_admin',
            is_active: true
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating admin user:', error);
          throw error;
        }

        console.log('Admin user created successfully');
      } else {
        console.log('Admin user already exists');
      }

      return { initialized: true };
    } catch (error) {
      console.error('Error initializing database:', error);
      throw error;
    }
  }

  // Test database connection
  async testConnection() {
    try {
      const { data, error } = await this.supabase
        .from('users')
        .select('count')
        .limit(1);

      if (error) {
        throw error;
      }

      console.log('Connected to Supabase successfully');
      return true;
    } catch (error) {
      console.error('Error connecting to Supabase:', error);
      return false;
    }
  }

  // Generic CRUD operations
  async find(collection, query = {}, options = {}) {
    try {
      let dbQuery = this.supabase.from(collection).select('*');

      // Apply filters
      if (Object.keys(query).length > 0) {
        Object.keys(query).forEach(key => {
          const value = query[key];
          if (key === 'id') {
            dbQuery = dbQuery.eq('id', value);
          } else if (typeof value === 'object' && value.$in) {
            dbQuery = dbQuery.in(key.replace('_', ''), value.$in);
          } else {
            dbQuery = dbQuery.eq(key.replace('_', ''), value);
          }
        });
      }

      // Apply sorting
      if (options.sort) {
        const sortKey = Object.keys(options.sort)[0];
        const sortOrder = options.sort[sortKey] === 1 ? false : true; // ascending if 1, descending if -1
        dbQuery = dbQuery.order(sortKey.replace('_', ''), { ascending: !sortOrder });
      }

      // Apply limit
      if (options.limit) {
        dbQuery = dbQuery.limit(options.limit);
      }

      // Apply offset
      if (options.skip) {
        dbQuery = dbQuery.range(options.skip, options.skip + (options.limit || 1000) - 1);
      }

      const { data, error } = await dbQuery;

      if (error) {
        throw error;
      }

      return data || [];
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
      const newItem = {
        ...item,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // Map field names for Supabase
      if (newItem._id) {
        newItem.id = newItem._id;
        delete newItem._id;
      }
      if (newItem.password) {
        newItem.password_hash = newItem.password;
        delete newItem.password;
      }

      const { data, error } = await this.supabase
        .from(collection)
        .insert(newItem)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error creating ${collection}:`, error);
      throw error;
    }
  }

  async update(collection, id, updates) {
    try {
      const updateData = {
        ...updates,
        updated_at: new Date().toISOString()
      };

      // Map field names for Supabase
      if (updateData.password) {
        updateData.password_hash = updateData.password;
        delete updateData.password;
      }

      const { data, error } = await this.supabase
        .from(collection)
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error updating ${collection}:`, error);
      throw error;
    }
  }

  async delete(collection, id) {
    try {
      const { data, error } = await this.supabase
        .from(collection)
        .delete()
        .eq('id', id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      return data;
    } catch (error) {
      console.error(`Error deleting ${collection}:`, error);
      throw error;
    }
  }

  // Find with pagination
  async findWithPagination(collection, query = {}, options = {}) {
    try {
      const { page = 1, limit = 10, sort = {} } = options;

      const from = (page - 1) * limit;
      const to = from + limit - 1;

      let dbQuery = this.supabase
        .from(collection)
        .select('*', { count: 'exact' });

      // Apply filters
      if (Object.keys(query).length > 0) {
        Object.keys(query).forEach(key => {
          const value = query[key];
          if (key === 'id') {
            dbQuery = dbQuery.eq('id', value);
          } else {
            dbQuery = dbQuery.eq(key.replace('_', ''), value);
          }
        });
      }

      // Apply sorting
      if (Object.keys(sort).length > 0) {
        const sortKey = Object.keys(sort)[0];
        const sortOrder = sort[sortKey] === 1 ? false : true;
        dbQuery = dbQuery.order(sortKey.replace('_', ''), { ascending: !sortOrder });
      }

      dbQuery = dbQuery.range(from, to);

      const { data, error, count } = await dbQuery;

      if (error) {
        throw error;
      }

      return {
        items: data || [],
        total: count || 0,
        totalPages: Math.ceil((count || 0) / limit),
        currentPage: page
      };
    } catch (error) {
      console.error(`Error finding ${collection} with pagination:`, error);
      throw error;
    }
  }

  // Aggregation helper for statistics
  async aggregate(collection, pipeline) {
    try {
      // Simple aggregation for common use cases
      if (pipeline.some(stage => stage.$group)) {
        const groupStage = pipeline.find(stage => stage.$group);
        const groupBy = groupStage.$group._id;

        let query = this.supabase.from(collection).select('*');

        // Apply grouping logic
        if (groupBy && groupBy !== 'null') {
          // For now, return all data and handle aggregation in memory
          const { data, error } = await query;

          if (error) {
            throw error;
          }

          const grouped = {};
          (data || []).forEach(item => {
            const key = groupBy === null ? 'all' : item[groupBy];
            if (!grouped[key]) {
              grouped[key] = { _id: key, count: 0 };
            }
            grouped[key].count++;
          });

          return Object.values(grouped);
        }

        // If no grouping, return all data
        const { data, error } = await query;
        if (error) {
          throw error;
        }
        return data || [];
      }

      // Default case
      const { data, error } = await this.supabase.from(collection).select('*');
      if (error) {
        throw error;
      }
      return data || [];
    } catch (error) {
      console.error(`Error aggregating ${collection}:`, error);
      throw error;
    }
  }

  // Count documents
  async count(collection, query = {}) {
    try {
      let dbQuery = this.supabase.from(collection).select('*', { count: 'exact', head: true });

      // Apply filters
      if (Object.keys(query).length > 0) {
        Object.keys(query).forEach(key => {
          const value = query[key];
          if (key === 'id') {
            dbQuery = dbQuery.eq('id', value);
          } else {
            dbQuery = dbQuery.eq(key.replace('_', ''), value);
          }
        });
      }

      const { count, error } = await dbQuery;

      if (error) {
        throw error;
      }

      return count || 0;
    } catch (error) {
      console.error(`Error counting ${collection}:`, error);
      throw error;
    }
  }
}

module.exports = new SupabaseService();