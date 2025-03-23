import React, { useState, useEffect } from 'react';
import { project_backend } from '../../../../declarations/project_backend';
import { useNavigate } from 'react-router-dom';
import Header from '../../components/Header';
import './AdminDashboard.css';

const AdminDashboard = ({ currentUser, setIsAuthenticated, setCurrentUser }) => {
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [clearingDatabase, setClearingDatabase] = useState(false);
  const [clearSuccess, setClearSuccess] = useState('');
  const [clearingHelpRequests, setClearingHelpRequests] = useState(false);
  const [clearingVolunteerLocations, setClearingVolunteerLocations] = useState(false);
  const [clearingSupplyBundles, setClearingSupplyBundles] = useState(false);
  const [clearingDonations, setClearingDonations] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    navigate('/login');
  };

  const loadUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('Fetching users...');
      const allUsers = await project_backend.get_all_users();
      console.log('Raw users data:', allUsers);
      
      if (!Array.isArray(allUsers)) {
        console.error('Received non-array data:', allUsers);
        setError('Invalid data format received from server');
        return;
      }
      
      if (allUsers.length === 0) {
        console.log('No users found in the database');
      }
      
      setUsers(allUsers);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteUser = async (email) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        console.log('Attempting to delete user:', email);
        const success = await project_backend.delete_user(email);
        console.log('Delete result:', success);
        
        if (success) {
          setUsers(users.filter(user => user.email !== email));
          console.log('User deleted successfully');
        } else {
          setError('Failed to delete user');
        }
      } catch (err) {
        console.error('Error deleting user:', err);
        setError('Failed to delete user. Please try again.');
      }
    }
  };

  const handleClearDatabase = async () => {
    if (!window.confirm('Are you sure you want to clear the entire database? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingDatabase(true);
      setError('');
      setClearSuccess('');

      const success = await project_backend.clear_database();
      
      if (success) {
        setClearSuccess('Database cleared successfully');
        // Reload the users list
        loadUsers();
      } else {
        setError('Failed to clear database');
      }
    } catch (err) {
      console.error('Error clearing database:', err);
      setError('Failed to clear database: ' + err.message);
    } finally {
      setClearingDatabase(false);
    }
  };

  const handleClearHelpRequests = async () => {
    if (!window.confirm('Are you sure you want to clear all help requests? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingHelpRequests(true);
      setError('');
      setClearSuccess('');

      const success = await project_backend.clear_help_requests();
      
      if (success) {
        setClearSuccess('Help requests cleared successfully');
      } else {
        setError('Failed to clear help requests');
      }
    } catch (err) {
      console.error('Error clearing help requests:', err);
      setError('Failed to clear help requests: ' + err.message);
    } finally {
      setClearingHelpRequests(false);
    }
  };

  const handleClearVolunteerLocations = async () => {
    if (!window.confirm('Are you sure you want to clear all volunteer locations? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingVolunteerLocations(true);
      setError('');
      setClearSuccess('');

      const success = await project_backend.clear_volunteer_locations();
      
      if (success) {
        setClearSuccess('Volunteer locations cleared successfully');
      } else {
        setError('Failed to clear volunteer locations');
      }
    } catch (err) {
      console.error('Error clearing volunteer locations:', err);
      setError('Failed to clear volunteer locations: ' + err.message);
    } finally {
      setClearingVolunteerLocations(false);
    }
  };

  const handleClearSupplyBundles = async () => {
    if (!window.confirm('Are you sure you want to clear all supply bundles? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingSupplyBundles(true);
      setError('');
      setClearSuccess('');

      const success = await project_backend.clear_supply_bundles();
      
      if (success) {
        setClearSuccess('Supply bundles cleared successfully');
      } else {
        setError('Failed to clear supply bundles');
      }
    } catch (err) {
      console.error('Error clearing supply bundles:', err);
      setError('Failed to clear supply bundles: ' + err.message);
    } finally {
      setClearingSupplyBundles(false);
    }
  };

  const handleClearDonations = async () => {
    if (!window.confirm('Are you sure you want to clear all donations? This action cannot be undone.')) {
      return;
    }

    try {
      setClearingDonations(true);
      setError('');
      setClearSuccess('');

      const success = await project_backend.clear_donations();
      
      if (success) {
        setClearSuccess('Donations cleared successfully');
      } else {
        setError('Failed to clear donations');
      }
    } catch (err) {
      console.error('Error clearing donations:', err);
      setError('Failed to clear donations: ' + err.message);
    } finally {
      setClearingDonations(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.user_type.toLowerCase().includes(searchTerm.toLowerCase())
  );

  console.log('Filtered users:', filteredUsers);

  if (loading) {
    return (
      <div className="admin-dashboard">
        <div className="admin-loading">
          <h2>Loading Users...</h2>
          <p>Please wait while we fetch the user data.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="admin-dashboard">
        <div className="admin-error">
          <h2>Error Loading Users</h2>
          <p>{error}</p>
          <button onClick={loadUsers} className="retry-button">
            Retry Loading Users
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <Header onLogout={handleLogout} />
      <div className="dashboard-content">
        <div className="admin-header">
          <h1>Admin Dashboard</h1>
          <div className="admin-controls">
            <div className="admin-search">
              <input
                type="text"
                placeholder="Search users by name, email, or type..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="admin-search-input"
              />
            </div>
            <div className="clear-buttons-container">
              <button
                onClick={handleClearDatabase}
                className="clear-database-btn"
                disabled={clearingDatabase}
              >
                {clearingDatabase ? 'Clearing...' : '🗑️ Clear All Data'}
              </button>
              <button
                onClick={handleClearHelpRequests}
                className="clear-btn help-requests"
                disabled={clearingHelpRequests}
              >
                {clearingHelpRequests ? 'Clearing...' : '🆘 Clear Help Requests'}
              </button>
              <button
                onClick={handleClearVolunteerLocations}
                className="clear-btn volunteer-locations"
                disabled={clearingVolunteerLocations}
              >
                {clearingVolunteerLocations ? 'Clearing...' : '📍 Clear Volunteer Locations'}
              </button>
              <button
                onClick={handleClearSupplyBundles}
                className="clear-btn supply-bundles"
                disabled={clearingSupplyBundles}
              >
                {clearingSupplyBundles ? 'Clearing...' : '📦 Clear Supply Bundles'}
              </button>
              <button
                onClick={handleClearDonations}
                className="clear-btn donations"
                disabled={clearingDonations}
              >
                {clearingDonations ? 'Clearing...' : '💰 Clear Donations'}
              </button>
            </div>
          </div>
        </div>

        {error && <div className="error-message">{error}</div>}
        {clearSuccess && <div className="success-message">{clearSuccess}</div>}

        <div className="users-table-container">
          {filteredUsers.length === 0 ? (
            <div className="no-users">
              <p>No users found. {searchTerm ? 'Try a different search term.' : 'Register some users to get started.'}</p>
            </div>
          ) : (
            <>
              <table className="users-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Type</th>
                    <th>Phone</th>
                    <th>Address</th>
                    <th>Admin</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <>
                      <tr key={user.email}>
                        <td>{user.name || 'N/A'}</td>
                        <td>{user.email || 'N/A'}</td>
                        <td>{user.user_type || 'N/A'}</td>
                        <td>{user.phone || 'N/A'}</td>
                        <td>{user.address || 'N/A'}</td>
                        <td>{user.is_admin ? 'Yes' : 'No'}</td>
                        <td>
                          <button
                            className="admin-action-btn view-btn"
                            onClick={() => setSelectedUser(selectedUser?.email === user.email ? null : user)}
                          >
                            {selectedUser?.email === user.email ? 'Hide' : 'View'}
                          </button>
                          {!user.is_admin && (
                            <button
                              className="admin-action-btn delete-btn"
                              onClick={() => handleDeleteUser(user.email)}
                            >
                              Delete
                            </button>
                          )}
                        </td>
                      </tr>
                      {selectedUser?.email === user.email && (
                        <tr className="user-details-row">
                          <td colSpan="7">
                            <div className="user-details-expanded">
                              <div className="user-details-grid">
                                <div className="detail-item">
                                  <strong>Full Name:</strong>
                                  <span>{user.name || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <strong>Email:</strong>
                                  <span>{user.email || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <strong>User Type:</strong>
                                  <span>{user.user_type || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <strong>Phone Number:</strong>
                                  <span>{user.phone || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <strong>Address:</strong>
                                  <span>{user.address || 'N/A'}</span>
                                </div>
                                <div className="detail-item">
                                  <strong>Admin Status:</strong>
                                  <span>{user.is_admin ? 'Yes' : 'No'}</span>
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  ))}
                </tbody>
              </table>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard; 