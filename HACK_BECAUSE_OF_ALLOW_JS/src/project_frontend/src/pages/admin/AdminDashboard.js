import React, { useState, useEffect } from 'react';
import { project_backend } from '@declarations/project_backend';
import './AdminDashboard.css';
const AdminDashboard = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedUser, setSelectedUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    useEffect(() => {
        loadUsers();
    }, []);
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
        }
        catch (err) {
            console.error('Error loading users:', err);
            setError('Failed to load users. Please try again.');
        }
        finally {
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
                }
                else {
                    setError('Failed to delete user');
                }
            }
            catch (err) {
                console.error('Error deleting user:', err);
                setError('Failed to delete user. Please try again.');
            }
        }
    };
    const filteredUsers = users.filter(user => user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.user_type.toLowerCase().includes(searchTerm.toLowerCase()));
    console.log('Filtered users:', filteredUsers);
    if (loading) {
        return (<div className="admin-dashboard">
        <div className="admin-loading">
          <h2>Loading Users...</h2>
          <p>Please wait while we fetch the user data.</p>
        </div>
      </div>);
    }
    if (error) {
        return (<div className="admin-dashboard">
        <div className="admin-error">
          <h2>Error Loading Users</h2>
          <p>{error}</p>
          <button onClick={loadUsers} className="retry-button">
            Retry Loading Users
          </button>
        </div>
      </div>);
    }
    return (<div className="admin-dashboard">
      <div className="admin-header">
        <h1>Admin Dashboard</h1>
        <div className="admin-search">
          <input type="text" placeholder="Search users by name, email, or type..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="admin-search-input"/>
        </div>
      </div>

      <div className="admin-content">
        <div className="users-table-container">
          {filteredUsers.length === 0 ? (<div className="no-users">
              <p>No users found. {searchTerm ? 'Try a different search term.' : 'Register some users to get started.'}</p>
            </div>) : (<table className="users-table">
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
                {filteredUsers.map((user) => (<tr key={user.email}>
                    <td>{user.name || 'N/A'}</td>
                    <td>{user.email || 'N/A'}</td>
                    <td>{user.user_type || 'N/A'}</td>
                    <td>{user.phone || 'N/A'}</td>
                    <td>{user.address || 'N/A'}</td>
                    <td>{user.is_admin ? 'Yes' : 'No'}</td>
                    <td>
                      <button className="admin-action-btn view-btn" onClick={() => setSelectedUser(user)}>
                        View
                      </button>
                      {!user.is_admin && (<button className="admin-action-btn delete-btn" onClick={() => handleDeleteUser(user.email)}>
                          Delete
                        </button>)}
                    </td>
                  </tr>))}
              </tbody>
            </table>)}
        </div>
      </div>

      {selectedUser && (<div className="user-modal">
          <div className="modal-content">
            <h2>User Details</h2>
            <div className="user-details">
              <p><strong>Name:</strong> {selectedUser.name || 'N/A'}</p>
              <p><strong>Email:</strong> {selectedUser.email || 'N/A'}</p>
              <p><strong>Type:</strong> {selectedUser.user_type || 'N/A'}</p>
              <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
              <p><strong>Address:</strong> {selectedUser.address || 'N/A'}</p>
              <p><strong>Admin Status:</strong> {selectedUser.is_admin ? 'Yes' : 'No'}</p>
            </div>
            <button className="close-modal-btn" onClick={() => setSelectedUser(null)}>
              Close
            </button>
          </div>
        </div>)}
    </div>);
};
export default AdminDashboard;
