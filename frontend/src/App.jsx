import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import StationsPage from './pages/StationsPage';
import ScenariosPage from './pages/ScenariosPage';
import OptimizePage from './pages/OptimizePage';
import AdminLoginPage from './pages/AdminLoginPage';
import UserCargoPage from './pages/UserCargoPage';
import CargoTrackingPage from './pages/CargoTrackingPage';
import DashboardPage from './pages/DashboardPage';
import VehicleManagementPage from './pages/VehicleManagementPage';

// Korumalı Rota Bileşeni
const ProtectedRoute = ({ children }) => {
  const { isAdmin } = useAuth();
  if (!isAdmin) {
    return <Navigate to="/admin-login" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<div className="text-center py-20"><h1 className="text-4xl font-bold text-gray-800">Hoş Geldiniz</h1><p className="mt-4 text-gray-600 text-lg">Kargo rotalama ve istasyon yönetim sistemini kullanmaya başlamak için menüyü kullanın.</p></div>} />
            <Route path="admin-login" element={<AdminLoginPage />} />
            <Route path="user-cargo" element={<UserCargoPage />} />
            <Route path="track" element={<CargoTrackingPage />} />
            
            {/* Korumalı Rota */}
            <Route path="stations" element={
              <ProtectedRoute>
                <StationsPage />
              </ProtectedRoute>
            } />
            
            <Route path="dashboard" element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            } />

            <Route path="vehicles" element={
              <ProtectedRoute>
                <VehicleManagementPage />
              </ProtectedRoute>
            } />
            
            <Route path="scenarios" element={<ScenariosPage />} />
            <Route path="optimize" element={<OptimizePage />} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
