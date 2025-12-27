import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { runOptimization, getCargoByDate, loadScenarioTemplate } from '../services/api';
import { vehicleColors, fetchRealRoute } from '../utils/routeUtils';
import RouteDetailModal from '../components/RouteDetailModal';
import {
  MapContainer,
  TileLayer,
  Marker,
  Popup,
  Polyline,
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Leaflet Icon Fix
let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
});
L.Marker.prototype.options.icon = DefaultIcon;

const OptimizePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  
  // State
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [optimizationMode, setOptimizationMode] = useState('unlimited'); // unlimited, max_weight, max_count
  const [cargoList, setCargoList] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realRoutes, setRealRoutes] = useState([]);
  
  // Modal State
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);

  // Tarih değişince URL'i ve kargo listesini güncelle
  useEffect(() => {
    setSearchParams({ date: selectedDate });
    fetchCargoList();
    setResults(null); 
    setRealRoutes([]);
  }, [selectedDate]);

  const fetchCargoList = async () => {
    try {
      const response = await getCargoByDate(selectedDate);
      setCargoList(response.data);
    } catch (error) {
      console.error('Kargo listesi yüklenemedi:', error);
      setCargoList([]);
    }
  };

  const handleLoadTemplate = async (id) => {
    setLoading(true);
    try {
      await loadScenarioTemplate(selectedDate, id);
      fetchCargoList();
      alert(`Senaryo ${id} başarıyla yüklendi. Şimdi planlama yapabilirsiniz.`);
    } catch (error) {
      alert('Şablon yüklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleOptimize = async () => {
    setLoading(true);
    setRealRoutes([]);
    setResults(null);
    try {
      const response = await runOptimization({ date: selectedDate, optimizationMode });
      const solution = response.data.solution;
      
      const enhancedRoutes = await Promise.all(
        solution.routes.map(async (route) => {
          const realPath = await fetchRealRoute(route.path);
          return { ...route, realPath };
        })
      );

      setRealRoutes(enhancedRoutes);
      setResults(solution);
      fetchCargoList(); 
    } catch (error) {
      console.error('Optimizasyon hatası:', error);
      alert('Hesaplama sırasında hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const openRouteDetail = (route, index) => {
      setSelectedRoute(route);
      setSelectedRouteIndex(index);
  };

  const closeRouteDetail = () => {
      setSelectedRoute(null);
  };

  const totalWeight = cargoList.reduce((sum, item) => sum + item.weight, 0);
  const rejectedCount = results?.rejectedItems?.length || 0;

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      
      {selectedRoute && (
          <RouteDetailModal 
            route={selectedRoute} 
            routeIndex={selectedRouteIndex} 
            onClose={closeRouteDetail}
          />
      )}

      {/* Kontrol Paneli */}
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-3">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Planlama Tarihi</label>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>

            <div className="md:col-span-6">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Optimizasyon Stratejisi</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    <button onClick={() => setOptimizationMode('unlimited')} className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition ${optimizationMode === 'unlimited' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sınırsız (Maliyet)</button>
                    <button onClick={() => setOptimizationMode('max_weight')} className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition ${optimizationMode === 'max_weight' ? 'bg-white text-green-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sabit (Max Ağırlık)</button>
                    <button onClick={() => setOptimizationMode('max_count')} className={`flex-1 py-2 px-3 rounded-md text-sm font-bold transition ${optimizationMode === 'max_count' ? 'bg-white text-amber-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Sabit (Max Adet)</button>
                </div>
            </div>

            <div className="md:col-span-3 text-right">
                <button
                onClick={handleOptimize}
                disabled={loading || cargoList.length === 0}
                className={`w-full py-3 rounded-xl font-bold text-white shadow-md transition-all transform active:scale-95 flex justify-center items-center ${loading || cargoList.length === 0 ? 'bg-slate-400 cursor-not-allowed' : 'bg-slate-900 hover:bg-slate-800'}`}
                >
                {loading ? 'Hesaplanıyor...' : 'Rotayı Planla'}
                </button>
            </div>
        </div>

        {/* Otomatik Senaryo Getirme */}
        {cargoList.length === 0 && !loading && (
            <div className="flex items-center justify-between bg-blue-50 p-4 rounded-xl border border-blue-100 animate-fade-in">
                <div className="flex items-center">
                    <div className="bg-blue-600 p-2 rounded-lg mr-3 text-white">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                    </div>
                    <div>
                        <span className="text-sm font-bold text-blue-800 block">Bu tarih boş!</span>
                        <span className="text-xs text-blue-600">Dokümandaki hazır senaryolardan birini bu tarihe yükleyin:</span>
                    </div>
                </div>
                <div className="flex space-x-2">
                    {[1, 2, 3, 4].map(id => (
                        <button key={id} onClick={() => handleLoadTemplate(id)} className="bg-white border border-blue-200 text-blue-600 px-4 py-1.5 rounded-lg text-sm font-bold hover:bg-blue-600 hover:text-white transition shadow-sm">
                            Senaryo {id}
                        </button>
                    ))}
                </div>
            </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow min-h-[600px]">
        {/* Sol: Detaylar */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 max-h-[300px] flex flex-col">
            <div className="flex justify-between items-center border-b border-slate-100 pb-2 mb-2">
                <h2 className="font-bold text-slate-800 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Talep Listesi ({cargoList.length})
                </h2>
                <span className="text-xs font-bold bg-slate-100 px-2 py-1 rounded text-slate-600">{totalWeight.toFixed(1)} kg</span>
            </div>
            
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {cargoList.length === 0 ? (
                  <p className="text-center text-slate-400 text-sm py-4">Kargo girişi yapılmamış.</p>
              ) : (
                  cargoList.map((item) => (
                    <div key={item.id} className={`flex justify-between items-center text-xs p-2 rounded border transition ${item.status === 'PLANNED' ? 'bg-green-50 border-green-100' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}>
                        <span className="text-slate-600 font-medium truncate pr-2">{item.station_name}</span>
                        <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded whitespace-nowrap">{item.weight.toFixed(1)} kg</span>
                    </div>
                ))
              )}
            </div>
          </div>

          {results && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col">
              <h2 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center text-sm">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 5v11a1 1 0 001.52 1.352l5-1.667.48-.16 2 4V6l-2-4H3.707zM16 3a1 1 0 011 1v11a1 1 0 01-1 1h-3v-2h3V4h-3V3h3z" clipRule="evenodd" />
                </svg>
                Planlanan Rotalar
              </h2>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow max-h-[300px]">
                {(realRoutes.length > 0 ? realRoutes : results.routes).map((route, idx) => (
                  <div key={idx} onClick={() => openRouteDetail(route, idx)} className="p-3 rounded-lg border-l-4 shadow-sm bg-slate-50 cursor-pointer hover:bg-blue-50 transition transform hover:scale-[1.02]" style={{ borderColor: vehicleColors[idx % vehicleColors.length] }}>
                    <div className="flex justify-between items-start">
                        <div className="font-bold text-xs text-slate-900">{route.vehicle.name} {route.vehicle.isRental && '(Kiralık)'}</div>
                        <div className="text-[10px] font-mono text-slate-500">{route.load.toFixed(1)} / {route.vehicle.capacity} kg</div>
                    </div>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                      <div className="bg-blue-600 h-1.5 rounded-full" style={{ width: `${(route.load / route.vehicle.capacity) * 100}%`, backgroundColor: vehicleColors[idx % vehicleColors.length] }}></div>
                    </div>
                  </div>
                ))}
              </div>

              {rejectedCount > 0 && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg border border-red-100">
                      <div className="flex items-center text-red-700 font-bold text-xs">
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                          </svg>
                          Taşınamayan: {rejectedCount} Paket
                      </div>
                  </div>
              )}

              <div className="pt-4 border-t border-slate-100 mt-auto">
                <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg">
                  <span className="text-xs font-semibold text-slate-600">Maliyet</span>
                  <span className="text-base font-bold text-slate-900">{results.fitness.toFixed(1)} <span className="text-[10px] font-normal text-slate-500">Birim</span></span>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200 h-[600px] lg:h-auto z-0">
          <MapContainer center={[40.7654, 29.9408]} zoom={10} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {(realRoutes.length > 0 ? realRoutes : results?.routes || []).map((route, idx) => (
                <Polyline key={idx} positions={route.realPath || route.path} color={vehicleColors[idx % vehicleColors.length]} weight={5} opacity={0.8} dashArray={route.vehicle.isRental ? '10, 10' : null} eventHandlers={{ click: () => openRouteDetail(route, idx) }} />
            ))}
            {cargoList.map((item) => (
              <Marker key={item.id} position={[item.latitude, item.longitude]}>
                <Popup><div className="text-center font-bold text-xs">{item.station_name}<br/>{item.weight.toFixed(1)} kg</div></Popup>
              </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default OptimizePage;
