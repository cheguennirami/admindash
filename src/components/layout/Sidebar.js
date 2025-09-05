import React from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  ShoppingCart,
  Truck,
  DollarSign,
  Settings,
  LogOut,
  X,
  Calculator // Added for Financial Report
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import sheinLogo from '../../assets/shein-logo.png';
import { useTranslation } from 'react-i18next';

const Sidebar = ({ isOpen, onClose, user }) => {
  const { logout } = useAuth();
  const location = useLocation();
  const { t } = useTranslation();

  const navigation = [
    {
      name: t('dashboard'),
      href: '/dashboard',
      icon: LayoutDashboard,
      roles: ['super_admin', 'marketing', 'logistics', 'treasurer']
    },
    {
      name: t('user_management'),
      href: '/dashboard/users',
      icon: Users,
      roles: ['super_admin']
    },
    {
      name: t('clients'),
      href: '/dashboard/clients',
      icon: ShoppingCart,
      roles: ['super_admin', 'marketing', 'logistics']
    },
    {
      name: t('orders'),
      href: '/dashboard/orders',
      icon: Truck,
      roles: ['super_admin', 'logistics']
    },
    {
      name: t('france_logistics'),
      href: '/dashboard/logistics',
      icon: Truck,
      roles: ['super_admin', 'logistics']
    },
    {
      name: t('payments'),
      href: '/dashboard/payments/overview', // Changed to overview
      icon: DollarSign,
      roles: ['super_admin', 'treasurer']
    },
    {
      name: t('financial_report'), // New item for Financial Report
      href: '/dashboard/payments/reports',
      icon: Calculator,
      roles: ['super_admin', 'treasurer']
    },
    {
      name: t('settings'),
      href: '/dashboard/settings',
      icon: Settings,
      roles: ['super_admin', 'marketing', 'logistics', 'treasurer']
    }
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(user?.role)
  );

  const handleLogout = () => {
    logout();
    onClose();
  };

  return (
    <>
      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0">
        <div className="flex flex-col flex-grow bg-white border-r border-gray-200 pt-5 pb-4 overflow-y-auto">
          {/* Logo */}
          <div className="flex items-center flex-shrink-0 px-4 mb-8">
            <div className="h-10 w-10 mr-3 flex items-center justify-center">
              <img
                src={sheinLogo}
                alt="Shein TO YOU Logo"
                className="h-10 w-10 object-contain"
              />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900">
                <span className="text-pink-500">Shein</span>{' '}
                <span className="text-teal-500">TO YOU</span>
              </h1>
            </div>
          </div>

          {/* User Info */}
          <div className="px-4 mb-6">
            <div className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-teal-50 rounded-lg">
              <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {t('welcome_back_sidebar')}
                </p>
                <p className="text-sm font-medium text-gray-900 truncate">
                  {user?.fullName} 😊
                </p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-teal-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Logout Button */}
          <div className="px-4 pt-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
              {t('sign_out')}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Sidebar */}
      <div className={`lg:hidden fixed inset-y-0 left-0 z-30 w-64 bg-white transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      }`}>
        <div className="flex flex-col h-full">
          {/* Mobile Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="h-8 w-8 mr-2 flex items-center justify-center">
                <img
                  src={sheinLogo}
                  alt="Shein TO YOU Logo"
                  className="h-8 w-8 object-contain"
                />
              </div>
              <h1 className="text-lg font-bold text-gray-900">
                <span className="text-pink-500">Shein</span>{' '}
                <span className="text-teal-500">TO YOU</span>
              </h1>
            </div>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-gray-100"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          {/* Mobile User Info */}
          <div className="p-4">
            <div className="flex items-center p-3 bg-gradient-to-r from-pink-50 to-teal-50 rounded-lg">
              <div className="h-10 w-10 bg-gradient-to-br from-pink-500 to-teal-500 rounded-full flex items-center justify-center text-white font-semibold text-sm">
                {user?.fullName?.charAt(0)?.toUpperCase()}
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-900">
                  {t('welcome_back_sidebar_mobile', { name: user?.fullName })} 😊
                </p>
                <p className="text-xs text-gray-600 capitalize">
                  {t(user?.role?.replace('_', ' '))}
                </p>
              </div>
            </div>
          </div>

          {/* Mobile Navigation */}
          <nav className="flex-1 px-4 space-y-1">
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href || 
                (item.href !== '/dashboard' && location.pathname.startsWith(item.href));
              
              return (
                <NavLink
                  key={item.name}
                  to={item.href}
                  onClick={onClose}
                  className={`group flex items-center px-3 py-2 text-sm font-medium rounded-lg transition-colors duration-200 ${
                    isActive
                      ? 'bg-gradient-to-r from-pink-500 to-teal-500 text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <item.icon
                    className={`mr-3 h-5 w-5 ${
                      isActive ? 'text-white' : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {item.name}
                </NavLink>
              );
            })}
          </nav>

          {/* Mobile Logout */}
          <div className="p-4 border-t border-gray-200">
            <button
              onClick={handleLogout}
              className="group flex items-center w-full px-3 py-2 text-sm font-medium text-gray-700 rounded-lg hover:bg-red-50 hover:text-red-600 transition-colors duration-200"
            >
              <LogOut className="mr-3 h-5 w-5 text-gray-400 group-hover:text-red-500" />
              {t('sign_out')}
            </button>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
