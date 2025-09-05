import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ClientProvider } from './contexts/ClientContext';
import { PaymentProvider } from './contexts/PaymentContext';
import Login from './components/auth/Login';
import Dashboard from './components/dashboard/Dashboard';
import Layout from './components/layout/Layout';
import LoadingSpinner from './components/common/LoadingSpinner';
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n'; // Import the i18n configuration

// React Router v7 Future Flags for compatibility
const routerOpts = {
  future: {
    v7_startTransition: true,
    v7_relativeSplatPath: true,
  },
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? children : <Navigate to="/login" />;
};

// Public Route Component (redirect if already logged in)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  return user ? <Navigate to="/dashboard" /> : children;
};

function AppContent() {
  return (
    <Router future={routerOpts.future}>
      <div className="App">
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: '#363636',
              color: '#fff',
            },
            success: {
              style: {
                background: '#10b981',
              },
            },
            error: {
              style: {
                background: '#ef4444',
              },
            },
          }}
        />

        <Routes>
          <Route
            path="/login"
            element={
              <PublicRoute>
                <Login />
              </PublicRoute>
            }
          />
          
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />
          
          <Route
            path="/"
            element={<Navigate to="/dashboard" />}
          />
          
          <Route
            path="*"
            element={<Navigate to="/dashboard" />}
          />
        </Routes>
      </div>
    </Router>
  );
}

function App() {
  return (
    <I18nextProvider i18n={i18n}>
      <AuthProvider>
        <ClientProvider>
          <PaymentProvider>
            <AppContent />
          </PaymentProvider>
        </ClientProvider>
      </AuthProvider>
    </I18nextProvider>
  );
}

export default App;
