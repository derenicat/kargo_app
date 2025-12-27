import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import StationsPage from './pages/StationsPage';
import ScenariosPage from './pages/ScenariosPage';
import OptimizePage from './pages/OptimizePage';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div className="text-center py-20"><h1 className="text-4xl font-bold text-gray-800">Hoş Geldiniz</h1><p className="mt-4 text-gray-600 text-lg">Kargo rotalama ve istasyon yönetim sistemini kullanmaya başlamak için menüyü kullanın.</p></div>} />
          <Route path="stations" element={<StationsPage />} />
          <Route path="scenarios" element={<ScenariosPage />} />
          <Route path="optimize" element={<OptimizePage />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;