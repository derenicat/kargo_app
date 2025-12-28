import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
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
  
  // isAdmin context'te senkron olarak ilklendiği için artık bekleme yapmamıza gerek yok
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
            <Route index element={<HomePage />} />
            <Route path="admin-login" element={<AdminLoginPage />} />
            <Route path="user-cargo" element={<UserCargoPage />} />
            <Route path="track" element={<CargoTrackingPage />} />
            
            {/* Tüm Admin Rotaları Korumalı */}
            <Route path="stations" element={<ProtectedRoute><StationsPage /></ProtectedRoute>} />
            <Route path="scenarios" element={<ProtectedRoute><ScenariosPage /></ProtectedRoute>} />
            <Route path="optimize" element={<ProtectedRoute><OptimizePage /></ProtectedRoute>} />
            <Route path="dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
            <Route path="vehicles" element={<ProtectedRoute><VehicleManagementPage /></ProtectedRoute>} />
          </Route>
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;