const express = require('express');
const { auth, logisticsAccess } = require('../middleware/auth');
const supabase = require('../supabaseClient');

const router = express.Router();

// @route   GET /api/orders
// @desc    Get orders with status tracking (Logistics view)
// @access  Private (Logistics, Super Admin)
router.get('/', auth, logisticsAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    
    let query = {};
    
    // Filter by status
    if (status) {
      query.status = status;
    }

    let dbQuery = supabase.from('clients').select('*');
    if (Object.keys(query).length > 0) {
      if (query.status) {
        dbQuery = dbQuery.eq('status', query.status);
      }
    }

    const { data: orders, error } = await dbQuery;
    if (error) throw error;
    const ordersList = data || [];
    // Manually select fields and sort for Supabase compatibility
    const processedOrders = orders
      .map(order => ({
        id: order.id,
        orderId: order.order_id,
        fullName: order.full_name,
        phoneNumber: order.phone_number,
        buyingPrice: order.buying_price,
        sellingPrice: order.selling_price,
        status: order.status,
        confirmation: order.confirmation,
        createdAt: order.created_at,
        createdBy: order.created_by // Keep createdBy ID for potential manual lookup if needed
      }))
      .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

    // Apply pagination after sorting and selecting
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedOrders = processedOrders.slice(startIndex, endIndex);

    const total = processedOrders.length; // Total after initial filtering, before pagination

    // Get status counts
    const statusCounts = {};
    ordersList.forEach(order => {
      const status = order.status;
      statusCounts[status] = (statusCounts[status] || 0) + 1;
    });

    // Convert to array format
    const statusCountsArray = Object.entries(statusCounts).map(([status, count]) => ({
      _id: status,
      count
    }));

    res.json({
      orders: paginatedOrders,
      totalPages: Math.ceil(total / limit),
      currentPage: parseInt(page),
      total,
      statusCounts: statusCountsArray
    });
  } catch (error) {
    console.error('Get orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status
// @access  Private (Logistics, Super Admin)
router.put('/:id/status', auth, logisticsAccess, async (req, res) => {
  try {
    const { status } = req.body;
    
    if (!status || !['in_progress', 'bought', 'delivered_to_france', 'delivered_to_tunisia', 'delivered_to_client'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const { data: order, error } = await supabase.from('clients').select('*').eq('id', req.params.id).single();
    if (error || !order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    const { data: updatedOrder, error: updateError } = await supabase.from('clients').update({ status }).eq('id', req.params.id).select().single();
    if (updateError) throw updateError;

    res.json(updatedOrder);
  } catch (error) {
    console.error('Update order status error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
