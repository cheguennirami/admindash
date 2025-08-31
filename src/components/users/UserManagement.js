import React, { useState, useEffect } from 'react';
import AddUserModal from './AddUserModal';
import EditUserModal from './EditUserModal';
import { useAuth } from '../../contexts/AuthContext'; // Import useAuth hook
import { authOps } from '../../services/jsonbin-new'; // Import JSONBin operations
import LoadingSpinner from '../common/LoadingSpinner';

const UserManagement = () => {
  const { user } = useAuth(); // Get current user to check if super admin
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false); // State for edit modal
  const [selectedUser, setSelectedUser] = useState(null); // State to hold user being edited
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const usersList = await authOps.getUsers();
      setUsers(usersList);
      console.log('✅ Fetched', usersList.length, 'users from JSONBin');
    } catch (err) {
      const errorMessage = err.message || 'Failed to fetch users.';
      setError(errorMessage);
      console.error('❌ Failed to fetch users:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []); // Remove token dependency since we use local storage

  const handleAddUser = async (userData) => {
    try {
      setError('');
      const newUser = await authOps.createUser(userData);
      setUsers((prevUsers) => [...prevUsers, newUser]);
      console.log('✅ User added to JSONBin:', newUser.full_name);
      return Promise.resolve();
    } catch (err) {
      const errorMessage = err.message || 'Failed to add user.';
      setError(errorMessage);
      console.error('❌ Failed to add user:', err);
      return Promise.reject(new Error(errorMessage));
    }
  };

  const handleEditUser = async (id, userData) => {
    try {
      setError('');
      const updatedUser = await authOps.updateUser(id, userData);
      setUsers((prevUsers) => prevUsers.map((user) => (user._id === id ? updatedUser : user)));
      console.log('✅ User updated in JSONBin:', updatedUser.full_name);
      return Promise.resolve();
    } catch (err) {
      const errorMessage = err.message || 'Failed to update user.';
      setError(errorMessage);
      console.error('❌ Failed to update user:', err);
      return Promise.reject(new Error(errorMessage));
    }
  };

  const handleDeleteUser = async (id) => {
    // Only allow super admin to delete users
    if (user?.role !== 'super_admin') {
      setError('Only super administrators can delete users.');
      return;
    }

    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        setError('');
        await authOps.deleteUser(id);
        setUsers((prevUsers) => prevUsers.filter((user) => user._id !== id));
        console.log('✅ User deleted from JSONBin:', id);
      } catch (err) {
        const errorMessage = err.message || 'Failed to delete user.';
        setError(errorMessage);
        console.error('❌ Failed to delete user:', err);
      }
    }
  };

  const openEditModal = (user) => {
    setSelectedUser(user);
    setIsEditModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 bg-indigo-600 text-white font-medium rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            Add New User
          </button>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Full Name
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                      No users found.
                    </td>
                  </tr>
                ) : (
                  users.map((user) => (
                    <tr key={user._id}>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {user.fullName}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 capitalize">
                        {user.role.replace('_', ' ')}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <button
                          onClick={() => openEditModal(user)}
                          className="text-indigo-600 hover:text-indigo-900 mr-4"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteUser(user._id)}
                          className="text-red-600 hover:text-red-900"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onAddUser={handleAddUser}
      />

      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onEditUser={handleEditUser}
          user={selectedUser}
        />
      )}
    </div>
  );
};

export default UserManagement;
