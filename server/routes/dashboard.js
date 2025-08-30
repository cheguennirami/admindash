const express = require('express');
const Client = require('../models/Client');
const Payment = require('../models/Payment');
const User = require('../models/User');
const { auth } = require('../middleware/auth');

const router = express.Router();

// @route   GET /api/dashboard/stats
// @desc    Get dashboard statistics
// @access  Private
router.get('/stats', auth, async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    // Sample data for dashboard statistics
    const sampleClients = [
      { status: 'pending', confirmation: 'confirmed', sellingPrice: 80, buyingPrice: 50 },
      { status: 'processing', confirmation: 'pending', sellingPrice: 120, buyingPrice: 75 },
      { status: 'completed', confirmation: 'confirmed', sellingPrice: 95, buyingPrice: 60 },
      { status: 'pending', confirmation: 'confirmed', sellingPrice: 110, buyingPrice: 70 },
      { status: 'processing', confirmation: 'confirmed', sellingPrice: 85, buyingPrice: 55 }
    ];

    // Common stats for all roles
    const totalClients = sampleClients.length;
    const totalOrders = sampleClients.filter(c => c.confirmation === 'confirmed').length;

    // Order status breakdown
    const orderStatusBreakdown = [
      { _id: 'pending', count: sampleClients.filter(c => c.status === 'pending').length },
      { _id: 'processing', count: sampleClients.filter(c => c.status === 'processing').length },
      { _id: 'completed', count: sampleClients.filter(c => c.status === 'completed').length }
    ];

    // Confirmation status breakdown
    const confirmationBreakdown = [
      { _id: 'confirmed', count: sampleClients.filter(c => c.confirmation === 'confirmed').length },
      { _id: 'pending', count: sampleClients.filter(c => c.confirmation === 'pending').length }
    ];

    let stats = {
      totalClients,
      totalOrders,
      orderStatusBreakdown,
      confirmationBreakdown
    };

    // Role-specific stats
    if (req.user.role === 'marketing' || req.user.role === 'super_admin') {
      // Marketing stats - calculated from sample data
      const confirmedClients = sampleClients.filter(c => c.confirmation === 'confirmed');
      const totalRevenue = confirmedClients.reduce((sum, c) => sum + c.sellingPrice, 0);
      const totalCost = confirmedClients.reduce((sum, c) => sum + c.buyingPrice, 0);
      const totalProfit = totalRevenue - totalCost;

      const monthlyRevenue = [
        {
          _id: { year: 2024, month: 12 },
          revenue: totalRevenue,
          cost: totalCost,
          profit: totalProfit,
          orders: confirmedClients.length
        }
      ];

      stats.revenue = { totalRevenue, totalCost, totalProfit };
      stats.monthlyRevenue = monthlyRevenue;
    }

    if (req.user.role === 'treasurer' || req.user.role === 'super_admin') {
      // Financial stats - sample data
      const paymentStats = [
        { _id: 'advance', total: 150, count: 3 },
        { _id: 'remaining', total: 200, count: 2 }
      ];

      const monthlyPayments = [
        {
          _id: { year: 2024, month: 12, type: 'advance' },
          total: 150,
          count: 3
        },
        {
          _id: { year: 2024, month: 12, type: 'remaining' },
          total: 200,
          count: 2
        }
      ];

      stats.payments = paymentStats;
      stats.monthlyPayments = monthlyPayments;
    }

    if (req.user.role === 'super_admin') {
      // Admin-specific stats - sample data
      const userStats = [
        { _id: 'super_admin', count: 1, active: 1 },
        { _id: 'marketing', count: 1, active: 1 },
        { _id: 'logistics', count: 1, active: 1 },
        { _id: 'treasurer', count: 1, active: 1 }
      ];

      // Sample recent activity data
      const recentActivity = [
        {
          _id: 'activity-001',
          orderId: 'ORD-001',
          fullName: 'Ahmed Ben Ali',
          confirmation: 'confirmed',
          status: 'pending',
          createdAt: new Date().toISOString(),
          createdBy: { fullName: 'Marketing Manager', role: 'marketing' }
        },
        {
          _id: 'activity-002',
          orderId: 'ORD-002',
          fullName: 'Fatma Trabelsi',
          confirmation: 'pending',
          status: 'processing',
          createdAt: new Date().toISOString(),
          createdBy: { fullName: 'Marketing Manager', role: 'marketing' }
        }
      ];

      stats.users = userStats;
      stats.recentActivity = recentActivity;
    }

    res.json(stats);
  } catch (error) {
    console.error('Get dashboard stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/recent-clients
// @desc    Get recent clients
// @access  Private
router.get('/recent-clients', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 5;

    // Sample recent clients data
    const allRecentClients = [
      {
        _id: 'client-001',
        orderId: 'ORD-001',
        fullName: 'Ahmed Ben Ali',
        phoneNumber: '+216 12 345 678',
        sellingPrice: 80,
        confirmation: 'confirmed',
        status: 'pending',
        createdAt: new Date().toISOString(),
        createdBy: { fullName: 'Marketing Manager' }
      },
      {
        _id: 'client-002',
        orderId: 'ORD-002',
        fullName: 'Fatma Trabelsi',
        phoneNumber: '+216 98 765 432',
        sellingPrice: 120,
        confirmation: 'pending',
        status: 'processing',
        createdAt: new Date().toISOString(),
        createdBy: { fullName: 'Marketing Manager' }
      },
      {
        _id: 'client-003',
        orderId: 'ORD-003',
        fullName: 'Mohamed Sassi',
        phoneNumber: '+216 55 123 456',
        sellingPrice: 95,
        confirmation: 'confirmed',
        status: 'completed',
        createdAt: new Date().toISOString(),
        createdBy: { fullName: 'Marketing Manager' }
      }
    ];

    const recentClients = allRecentClients.slice(0, limit);

    res.json(recentClients);
  } catch (error) {
    console.error('Get recent clients error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/dashboard/pending-orders
// @desc    Get pending orders count
// @access  Private
router.get('/pending-orders', auth, async (req, res) => {
  try {
    const pendingCount = await Client.countDocuments({ confirmation: 'pending' });
    const inProgressCount = await Client.countDocuments({ status: 'in_progress' });
    
    res.json({
      pending: pendingCount,
      inProgress: inProgressCount
    });
  } catch (error) {
    console.error('Get pending orders error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
