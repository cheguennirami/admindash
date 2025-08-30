const express = require('express');
const Client = require('../models/Client');
const { auth, treasurerAccess } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/payments
// @desc    Get all payments
// @access  Private (Treasurer, Super Admin)
router.get('/', auth, treasurerAccess, async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;

    // For now, we'll simulate payments from client data
    // In a real application, this would be a separate Payment model
    const clients = await Client.find();

    const payments = clients.flatMap(client => [
      {
        _id: `payment-${client._id}-advance`,
        type: 'income',
        amount: client.advanceAmount,
        category: 'client_payment',
        description: `Advance payment for order ${client.orderId}`,
        paymentMethod: 'cash',
        status: client.advancePaid ? 'completed' : 'pending',
        relatedOrder: client._id,
        createdAt: client.createdAt,
        clientName: client.fullName
      },
      {
        _id: `payment-${client._id}-remaining`,
        type: 'income',
        amount: client.remainingAmount,
        category: 'client_payment',
        description: `Remaining payment for order ${client.orderId}`,
        paymentMethod: 'cash',
        status: client.remainingPaid ? 'completed' : 'pending',
        relatedOrder: client._id,
        createdAt: client.createdAt,
        clientName: client.fullName
      }
    ]);

    // Apply pagination
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + parseInt(limit);
    const paginatedPayments = payments.slice(startIndex, endIndex);

    res.json({
      payments: paginatedPayments,
      totalPages: Math.ceil(payments.length / limit),
      currentPage: parseInt(page),
      total: payments.length
    });
  } catch (error) {
    console.error('Get payments error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/payments
// @desc    Create new payment
// @access  Private (Treasurer, Super Admin)
router.post('/', auth, treasurerAccess, async (req, res) => {
  try {
    const {
      orderId,
      type,
      amount,
      category,
      description,
      paymentMethod,
      status
    } = req.body;

    // For now, we'll simulate storing this payment
    // In a real application, this would be saved to a database
    const newPayment = {
      _id: `payment-${Date.now()}`,
      orderId,
      type,
      amount: parseFloat(amount),
      category,
      description,
      paymentMethod,
      status,
      createdBy: req.user._id,
      createdAt: new Date().toISOString()
    };

    // If this is a client payment, update the client status
    if (orderId && (category === 'client_payment')) {
      const client = await Client.findOne({ orderId });

      if (client) {
        if (description.toLowerCase().includes('advance')) {
          client.advancePaid = status === 'completed';
        } else if (description.toLowerCase().includes('remaining')) {
          client.remainingPaid = status === 'completed';
        }
        await client.save();
      }
    }

    res.status(201).json({
      message: 'Payment recorded successfully',
      payment: newPayment
    });
  } catch (error) {
    console.error('Create payment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/reports
// @desc    Get financial reports
// @access  Private (Treasurer, Super Admin)
router.get('/reports', auth, treasurerAccess, async (req, res) => {
  try {
    const { period = 'month', startDate, endDate } = req.query;

    const clients = await Client.find();

    // Calculate date range
    const now = new Date();
    let dateFilter = now;

    switch (period) {
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        break;
    }

    if (startDate && endDate) {
      dateFilter = new Date(startDate);
    }

    // Filter clients by date
    const filteredClients = clients.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate >= dateFilter;
    });

    // Calculate financial summary
    const totalIncome = filteredClients.reduce((sum, client) => {
      return sum + (client.sellingPrice || 0);
    }, 0);

    const totalExpenses = filteredClients.reduce((sum, client) => {
      return sum + (client.buyingPrice || 0);
    }, 0);

    const profit = totalIncome - totalExpenses;

    // Calculate category breakdown (placeholder data)
    const categoryBreakdown = [
      { name: 'Client Payments', amount: totalIncome },
      { name: 'Supplier Payments', amount: totalExpenses },
      { name: 'Shipping Costs', amount: totalExpenses * 0.1 },
      { name: 'Commissions', amount: profit * 0.05 }
    ];

    // Payment methods breakdown
    const paymentMethods = [
      { name: 'Cash', amount: totalIncome * 0.6 },
      { name: 'Bank Transfer', amount: totalIncome * 0.3 },
      { name: 'Mobile Payment', amount: totalIncome * 0.1 }
    ];

    // Recent transactions (simulate from clients)
    const recentTransactions = filteredClients.slice(0, 10).map(client => ({
      date: client.createdAt,
      description: `Payment from client ${client.fullName}`,
      category: 'client_payment',
      amount: client.sellingPrice,
      type: 'income'
    }));

    // Monthly trends (placeholder - would need actual payment data over time)
    const monthlyTrends = [
      { month: 'Jan', income: 15000, expenses: 12000, profit: 3000 },
      { month: 'Feb', income: 18000, expenses: 14000, profit: 4000 },
      { month: 'Mar', income: 20000, expenses: 16000, profit: 4000 },
      { month: 'Apr', income: 22000, expenses: 17000, profit: 5000 },
      { month: 'May', income: 25000, expenses: 19000, profit: 6000 },
      { month: 'Jun', income: 28000, expenses: 22000, profit: 6000 }
    ];

    res.json({
      summary: {
        totalIncome,
        totalExpenses,
        netProfit: profit
      },
      categoryBreakdown,
      paymentMethods,
      recentTransactions,
      monthlyTrends,
      period,
      totalClients: filteredClients.length
    });
  } catch (error) {
    console.error('Get reports error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/payments/export
// @desc    Export financial reports
// @access  Private (Treasurer, Super Admin)
router.get('/export', auth, treasurerAccess, async (req, res) => {
  try {
    const { format = 'pdf', period } = req.query;

    // Get the reports data directly by calling our own function
    const clients = await Client.find();
    const now = new Date();
    let dateFilter = now;

    switch (period) {
      case 'week':
        dateFilter = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        dateFilter = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        dateFilter = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case 'year':
        dateFilter = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        break;
    }

    if (req.query.startDate && req.query.endDate) {
      dateFilter = new Date(req.query.startDate);
    }

    const filteredClients = clients.filter(client => {
      const clientDate = new Date(client.createdAt);
      return clientDate >= dateFilter;
    });

    // Calculate financial summary
    const totalIncome = filteredClients.reduce((sum, client) => sum + (client.sellingPrice || 0), 0);

    const totalExpenses = filteredClients.reduce((sum, client) => sum + (client.buyingPrice || 0), 0);

    // Calculate category breakdown (placeholder data)
    const categoryBreakdown = [
      { name: 'Client Payments', amount: totalIncome },
      { name: 'Supplier Payments', amount: totalExpenses },
      { name: 'Shipping Costs', amount: totalExpenses * 0.1 },
      { name: 'Commissions', amount: (totalIncome - totalExpenses) * 0.05 }
    ];

    // Payment methods breakdown
    const paymentMethods = [
      { name: 'Cash', amount: totalIncome * 0.6 },
      { name: 'Bank Transfer', amount: totalIncome * 0.3 },
      { name: 'Mobile Payment', amount: totalIncome * 0.1 }
    ];

    // Recent transactions (simulate from clients)
    const recentTransactions = filteredClients.slice(0, 10).map(client => ({
      date: client.createdAt,
      description: `Payment from client ${client.fullName}`,
      category: 'client_payment',
      amount: client.sellingPrice,
      type: 'income'
    }));

    // Monthly trends (placeholder - would need actual payment data over time)
    const monthlyTrends = [
      { month: 'Jan', income: 15000, expenses: 12000, profit: 3000 },
      { month: 'Feb', income: 18000, expenses: 14000, profit: 4000 },
      { month: 'Mar', income: 20000, expenses: 16000, profit: 4000 },
      { month: 'Apr', income: 22000, expenses: 17000, profit: 5000 },
      { month: 'May', income: 25000, expenses: 19000, profit: 6000 },
      { month: 'Jun', income: 28000, expenses: 22000, profit: 6000 }
    ];

    const reportResponse = {
      summary: {
        totalIncome,
        totalExpenses,
        netProfit: totalIncome - totalExpenses
      },
      categoryBreakdown,
      paymentMethods,
      recentTransactions,
      monthlyTrends,
      period,
      totalClients: filteredClients.length
    };

    // In a real application, you would generate PDF/Excel files here
    // For now, return the data as CSV text
    if (format === 'csv') {
      const csvData = [
        'Date,Description,Category,Amount,Type',
        ...reportResponse.recentTransactions.map(t =>
          `${t.date.split('T')[0]},${t.description},${t.category},${t.amount},${t.type}`
        )
      ].join('\n');

      res.set('Content-Type', 'text/csv');
      res.set('Content-Disposition', `attachment; filename="financial-report-${new Date().toISOString().split('T')[0]}.csv"`);
      res.send(csvData);
    } else {
      // For PDF or Excel, return JSON that frontend can handle
      res.json({
        message: 'Export functionality - PDF/Excel export would be implemented here',
        data: reportResponse
      });
    }
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
