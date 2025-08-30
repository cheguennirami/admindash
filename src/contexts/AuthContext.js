import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { dbOps } from '../services/neon';

const AuthContext = createContext();

// Simple JWT generation (for demo only - use proper JWT library in production)
const generateToken = (userId) => {
  const payload = {
    userId,
    iat: Date.now(),
    exp: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
  };
  return btoa(JSON.stringify(payload)); // Simple base64 encoding
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Removed axios configuration since we're now using direct Neon database queries

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedUser) {
        try {
          // Parse and verify saved user data from localStorage
          const userData = JSON.parse(savedUser);

          // For frontend-only auth, we'll trust the saved data
          // In production, you might want to validate with database on each load
          setUser(userData);
        } catch (error) {
          console.log('Error parsing saved user data, clearing auth');
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setUser(null);
        }
      }
      setLoading(false);
    };

    initializeAuth();
  }, []);

  const login = async (email, password) => {
    try {
      setLoading(true);

      // Query user from Neon database
      const userData = await dbOps.getUserByEmail(email);

      if (!userData) {
        throw new Error('Invalid email or password');
      }

      // Verify password (in a real app, use bcrypt to hash/compare passwords)
      // For now, assuming password is stored in plain text for demo
      if (userData.password !== password) {
        throw new Error('Invalid email or password');
      }

      // Check if user is active
      if (!userData.is_active) {
        throw new Error('Account is deactivated');
      }

      // Generate token
      const tokenData = {
        id: userData.id,
        email: userData.email,
        role: userData.role,
        fullName: userData.full_name
      };

      const token = generateToken(userData.id);

      // Store token and user data
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(tokenData));

      // Set user in state
      setUser(tokenData);

      toast.success(`Welcome back, ${userData.full_name}!`);

      // Small delay to ensure state is set before navigation
      await new Promise(resolve => setTimeout(resolve, 100));

      return { success: true };
    } catch (error) {
      const message = error.message || 'Login failed';
      toast.error(message);
      return { success: false, message };
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Update user in Neon database
      const updatedUser = await dbOps.updateUser(user.id, profileData);

      setUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));

      toast.success('Profile updated successfully');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Profile update failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const changePassword = async (currentPassword, newPassword) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // First verify current password
      const currentUser = await dbOps.getUserByEmail(user.email);
      if (!currentUser || currentUser.password !== currentPassword) {
        throw new Error('Current password is incorrect');
      }

      // Update password in database
      await dbOps.updateUserPassword(user.id, newPassword);

      toast.success('Password changed successfully');
      return { success: true };
    } catch (error) {
      const message = error.message || 'Password change failed';
      toast.error(message);
      return { success: false, message };
    }
  };

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile,
    changePassword
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
