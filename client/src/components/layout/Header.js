import React, { useState } from 'react';
import { Menu, Bell, Search, User } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import sheinLogo from '../../assets/shein-logo.png';

const Header = ({ onMenuClick, user }) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { logout } = useAuth();

  const getRoleDisplayName = (role) => {
    const roleNames = {
      super_admin: 'Super Administrator',
      marketing: 'Marketing Manager',
      logistics: 'Logistics Coordinator',
      treasurer: 'Financial Manager'
    };
    return roleNames[role] || role;
  };

  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        {/* Left side */}
        <div className="flex items-center">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
          >
            <Menu className="h-6 w-6" />
          </button>

          {/* Logo for mobile (hidden on desktop since sidebar shows it) */}
          <div className="lg:hidden flex items-center ml-2">
            <img
              src={sheinLogo}
              alt="Shein TO YOU Logo"
              className="h-8 w-8 object-contain mr-2"
            />
            <h1 className="text-lg font-bold text-gray-900">
              <span className="text-pink-500">Shein</span>{' '}
              <span className="text-teal-500">TO YOU</span>
            </h1>
          </div>

          {/* Search bar */}
          <div className="hidden md:block ml-4">
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search..."
                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
              />
            </div>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center space-x-4">
          {/* Notifications */}
          <button className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-pink-500">
            <Bell className="h-6 w-6" />
          </button>

          {/* Profile dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowProfileMenu(!showProfileMenu)}
              className="flex items-center space-x-3 p-2 text-sm rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-pink-500"
            >
              <div className="h-8 w-8 bg-gradient-to-br from-pink-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-gray-900 font-medium">{user?.fullName}</p>
                <p className="text-gray-500 text-xs">{getRoleDisplayName(user?.role)}</p>
              </div>
            </button>

            {/* Profile dropdown menu */}
            {showProfileMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                <div className="px-4 py-2 border-b border-gray-200">
                  <p className="text-sm font-medium text-gray-900">{user?.fullName}</p>
                  <p className="text-xs text-gray-500">{user?.email}</p>
                </div>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    // Navigate to profile settings
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  <User className="mr-3 h-4 w-4" />
                  Profile Settings
                </button>
                
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    logout();
                  }}
                  className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  <svg className="mr-3 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                  </svg>
                  Sign Out
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile search */}
      <div className="md:hidden px-4 pb-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search..."
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-pink-500 focus:border-pink-500 sm:text-sm"
          />
        </div>
      </div>

      {/* Click outside to close profile menu */}
      {showProfileMenu && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setShowProfileMenu(false)}
        />
      )}
    </header>
  );
};

export default Header;
