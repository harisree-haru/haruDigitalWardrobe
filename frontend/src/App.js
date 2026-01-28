import React, { useContext } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import RoleSelector from './pages/RoleSelector';
import CustomerLogin from './pages/CustomerLogin';
import StylistLogin from './pages/StylistLogin';
import AdminLogin from './pages/AdminLogin';
import CustomerDashboard from './pages/CustomerDashboard';
import StylistDashboard from './pages/StylistDashboard';
import AdminDashboard from './pages/AdminDashboard';
import AddOutfit from './pages/AddOutfit';
import ViewOutfits from './pages/ViewOutfits';
import ManageUsers from './pages/ManageUsers';
import './App.css';

const AppRoutes = () => {
  const { token, user, loading } = useContext(AuthContext);

  if (loading) {
    return <div className="loading">Loading...</div>;
  }

  return (
    <Routes>
      {/* Role Selection Page */}
      <Route 
        path="/" 
        element={token ? <Navigate to={`/${user?.role}-dashboard`} /> : <RoleSelector />} 
      />

      {/* Customer Routes */}
      <Route 
        path="/customer-login" 
        element={token ? <Navigate to="/customer-dashboard" /> : <CustomerLogin />} 
      />
      <Route
        path="/customer-dashboard"
        element={
          <PrivateRoute>
            <CustomerDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/add-outfit"
        element={
          <PrivateRoute>
            <AddOutfit />
          </PrivateRoute>
        }
      />
      <Route
        path="/view-outfits"
        element={
          <PrivateRoute>
            <ViewOutfits />
          </PrivateRoute>
        }
      />

      {/* Stylist Routes */}
      <Route 
        path="/stylist-login" 
        element={token ? <Navigate to="/stylist-dashboard" /> : <StylistLogin />} 
      />
      <Route
        path="/stylist-dashboard"
        element={
          <PrivateRoute>
            <StylistDashboard />
          </PrivateRoute>
        }
      />

      {/* Admin Routes */}
      <Route 
        path="/admin-login" 
        element={token ? <Navigate to="/admin-dashboard" /> : <AdminLogin />} 
      />
      <Route
        path="/admin-dashboard"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/manage-users"
        element={
          <PrivateRoute>
            <ManageUsers />
          </PrivateRoute>
        }
      />

      {/* Catch all - redirect to home */}
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
