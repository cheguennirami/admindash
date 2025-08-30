import { neon } from '@neondatabase/serverless';

// Neon Configuration - these will be set by Netlify environment variables
const neonConfig = {
  host: process.env.REACT_APP_NEON_HOST,
  database: process.env.REACT_APP_NEON_DATABASE,
  user: process.env.REACT_APP_NEON_USER,
  password: process.env.REACT_APP_NEON_PASSWORD,
  port: 5432,
  ssl: { rejectUnauthorized: false }
};

// Create the Neon connection
export const sql = neon(`postgresql://${neonConfig.user}:${neonConfig.password}@${neonConfig.host}/${neonConfig.database}?sslmode=require`);

// Database Operations
export const dbOps = {
  // Users
  getUserByEmail: async (email) => {
    try {
      const results = await sql`
        SELECT id, full_name, email, role, is_active, avatar, phone, created_at
        FROM users
        WHERE email = ${email}
      `;
      return results[0] || null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      throw error;
    }
  },

  createUser: async (userData) => {
    try {
      const results = await sql`
        INSERT INTO users (full_name, email, role, is_active)
        VALUES (${userData.fullName}, ${userData.email}, ${'marketing'}, true)
        RETURNING *;
      `;
      return results[0];
    } catch (error) {
      console.error('Error creating user:', error);
      throw error;
    }
  },

  getAllUsers: async () => {
    try {
      return await sql`
        SELECT id, full_name, email, role, is_active, avatar, phone, created_at
        FROM users
        ORDER BY created_at DESC
      `;
    } catch (error) {
      console.error('Error getting all users:', error);
      throw error;
    }
  },

  // Clients
  getClients: async () => {
    try {
      return await sql`
        SELECT id, full_name, email, phone, address, created_at
        FROM clients
        ORDER BY created_at DESC
      `;
    } catch (error) {
      console.error('Error getting clients:', error);
      throw error;
    }
  },

  createClient: async (clientData) => {
    try {
      const results = await sql`
        INSERT INTO clients (full_name, email, phone, address)
        VALUES (${clientData.fullName}, ${clientData.email}, ${clientData.phone}, ${clientData.address})
        RETURNING *;
      `;
      return results[0];
    } catch (error) {
      console.error('Error creating client:', error);
      throw error;
    }
  },

  // Orders
  getOrders: async () => {
    try {
      return await sql`
        SELECT
          o.*,
          c.full_name as client_name
        FROM orders o
        LEFT JOIN clients c ON o.client_id = c.id
        ORDER BY o.created_at DESC
      `;
    } catch (error) {
      console.error('Error getting orders:', error);
      throw error;
    }
  },

  createOrder: async (orderData) => {
    try {
      const results = await sql`
        INSERT INTO orders (
          order_number,
          client_id,
          description,
          amount,
          status,
          created_by
        ) VALUES (
          ${orderData.orderNumber},
          ${orderData.clientId},
          ${orderData.description},
          ${orderData.amount},
          ${'pending'},
          ${orderData.createdBy}
        )
        RETURNING *;
      `;
      return results[0];
    } catch (error) {
      console.error('Error creating order:', error);
      throw error;
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      const results = await sql`
        UPDATE orders
        SET status = ${status}, updated_at = NOW()
        WHERE id = ${orderId}
        RETURNING *;
      `;
      return results[0];
    } catch (error) {
      console.error('Error updating order status:', error);
      throw error;
    }
  },

  // Payments
  getPayments: async () => {
    try {
      return await sql`
        SELECT p.*, c.full_name as client_name
        FROM payments p
        LEFT JOIN clients c ON p.client_id = c.id
        ORDER BY p.created_at DESC
      `;
    } catch (error) {
      console.error('Error getting payments:', error);
      throw error;
    }
  },

  createPayment: async (paymentData) => {
    try {
      const results = await sql`
        INSERT INTO payments (
          order_id,
          client_id,
          amount,
          type,
          category,
          status,
          created_by
        ) VALUES (
          ${paymentData.orderId},
          ${paymentData.clientId},
          ${paymentData.amount},
          ${paymentData.type},
          ${paymentData.category},
          ${'completed'},
          ${paymentData.createdBy}
        )
        RETURNING *;
      `;
      return results[0];
    } catch (error) {
      console.error('Error creating payment:', error);
      throw error;
    }
  }
};

export default dbOps;