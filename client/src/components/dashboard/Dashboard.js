import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';

// Dashboard Components
import SuperAdminDashboard from './SuperAdminDashboard';
import MarketingDashboard from './MarketingDashboard';
import LogisticsDashboard from './LogisticsDashboard';
import TreasurerDashboard from './TreasurerDashboard';

// Feature Components
import UserManagement from '../users/UserManagement';
import ClientManagement from '../clients/ClientManagement';
import OrderManagement from '../orders/OrderManagement';
import PaymentManagement from '../payments/PaymentManagement';
import Settings from '../settings/Settings';

const Dashboard = () => {
  const { user } = useAuth();

  const getDashboardComponent = () => {
    switch (user?.role) {
      case 'super_admin':
        return <SuperAdminDashboard />;
      case 'marketing':
        return <MarketingDashboard />;
      case 'logistics':
        return <LogisticsDashboard />;
      case 'treasurer':
        return <TreasurerDashboard />;
      default:
        return <div>Access Denied</div>;
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
      
      {/* Payment Management - Treasurer, Super Admin */}
      {['super_admin', 'treasurer'].includes(user?.role) && (
        <Route path="payments/*" element={<PaymentManagement />} />
      )}
      
      {/* Settings - All Users */}
      <Route path="settings/*" element={<Settings />} />
      
      {/* Fallback to the main dashboard if no other route matches */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
};

export default Dashboard;
