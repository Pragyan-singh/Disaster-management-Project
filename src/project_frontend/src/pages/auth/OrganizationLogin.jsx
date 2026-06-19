import React, { useState } from 'react';
import { project_backend } from '../../../../declarations/project_backend';
import { useNavigate } from 'react-router-dom';
import './Auth.css';

const OrganizationLogin = ({ setIsAuthenticated, setCurrentUser }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      console.log('Attempting organization login with:', formData.email);
      const success = await project_backend.organization_login(formData.email, formData.password);
      console.log('Organization login result:', success);
      
      if (success) {
        console.log('Login successful, getting user details');
        // Get the user details
        const user = await project_backend.get_user(formData.email);
        console.log('User details:', user);
        
        if (user) {
          if (user.user_type.toLowerCase() !== 'organization') {
            console.error('User is not an organization:', user.user_type);
            setError('Invalid user type. Please use organization login.');
            return;
          }
          
          console.log('Setting authentication state and current user');
          setIsAuthenticated(true);
          setCurrentUser(user);
          console.log('Navigating to organization dashboard');
          navigate('/organization/dashboard');
        } else {
          console.error('Failed to get user details');
          setError('Failed to get user details');
        }
      } else {
        console.error('Login failed: Invalid credentials');
        setError('Invalid email or password');
      }
    } catch (err) {
      console.error('Login error:', err);
      setError('Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-box">
        <h2>Organization Login</h2>
        {error && <div className="error-message">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email:</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              disabled={loading}
            />
          </div>
          <button type="submit" className="auth-button" disabled={loading}>
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OrganizationLogin; 