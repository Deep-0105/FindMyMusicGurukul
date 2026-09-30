import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { GuruProvider, useGuru } from './context/GuruContext';
import ROUTES from './route/routes';
import GuruHomePage from './components/findmyguru/GuruHomePage';
import SearchListingPage from './components/findmyguru/SearchListingPage';
import GuruProfilePage from './components/findmyguru/GuruProfilePage';
import ClassAdminDashboard from './components/findmyguru/ClassAdminDashboard';
import SuperAdminDashboard from './components/findmyguru/SuperAdminDashboard';
import LoginPage from './components/findmyguru/LoginPage';
import RegisterPage from './components/findmyguru/RegisterPage';

const ProtectedRoute = ({ allowedRoles, children }) => {
  const { currentUser, currentRole } = useGuru();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const userRole = (currentUser.role || '').toLowerCase();
  const activeRole = (currentRole || '').toUpperCase();

  const isSuperAdmin = userRole === 'superadmin' || activeRole === 'SUPER_ADMIN';
  const isClassAdmin = userRole === 'admin' || userRole === 'class_admin' || activeRole === 'CLASS_ADMIN' || isSuperAdmin;

  if (allowedRoles.includes('superadmin') && !isSuperAdmin) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.includes('admin') && !isClassAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

function App() {
  return (
    <GuruProvider>
      <Router>
        <Routes>
          <Route path={ROUTES.HOME} element={<GuruHomePage />} />
          <Route path={ROUTES.SEARCH} element={<SearchListingPage />} />
          <Route path={ROUTES.SEARCH_CITY} element={<SearchListingPage />} />
          <Route path={ROUTES.ACADEMY_PROFILE} element={<GuruProfilePage />} />
          <Route
            path={ROUTES.CLASS_ADMIN}
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <ClassAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path={ROUTES.SUPER_ADMIN}
            element={
              <ProtectedRoute allowedRoles={['superadmin']}>
                <SuperAdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route path={ROUTES.LOGIN} element={<LoginPage />} />
          <Route path={ROUTES.REGISTER} element={<RegisterPage />} />
        </Routes>
      </Router>
    </GuruProvider>
  );
}

export default App;
