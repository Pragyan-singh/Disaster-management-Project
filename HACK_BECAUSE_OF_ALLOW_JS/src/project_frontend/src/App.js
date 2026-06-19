import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import AdminDashboard from './pages/admin/AdminDashboard';
import VictimDashboard from './pages/victim/VictimDashboard';
import VolunteerDashboard from './pages/volunteer/VolunteerDashboard';
import { useState, useEffect } from 'react';
import { project_backend } from '@declarations/project_backend';
import 'leaflet/dist/leaflet.css';
function App() {
    const [isAuthenticated, setIsAuthenticated] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);
    const [currentUser, setCurrentUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    // UserDashboard component to handle routing based on user type
    const UserDashboard = () => {
        console.log('UserDashboard - currentUser:', currentUser);
        if (!currentUser) {
            return <Navigate to="/login"/>;
        }
        switch (currentUser.user_type.toLowerCase()) {
            case 'admin':
                return <Navigate to="/admin"/>;
            case 'volunteer':
                return <VolunteerDashboard currentUser={currentUser}/>;
            case 'victim':
                return <VictimDashboard currentUser={currentUser}/>;
            default:
                console.error('Unknown user type:', currentUser.user_type);
                return <Navigate to="/login"/>;
        }
    };
    // Protected Route component
    const ProtectedRoute = ({ children }) => {
        if (isLoading) {
            return <div>Loading...</div>;
        }
        if (!isAuthenticated) {
            return <Navigate to="/login"/>;
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
            return <Navigate to="/login"/>;
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
        }
        catch (err) {
            console.error('Error checking admin status:', err);
            setIsAdmin(false);
        }
        finally {
            setIsLoading(false);
        }
    };
    // Check admin status when currentUser changes
    useEffect(() => {
        if (currentUser?.email) {
            checkAdminStatus(currentUser.email);
        }
        else {
            setIsLoading(false);
        }
    }, [currentUser]);
    return (<Router>
      <Routes>
        {/* Auth Routes */}
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} setCurrentUser={setCurrentUser} checkAdminStatus={checkAdminStatus} isAdmin={isAdmin}/>}/>
        <Route path="/register" element={<Register />}/>

        {/* Admin Route */}
        <Route path="/admin" element={<AdminRoute>
              <AdminDashboard currentUser={currentUser}/>
            </AdminRoute>}/>

        {/* Protected Routes */}
        <Route path="/" element={<ProtectedRoute>
              <UserDashboard />
            </ProtectedRoute>}/>

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/" replace/>}/>
      </Routes>
    </Router>);
}
export default App;
