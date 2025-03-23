import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { project_backend } from '@declarations/project_backend';
import './Auth.css';
const Login = ({ setIsAuthenticated, setCurrentUser, checkAdminStatus }) => {
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: '',
        password: '',
        userType: 'victim'
    });
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value
        }));
        // Clear messages when user starts typing
        setError('');
        setSuccess('');
    };
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            console.log('Attempting login for email:', formData.email, 'with user type:', formData.userType);
            // Get user data from the backend
            const user = await project_backend.get_user(formData.email);
            console.log('Raw user response:', JSON.stringify(user, null, 2));
            console.log('User type:', typeof user);
            if (!user) {
                console.error('User not found');
                setError('Invalid email or password. Please try again.');
                setIsLoading(false);
                return;
            }
            // Verify password first
            const isPasswordValid = await project_backend.verify_password(formData.email, formData.password);
            console.log('Password verification result:', isPasswordValid);
            if (!isPasswordValid) {
                console.error('Invalid password');
                setError('Invalid email or password. Please try again.');
                setIsLoading(false);
                return;
            }
            // Set the current user and authentication status
            setCurrentUser({
                email: formData.email,
                name: user.name || 'User',
                user_type: user.user_type || formData.userType.toLowerCase(), // Use backend user type if available, fallback to form
                phone: user.phone || '',
                address: user.address || '',
                is_admin: user.is_admin || false
            });
            setIsAuthenticated(true);
            // Check if user is admin
            console.log('Checking admin status...');
            const adminStatus = await project_backend.is_admin(formData.email);
            console.log('Admin status:', adminStatus);
            // Update admin status in the app
            await checkAdminStatus(formData.email);
            setSuccess('Login successful! Redirecting...');
            // Add a small delay to show the success message
            setTimeout(() => {
                // Redirect based on user type
                if (adminStatus) {
                    console.log('Redirecting to admin dashboard');
                    navigate('/admin', { replace: true });
                }
                else {
                    console.log('Redirecting to user dashboard');
                    navigate('/', { replace: true });
                }
            }, 1500);
        }
        catch (err) {
            console.error('Login error:', err);
            console.error('Error details:', {
                name: err.name,
                message: err.message,
                stack: err.stack
            });
            setError('Failed to login. Please try again. Error: ' + err.message);
        }
        finally {
            setIsLoading(false);
        }
    };
    const handleAdminClick = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');
        setIsLoading(true);
        try {
            console.log('Attempting admin login...');
            const adminEmail = "admin@disasterrelief.com";
            const adminPassword = "admin123";
            // Verify admin credentials
            const isPasswordValid = await project_backend.verify_password(adminEmail, adminPassword);
            if (!isPasswordValid) {
                console.error('Admin authentication failed');
                setError('Failed to authenticate as admin. Please try again.');
                setIsLoading(false);
                return;
            }
            // Get user data from the backend
            console.log('Fetching admin user data...');
            const user = await project_backend.get_user(adminEmail);
            console.log('Raw admin user response:', JSON.stringify(user, null, 2));
            console.log('Admin user type:', typeof user);
            if (!user) {
                console.error('Admin user not found');
                setError('Admin account not found. Please contact support.');
                setIsLoading(false);
                return;
            }
            // Check admin status first
            console.log('Verifying admin status...');
            const adminStatus = await project_backend.is_admin(adminEmail);
            console.log('Admin status:', adminStatus);
            if (!adminStatus) {
                console.error('Admin status verification failed');
                setError('Failed to verify admin status. Please try again.');
                setIsLoading(false);
                return;
            }
            setSuccess('Admin login successful! Redirecting to dashboard...');
            // Set authentication state
            setCurrentUser({
                email: adminEmail,
                name: user.name || 'Admin User',
                user_type: user.user_type || 'admin',
                phone: user.phone || '',
                address: user.address || '',
                is_admin: true
            });
            setIsAuthenticated(true);
            // Update admin status in parent component
            await checkAdminStatus(adminEmail);
            // Add a small delay to show the success message
            setTimeout(() => {
                console.log('Admin verified, redirecting to dashboard');
                navigate('/admin', { replace: true });
            }, 1500);
        }
        catch (err) {
            console.error('Admin login error:', err);
            setError('Failed to login as admin. Please try again.');
        }
        finally {
            setIsLoading(false);
        }
    };
    return (<div className="auth-container">
      <div className="auth-card">
        <h2>Welcome Back</h2>
        <p className="auth-subtitle">Please login to your account</p>
        
        {error && <div className="auth-error">{error}</div>}
        {success && <div className="auth-success">{success}</div>}
        
        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="userType">I am a:</label>
            <select id="userType" name="userType" value={formData.userType} onChange={handleChange} className="form-control" disabled={isLoading}>
              <option value="victim">Victim</option>
              <option value="volunteer">Volunteer</option>
              <option value="organization">Organization</option>
              <option value="donor">Donor</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input type="email" id="email" name="email" value={formData.email} onChange={handleChange} className="form-control" required disabled={isLoading}/>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input type="password" id="password" name="password" value={formData.password} onChange={handleChange} className="form-control" required disabled={isLoading}/>
          </div>

          <div className="button-group">
            <button type="submit" className="auth-button" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login'}
            </button>
            <button type="button" onClick={handleAdminClick} className="admin-button" disabled={isLoading}>
              {isLoading ? 'Logging in...' : 'Login as Admin'}
            </button>
          </div>
        </form>

        <div className="auth-links">
          <Link to="/forgot-password" className="auth-link">
            Forgot Password?
          </Link>
          <p className="auth-switch">
            Don't have an account?{' '}
            <Link to="/register" className="auth-link">
              Register
            </Link>
          </p>
        </div>
      </div>
    </div>);
};
export default Login;
