const express = require('express');
const { body, validationResult } = require('express-validator');
const multer = require('multer');
const { auth, marketingAccess, logisticsAccess } = require('../middleware/auth');
const supabase = require('../supabaseClient');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

// @route   GET /api/clients
// @desc    Get all clients
// @access  Private (Marketing, Logistics, Super Admin)
router.get('/', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, search, status, confirmation } = req.query;

    const query = {};
    if (search) {
      // Supabase supports simple text search, we'll search in fullName for now
      query['full_name'] = search;
    }
    if (status) {
      query['status'] = status;
    }
    if (confirmation) {
      query['confirmation'] = confirmation;
    }

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      sort: { createdAt: -1 } // Sort by creation date, newest first
    };

    const { data: clients, totalPages, currentPage, total } = await Client.findWithPagination(query, options);

    res.json({
      clients,
      totalPages,
      currentPage,
      total
    });
  } catch (error) {
    console.error('Get clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/clients/:id
// @desc    Get single client
// @access  Private
router.get('/:id', auth, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    // If createdBy needs to be displayed, you'd fetch the user here:
    // const createdByUser = await User.findById(client.createdBy);
    // client.createdBy = createdByUser ? { _id: createdByUser._id, fullName: createdByUser.fullName, email: createdByUser.email } : null;

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    res.json(client);
  } catch (error) {
    console.error('Get client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/clients
// @desc    Create new client (Marketing only)
// @access  Private
router.post('/', [
  auth,
  marketingAccess,
  upload.array('screenshots', 5),
  body('fullName').isLength({ min: 2, max: 100 }),
  body('address').isLength({ min: 5, max: 500 }),
  body('phoneNumber').isLength({ min: 8, max: 20 }),
  body('buyingPrice').isNumeric().isFloat({ min: 0 }),
  body('sellingPrice').isNumeric().isFloat({ min: 0 }),
  body('cart').isLength({ min: 1, max: 500 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: errors.array() 
      });
    }

    const {
      fullName,
      address,
      phoneNumber,
      buyingPrice,
      sellingPrice,
      cart,
      description,
      confirmation
    } = req.body;

    // Handle file uploads (simplified - in production use cloud storage)
    const screenshots = [];
    if (req.files && req.files.length > 0) {
      req.files.forEach((file, index) => {
        screenshots.push({
          url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
          filename: file.originalname,
          uploadedAt: new Date()
        });
      });
    }

    const newClientData = {
      fullName,
      address,
      phoneNumber,
      buyingPrice: parseFloat(buyingPrice),
      sellingPrice: parseFloat(sellingPrice),
      cart,
      description: description || '',
      confirmation: confirmation || 'pending',
      status: 'in_progress', // Default status
      advancePaid: false,
      remainingPaid: false,
      screenshots,
      createdBy: req.user.id,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const client = await Client.create(newClientData);

    res.status(201).json({
      message: 'Client created successfully',
      client
    });
  } catch (error) {
    console.error('Create client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/clients/:id
// @desc    Update client
// @access  Private
router.put('/:id', [
  auth,
  upload.array('screenshots', 5),
  body('fullName').optional().isLength({ min: 2, max: 100 }),
  body('address').optional().isLength({ min: 5, max: 500 }),
  body('phoneNumber').optional().isLength({ min: 8, max: 20 }),
  body('buyingPrice').optional().isNumeric().isFloat({ min: 0 }),
  body('sellingPrice').optional().isNumeric().isFloat({ min: 0 })
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ 
        message: 'Invalid input', 
        errors: errors.array() 
      });
    }

    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    // Check permissions
    if (req.user.role === 'logistics') {
      // Logistics can only update status
      const { status } = req.body;
      if (status) {
        client.status = status;
      }
    } else if (req.user.role === 'marketing' || req.user.role === 'super_admin') {
      // Marketing and Super Admin can update all fields
      const {
        fullName,
        address,
        phoneNumber,
        buyingPrice,
        sellingPrice,
        cart,
        description,
        confirmation,
        status
      } = req.body;

      if (fullName) client.fullName = fullName;
      if (address) client.address = address;
      if (phoneNumber) client.phoneNumber = phoneNumber;
      if (buyingPrice) client.buyingPrice = parseFloat(buyingPrice);
      if (sellingPrice) client.sellingPrice = parseFloat(sellingPrice);
      if (cart) client.cart = cart;
      if (description !== undefined) client.description = description;
      if (confirmation) client.confirmation = confirmation;
      if (status) client.status = status;

      // Handle new screenshots
      if (req.files && req.files.length > 0) {
        const newScreenshots = [];
        req.files.forEach((file) => {
          newScreenshots.push({
            url: `data:${file.mimetype};base64,${file.buffer.toString('base64')}`,
            filename: file.originalname,
            uploadedAt: new Date()
          });
        });
        client.screenshots = [...client.screenshots, ...newScreenshots];
      }
    }

    client.updatedAt = new Date().toISOString(); // Update the updatedAt timestamp
    const updatedClient = await Client.findByIdAndUpdate(req.params.id, client);
    // If createdBy needs to be displayed, you'd fetch the user here:
    // const createdByUser = await User.findById(updatedClient.createdBy);
    // updatedClient.createdBy = createdByUser ? { _id: createdByUser._id, fullName: createdByUser.fullName, email: createdByUser.email } : null;

    res.json(updatedClient);
  } catch (error) {
    console.error('Update client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   DELETE /api/clients/:id
// @desc    Delete client (Marketing and Super Admin only)
// @access  Private
router.delete('/:id', auth, marketingAccess, async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);

    if (!client) {
      return res.status(404).json({ message: 'Client not found' });
    }

    await Client.findByIdAndDelete(req.params.id);

    res.json({ message: 'Client deleted successfully' });
  } catch (error) {
    console.error('Delete client error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
