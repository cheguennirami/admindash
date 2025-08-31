import React, { createContext, useContext, useState, useEffect } from 'react';
import toast from 'react-hot-toast';
import { authOps, initializeAppData } from '../services/jsonbin-new';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const savedUser = localStorage.getItem('user');

      // Initialize data from JSONBin if available
      await initializeAppData();

      if (savedUser) {
        try {
          // Parse saved user data from localStorage
          const userData = JSON.parse(savedUser);
          setUser(userData);
        } catch (error) {
          console.log('Error parsing saved user data, clearing auth');
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

      // Authenticate user with JSONBin
      const userData = await authOps.login(email, password);
      
      // Store user data in localStorage
      localStorage.setItem('user', JSON.stringify(userData));
      
      // Set user in state
      setUser(userData);
      
      toast.success(`Welcome back, ${userData.full_name}!`);
      
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
    localStorage.removeItem('user');
    setUser(null);
    toast.success('Logged out successfully');
  };

  const updateProfile = async (profileData) => {
    try {
      if (!user) {
        throw new Error('No user logged in');
      }

      // Update user in JSONBin database
      const updatedUser = await authOps.updateUser(user._id, profileData);
      
      // Update local state and storage
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

  const value = {
    user,
    loading,
    login,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};