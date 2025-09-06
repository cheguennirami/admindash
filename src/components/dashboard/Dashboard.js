import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Dashboard Components
import SuperAdminDashboard from './SuperAdminDashboard';
import LogisticsDashboard from './LogisticsDashboard';
// import MarketingDashboard from './MarketingDashboard'; // Removed as per instructions
// import TreasurerDashboard from './TreasurerDashboard'; // Removed as per instructions

// Feature Components
import UserManagement from '../users/UserManagement';
import ClientManagement from '../clients/ClientManagement';
import OrderManagement from '../orders/OrderManagement';
import PaymentManagement from '../payments/PaymentManagement';
import PaymentOverview from '../payments/PaymentOverview';
import FinancialReports from '../payments/FinancialReports';
import Settings from '../settings/Settings';

const Dashboard = () => {
  const { user } = useAuth();

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'logistics':
        return <LogisticsDashboard />;
      case 'super_admin':
      case 'marketing':
      case 'treasurer':
      default:
        return <SuperAdminDashboard />; // Use SuperAdminDashboard as the generic dashboard
    }
  };

  return (
    <Routes>
      {/* Default route for the user's specific dashboard */}
      <Route index element={getDashboardComponent()} />
      
      {/* User Management - Super Admin Only */}
      {user?.role === 'super_admin' && (
        <Route path="users/*" element={<UserManagement />} />
      )}
      
      {/* Client Management - Marketing, Logistics, Super Admin */}
      {['super_admin', 'marketing', 'logistics'].includes(user?.role) && (
        <Route path="clients/*" element={<ClientManagement />} />
      )}
      
      {/* Order Management - Logistics, Super Admin */}
      {['super_admin', 'logistics'].includes(user?.role) && (
        <Route path="orders/*" element={<OrderManagement />} />
      )}

      {/* Logistics Dashboard - Logistics, Super Admin */}
      {['super_admin', 'logistics'].includes(user?.role) && (
        <Route path="logistics/*" element={<LogisticsDashboard />} />
      )}

      {/* Payment Management - Treasurer, Super Admin */}
      {['super_admin', 'treasurer'].includes(user?.role) && (
        <Route path="payments/*">
          <Route index element={<PaymentOverview />} /> {/* Default for /dashboard/payments */}
          <Route path="overview" element={<PaymentOverview />} />
          <Route path="new" element={<PaymentManagement />} /> {/* Assuming PaymentManagement handles adding new payments */}
          <Route path="reports" element={<FinancialReports />} />
          <Route path="*" element={<PaymentManagement />} /> {/* Fallback for other payment routes */}
        </Route>
      )}
      
      {/* Settings - All Users */}
      <Route path="settings/*" element={<Settings />} />
      
      {/* Fallback to the main dashboard if no other route matches */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default Dashboard;
