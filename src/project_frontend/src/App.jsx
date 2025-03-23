import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { project_backend } from '../../declarations/project_backend';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import './App.css';
import Login from './pages/auth/Login';
import Home from './pages/home/Home';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import VictimDashboard from './pages/victim/VictimDashboard';
import RequestHelp from './pages/request/RequestHelp';
import AdminDashboard from './pages/admin/AdminDashboard';
import Register from './pages/auth/Register';
import AdminLogin from './pages/auth/AdminLogin';
import OrganizationLogin from './pages/auth/OrganizationLogin';
import OrganizationDashboard from './pages/organization/OrganizationDashboard';
import DonorDashboard from './pages/donor/DonorDashboard';

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  // UserDashboard component to handle routing based on user type
  const UserDashboard = ({ currentUser, setIsAuthenticated, setCurrentUser }) => {
    console.log('UserDashboard - currentUser:', currentUser);
    
    if (!currentUser) {
      return <Navigate to="/login" />;
    }

    switch (currentUser.user_type.toLowerCase()) {
      case 'admin':
        return <Navigate to="/admin" />;
      case 'volunteer':
        return <VolunteerDashboard currentUser={currentUser} setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />;
      case 'victim':
        return <VictimDashboard currentUser={currentUser} setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} />;
      case 'organization':
        return <Navigate to="/organization/dashboard" />;
      case 'donor':
        return <Navigate to="/donor/dashboard" />;
      default:
        console.error('Unknown user type:', currentUser.user_type);
        return <Navigate to="/login" />;
    }
  };

  // Protected Route component
  const ProtectedRoute = ({ children }) => {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!isAuthenticated) {
      return <Navigate to="/login" />;
    }
    return children;
  };

  // Admin Route component
  const AdminRoute = ({ children }) => {
    console.log('AdminRoute - isAuthenticated:', isAuthenticated, 'isAdmin:', isAdmin);
    
    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!isAuthenticated || !isAdmin) {
      console.log('Redirecting to login from AdminRoute');
      return <Navigate to="/login" />;
    }
    return children;
  };

  // Organization Route component
  const OrganizationRoute = ({ children }) => {
    if (isLoading) {
      return <div>Loading...</div>;
    }
    if (!isAuthenticated || !currentUser || currentUser.user_type.toLowerCase() !== 'organization') {
      return <Navigate to="/organization/login" />;
    }
    return children;
  };

  const checkAdminStatus = async (email) => {
    try {
      console.log('Checking admin status for:', email);
      setIsLoading(true);
      const adminStatus = await project_backend.is_admin(email);
      console.log('Admin status result:', adminStatus);
      setIsAdmin(adminStatus);
    } catch (err) {
      console.error('Error checking admin status:', err);
      setIsAdmin(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Check admin status when currentUser changes
  useEffect(() => {
    if (currentUser?.email) {
      checkAdminStatus(currentUser.email);
    } else {
      setIsLoading(false);
    }
  }, [currentUser]);

  return (
    <Router>
      <Routes>
        {/* Auth Routes */}
        <Route 
          path="/login" 
          element={
            <Login 
              setIsAuthenticated={setIsAuthenticated} 
              setCurrentUser={setCurrentUser}
              checkAdminStatus={checkAdminStatus}
              isAdmin={isAdmin}
            />
          } 
        />
        <Route path="/register" element={<Register />} />
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route path="/organization/login" element={
          <OrganizationLogin 
            setIsAuthenticated={setIsAuthenticated}
            setCurrentUser={setCurrentUser}
          />
        } />

        {/* Admin Route */}
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminDashboard 
                currentUser={currentUser}
                setIsAuthenticated={setIsAuthenticated}
                setCurrentUser={setCurrentUser}
              />
            </AdminRoute>
          }
        />

        {/* Protected Routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <UserDashboard 
                currentUser={currentUser}
                setIsAuthenticated={setIsAuthenticated}
                setCurrentUser={setCurrentUser}
              />
            </ProtectedRoute>
          }
        />

        <Route 
          path="/victim/dashboard" 
          element={
            <VictimDashboard 
              currentUser={currentUser}
              setIsAuthenticated={setIsAuthenticated}
              setCurrentUser={setCurrentUser}
            />
          } 
        />
        
        <Route 
          path="/volunteer/dashboard" 
          element={
            <VolunteerDashboard 
              currentUser={currentUser}
              setIsAuthenticated={setIsAuthenticated}
              setCurrentUser={setCurrentUser}
            />
          } 
        />
        
        <Route 
          path="/organization/dashboard" 
          element={
            <OrganizationRoute>
              <OrganizationDashboard 
                currentUser={currentUser}
                setIsAuthenticated={setIsAuthenticated}
                setCurrentUser={setCurrentUser}
              />
            </OrganizationRoute>
          }
        />

        <Route 
          path="/donor/dashboard" 
          element={
            <ProtectedRoute>
              <DonorDashboard 
                currentUser={currentUser}
                setIsAuthenticated={setIsAuthenticated}
                setCurrentUser={setCurrentUser}
              />
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
