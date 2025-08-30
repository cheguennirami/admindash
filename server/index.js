const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');
require('dotenv').config();

// Import JSONBin service AFTER environment variables are loaded
const jsonbin = require('./services/jsonbin');



const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const clientRoutes = require('./routes/clients');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const dashboardRoutes = require('./routes/dashboard');

const app = express();

// Trust proxy for rate limiting
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? ['https://admindash-production.up.railway.app']
    : ['http://localhost:3000', 'http://localhost:5000'],
  credentials: true
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Static file serving for React app
app.use(express.static('public'));

console.log('Static files being served from:', path.join(__dirname, 'public'));
console.log('Current working directory:', process.cwd());
console.log('Directory contents:', require('fs').readdirSync('.'));

// Check if index.html exists
const indexPath = path.join(__dirname, 'public', 'index.html');
console.log('index.html path:', indexPath);
console.log('index.html exists:', require('fs').existsSync(indexPath));

// Request logging middleware
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/clients', clientRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check with debug info
app.get('/api/health', (req, res) => {
  const healthCheck = {
    status: 'OK',
    message: 'Shein TO YOU API is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV,
    port: process.env.PORT || 5000,
    jsonbin_config: {
      api_key_exists: !!process.env.JSONBIN_API_KEY,
      bin_id_exists: !!process.env.JSONBIN_BIN_ID
    }
  };
  res.json(healthCheck);
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ 
    message: 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err.message : {}
  });
});

// Serve React app for all non-API routes (client-side routing support)
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api')) {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
  } else {
    res.status(404).json({ message: 'API route not found' });
  }
});

// Initialize JSONBin database
const initializeDatabase = async () => {
  try {
    await jsonbin.initializeDatabase();
    console.log('Connected to JSONBin');
  } catch (error) {
    console.error('JSONBin connection error:', error);
    console.log('Please check your JSONBIN_API_KEY and JSONBIN_BIN_ID in .env file');
  }
};

initializeDatabase();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
