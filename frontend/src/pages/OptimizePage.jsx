import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { runOptimization, getCargoByDate, loadScenarioTemplate, saveScenario, getSavedScenario } from '../services/api';
import { vehicleColors, fetchRealRoute } from '../utils/routeUtils';
import RouteDetailModal from '../components/RouteDetailModal';
import RejectedItemsModal from '../components/RejectedItemsModal';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({ iconUrl: icon, shadowUrl: iconShadow, iconSize: [25, 41], iconAnchor: [12, 41] });
L.Marker.prototype.options.icon = DefaultIcon;

const OptimizePage = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [selectedDate, setSelectedDate] = useState(searchParams.get('date') || new Date().toISOString().split('T')[0]);
  const [optimizationMode, setOptimizationMode] = useState('unlimited');
  const [cargoList, setCargoList] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [realRoutes, setRealRoutes] = useState([]);
  const [isSavedPlan, setIsSavedPlan] = useState(false);
  
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [selectedRouteIndex, setSelectedRouteIndex] = useState(0);
  const [showRejectedModal, setShowRejectedModal] = useState(false);

  useEffect(() => {
    setSearchParams({ date: selectedDate });
    initPage();
  }, [selectedDate]);

  const initPage = async () => {
      setLoading(true);
      setResults(null);
      setRealRoutes([]);
      setIsSavedPlan(false);
      
      try {
          const saved = await getSavedScenario(selectedDate);
          if (saved.data) {
              setResults(saved.data);
              setOptimizationMode(saved.data.optimization_mode);
              setIsSavedPlan(true);
              setRealRoutes(saved.data.routes);
          }
          const cargo = await getCargoByDate(selectedDate);
          setCargoList(cargo.data);
      } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  const handleOptimize = async () => {
    setLoading(true);
    setResults(null);
    setIsSavedPlan(false);
    try {
      const response = await runOptimization({ date: selectedDate, optimizationMode });
      const solution = response.data;
      
      const enhancedRoutes = await Promise.all(
        solution.routes.map(async (route) => {
          const realPath = await fetchRealRoute(route.path);
          return { ...route, realPath };
        })
      );

      setRealRoutes(enhancedRoutes);
      setResults(solution);
    } catch (error) { alert('Simülasyon hatası.'); } finally { setLoading(false); }
  };

  const handleSave = async () => {
      if (!results) return;
      setSaving(true);
      try {
          await saveScenario({
              date: selectedDate,
              mode: optimizationMode,
              total_cost: results.total_cost,
              routes: realRoutes
          });
          alert('Plan onaylandı.');
          setIsSavedPlan(true);
          initPage(); 
      } catch (error) { alert('Kaydetme hatası.'); } finally { setSaving(false); }
  };

  const openRouteDetail = (route, index) => {
      setSelectedRoute(route);
      setSelectedRouteIndex(index);
  };

  // Reddedilenleri bul (Kayıtlı planda PENDING olanlardır, simülasyonda ise rejectedItems dizisidir)
  const rejectedItems = results?.rejectedItems || cargoList.filter(c => c.status === 'PENDING' && isSavedPlan);

  return (
    <div className="space-y-6 h-full flex flex-col relative">
      {selectedRoute && <RouteDetailModal route={selectedRoute} routeIndex={selectedRouteIndex} onClose={() => setSelectedRoute(null)} />}
      {showRejectedModal && <RejectedItemsModal items={rejectedItems} onClose={() => setShowRejectedModal(false)} />}

      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex flex-col space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Tarih</label>
                <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="w-full p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold outline-none" />
            </div>

            <div className="md:col-span-5">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-2">Strateji</label>
                <div className="flex bg-slate-100 p-1 rounded-lg">
                    {['unlimited', 'max_weight', 'max_count'].map(m => (
                        <button key={m} onClick={() => setOptimizationMode(m)} className={`flex-1 py-2 px-2 rounded-md text-[11px] font-bold transition ${optimizationMode === m ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500'}`}>{m === 'unlimited' ? 'Sınırsız' : m === 'max_weight' ? 'Max Kg' : 'Max Adet'}</button>
                    ))}
                </div>
            </div>

            <div className="md:col-span-5 flex gap-2">
                <button onClick={handleOptimize} disabled={loading || cargoList.length === 0} className={`flex-1 py-3 rounded-xl font-bold text-white shadow-md transition-all ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'}`}>{loading ? 'Hesaplanıyor...' : 'Yeni Simülasyon'}</button>
                {results && !isSavedPlan && (
                    <button onClick={handleSave} disabled={saving} className="flex-1 py-3 rounded-xl font-bold text-white shadow-md bg-green-600 hover:bg-green-700 transition-all transform hover:scale-105 animate-pulse">Planı Onayla</button>
                )}
                {isSavedPlan && (
                    <div className="flex-1 bg-green-100 border border-green-200 text-green-700 px-4 py-3 rounded-xl text-center font-bold text-xs flex items-center justify-center italic">✓ Onaylı Plan</div>
                )}
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow min-h-[600px]">
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 max-h-[300px] flex flex-col overflow-hidden">
            <h2 className="font-bold text-slate-800 border-b border-slate-100 pb-2 mb-2 flex justify-between items-center text-sm"><span>Kargo Listesi</span> <span className="text-[10px] font-bold bg-slate-100 px-2 py-1 rounded text-blue-600">{cargoList.reduce((s,i)=>s+i.weight,0).toFixed(1)} kg</span></h2>
            <div className="space-y-1 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {cargoList.map((item) => (
                <div key={item.id} className={`flex justify-between items-center text-[10px] p-2 rounded border transition ${item.status === 'PLANNED' ? 'bg-green-50 border-green-100' : 'hover:bg-slate-50 border-transparent hover:border-slate-100'}`}><span className="text-slate-600 font-medium truncate pr-2">{item.station_name}</span><span className="font-bold text-slate-800">{item.weight.toFixed(1)} kg</span></div>
              ))}
            </div>
          </div>

          {results && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col">
              <h2 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center text-xs">Planlanan Rotalar</h2>
              <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-grow max-h-[250px]">
                {realRoutes.map((route, idx) => (
                  <div key={idx} onClick={() => openRouteDetail(route, idx)} className="p-3 rounded-lg border-l-4 shadow-sm bg-slate-50 cursor-pointer hover:bg-blue-50 transition transform hover:scale-[1.02]" style={{ borderColor: vehicleColors[idx % vehicleColors.length] }}>
                    <div className="flex justify-between items-start"><div className="font-bold text-xs text-slate-900">{route.vehicle.name}</div><div className="text-[10px] font-mono text-slate-500">{route.load.toFixed(1)} kg</div></div>
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-1"><div className="bg-blue-600 h-1 rounded-full" style={{ width: `${(route.load / route.vehicle.capacity) * 100}%`, backgroundColor: vehicleColors[idx % vehicleColors.length] }}></div></div>
                  </div>
                ))}
              </div>

              {/* Reddedilen Paket Göstergesi */}
              {rejectedItems.length > 0 && (
                  <div 
                    onClick={() => setShowRejectedModal(true)}
                    className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 cursor-pointer hover:bg-red-100 transition shadow-sm group"
                  >
                      <div className="flex items-center justify-between">
                          <div className="flex items-center text-red-700 font-bold text-[11px]">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1.5 animate-pulse" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                              </svg>
                              Taşınamayan: {rejectedItems.length} Paket
                          </div>
                          <span className="text-[9px] text-red-500 font-bold group-hover:underline">Detay Gör →</span>
                      </div>
                  </div>
              )}

              <div className="pt-4 border-t border-slate-100 mt-auto"><div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg"><span className="text-xs font-semibold text-slate-600">Plan Maliyeti</span><span className="text-base font-bold text-slate-900">{parseFloat(results.total_cost || 0).toFixed(1)}</span></div></div>
            </div>
          )}
        </div>

        <div className="lg:col-span-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200 h-[600px] lg:h-auto z-0">
          <MapContainer center={[40.7654, 29.9408]} zoom={10} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
            <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
            {realRoutes.map((route, idx) => (<Polyline key={idx} positions={route.realPath || route.path} color={vehicleColors[idx % vehicleColors.length]} weight={5} opacity={0.8} eventHandlers={{ click: () => openRouteDetail(route, idx) }} />))}
            {cargoList.map((item) => (<Marker key={item.id} position={[item.latitude, item.longitude]}><Popup><div className="text-center font-bold text-xs">{item.station_name}<br/>{item.weight.toFixed(1)} kg</div></Popup></Marker>))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default OptimizePage;
