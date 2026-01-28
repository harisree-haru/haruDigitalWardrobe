import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';
import '../styles/Admin.css';

const ManageUsers = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { token } = useContext(AuthContext);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError('');
      const response = await axios.get('/api/users', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      setUsers(response.data.users);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeClass = (role) => {
    return `role-badge role-badge-${role}`;
  };

  return (
    <div className="admin-container">
      <div className="admin-header">
        <h2 className="admin-title">👥 Manage Users</h2>
        <p className="admin-subtitle">View and manage all system users</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      {loading ? (
        <div className="loading-state">
          <p>Loading users...</p>
        </div>
      ) : users.length === 0 ? (
        <div className="empty-state">
          <p className="empty-icon">👤</p>
          <h3>No users found</h3>
        </div>
      ) : (
        <div className="users-table-container">
          <table className="users-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Email</th>
                <th>Username</th>
                <th>Role</th>
                <th>Joined</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {users.map(user => (
                <tr key={user._id} className={!user.isActive ? 'inactive-row' : ''}>
                  <td className="user-name">
                    {user.firstName} {user.lastName}
                  </td>
                  <td>{user.email}</td>
                  <td className="user-username">@{user.username}</td>
                  <td>
                    <span className={getRoleBadgeClass(user.role)}>
                      {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                    </span>
                  </td>
                  <td className="user-date">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td>
                    <span className={`status-badge ${user.isActive ? 'active' : 'inactive'}`}>
                      {user.isActive ? '✓ Active' : '✕ Inactive'}
                    </span>
                  </td>
                  <td className="actions">
                    <button className="btn-view">View</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="users-stats">
            <div className="stat-card">
              <h4>Total Users</h4>
              <p>{users.length}</p>
            </div>
            <div className="stat-card">
              <h4>Customers</h4>
              <p>{users.filter(u => u.role === 'customer').length}</p>
            </div>
            <div className="stat-card">
              <h4>Stylists</h4>
              <p>{users.filter(u => u.role === 'stylist').length}</p>
            </div>
            <div className="stat-card">
              <h4>Admins</h4>
              <p>{users.filter(u => u.role === 'admin').length}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsers;
