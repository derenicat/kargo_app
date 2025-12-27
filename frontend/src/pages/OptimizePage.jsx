import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { getScenarioById, runOptimization } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import axios from 'axios'; // OSRM isteği için

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const vehicleColors = ['#dc2626', '#2563eb', '#16a34a', '#d97706', '#9333ea'];

// Polyline kodunu çözen yardımcı fonksiyon (OSRM encoded string döner)
function decodePolyline(str, precision) {
    var index = 0,
        lat = 0,
        lng = 0,
        coordinates = [],
        shift = 0,
        result = 0,
        byte = null,
        latitude_change,
        longitude_change,
        factor = Math.pow(10, precision || 5);

    while (index < str.length) {
        byte = null;
        shift = 0;
        result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        latitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));
        shift = result = 0;

        do {
            byte = str.charCodeAt(index++) - 63;
            result |= (byte & 0x1f) << shift;
            shift += 5;
        } while (byte >= 0x20);

        longitude_change = ((result & 1) ? ~(result >> 1) : (result >> 1));

        lat += latitude_change;
        lng += longitude_change;

        coordinates.push([lat / factor, lng / factor]);
    }

    return coordinates;
}

const OptimizePage = () => {
  const [searchParams] = useSearchParams();
  const scenarioId = searchParams.get('id');
  const [scenario, setScenario] = useState(null);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [realRoutes, setRealRoutes] = useState([]); // OSRM'den gelen gerçek yollar

  useEffect(() => {
    if (scenarioId) {
      fetchScenario();
    }
  }, [scenarioId]);

  const fetchScenario = async () => {
    try {
      const response = await getScenarioById(scenarioId);
      setScenario(response.data);
    } catch (error) {
      console.error('Senaryo yükleme hatası:', error);
    }
  };

  const fetchRealRoute = async (waypoints) => {
    // Waypoints: [[lat, lng], [lat, lng], ...]
    // OSRM formatı: lon,lat;lon,lat
    const coordinates = waypoints.map(pt => `${pt[1]},${pt[0]}`).join(';');
    const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=polyline`;

    try {
        const response = await axios.get(url);
        if (response.data.routes && response.data.routes.length > 0) {
            return decodePolyline(response.data.routes[0].geometry);
        }
    } catch (error) {
        console.warn("OSRM Rota alınamadı, düz çizgi kullanılacak.", error);
    }
    return waypoints; // Hata olursa düz çizgi dön
  };

  const handleOptimize = async () => {
    setLoading(true);
    setRealRoutes([]); // Önceki rotaları temizle
    try {
      const response = await runOptimization(scenarioId);
      const solution = response.data.solution;
      setResults(solution);

      // Gerçek yolları çek (Her araç rotası için)
      const enhancedRoutes = await Promise.all(solution.routes.map(async (route) => {
          const realPath = await fetchRealRoute(route.path);
          return { ...route, realPath };
      }));
      
      setRealRoutes(enhancedRoutes);

    } catch (error) {
      console.error('Optimizasyon hatası:', error);
      alert('Hesaplama sırasında bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  if (!scenario) return (
    <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
    </div>
  );

  return (
    <div className="space-y-6 h-full flex flex-col">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-xl shadow-sm border border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{scenario.name}</h1>
          <p className="text-slate-500 text-sm mt-1">
             Senaryo Tarihi: {new Date(scenario.created_at).toLocaleDateString('tr-TR')}
          </p>
        </div>
        <button 
          onClick={handleOptimize}
          disabled={loading}
          className={`mt-4 md:mt-0 px-8 py-3 rounded-xl font-bold text-white shadow-md transition-all transform active:scale-95 ${loading ? 'bg-slate-400 cursor-not-allowed' : 'bg-amber-500 hover:bg-amber-600 text-slate-900'}`}
        >
          {loading ? (
             <span className="flex items-center">
               <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                 <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                 <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
               </svg>
               Rotalar Hesaplanıyor...
             </span>
          ) : 'Algoritmayı Çalıştır'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-grow min-h-[600px]">
        {/* Sol: Detaylar */}
        <div className="lg:col-span-1 space-y-6 flex flex-col">
          {/* Talep Özeti */}
          <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 max-h-[400px] flex flex-col">
            <h2 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
              </svg>
              Talep Listesi
            </h2>
            <div className="space-y-2 overflow-y-auto pr-2 custom-scrollbar flex-grow">
              {scenario.demands.map(d => (
                <div key={d.id} className="flex justify-between items-center text-sm p-2 rounded hover:bg-slate-50 border border-transparent hover:border-slate-100">
                  <span className="text-slate-600 font-medium">{d.station_name}</span>
                  <span className="font-bold text-slate-800 bg-slate-100 px-2 py-0.5 rounded text-xs">{d.total_weight} kg</span>
                </div>
              ))}
            </div>
          </div>

          {/* Sonuçlar */}
          {results && (
            <div className="bg-white p-5 rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col">
              <h2 className="font-bold text-slate-800 mb-4 border-b border-slate-100 pb-2 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-green-500" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M12 1.586l-4 4v12.828l4-4V1.586zM3.707 3.293A1 1 0 002 5v11a1 1 0 001.52 1.352l5-1.667.48-.16 2 4V6l-2-4H3.707zM16 3a1 1 0 011 1v11a1 1 0 01-1 1h-3v-2h3V4h-3V3h3z" clipRule="evenodd" />
                </svg>
                Rota Sonuçları
              </h2>
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                {results.routes.map((route, idx) => (
                  <div key={idx} className="p-3 rounded-lg border-l-4 shadow-sm bg-slate-50" style={{ borderColor: vehicleColors[idx % vehicleColors.length] }}>
                    <div className="flex justify-between items-start">
                        <div>
                            <div className="font-bold text-sm text-slate-900">{route.vehicle.name}</div>
                            {route.vehicle.isRental && <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-bold uppercase tracking-wider">Kiralık</span>}
                        </div>
                        <div className="text-xs font-mono text-slate-500">{route.load} / {route.vehicle.capacity} kg</div>
                    </div>
                    
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5">
                      <div 
                        className="bg-blue-600 h-1.5 rounded-full" 
                        style={{ 
                            width: `${(route.load / route.vehicle.capacity) * 100}%`,
                            backgroundColor: vehicleColors[idx % vehicleColors.length]
                        }}
                      ></div>
                    </div>
                    
                    <div className="text-xs text-slate-500 mt-2 flex items-center">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                      </svg>
                      {route.path.length - 2} Durak
                    </div>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-100 mt-2">
                    <div className="flex justify-between items-center bg-slate-100 p-3 rounded-lg">
                        <span className="text-sm font-semibold text-slate-600">Toplam Maliyet</span>
                        <span className="text-lg font-bold text-slate-900">{results.fitness.toFixed(1)} <span className="text-xs font-normal text-slate-500">Birim</span></span>
                    </div>
              </div>
            </div>
          )}
        </div>

        {/* Sağ: Harita */}
        <div className="lg:col-span-3 bg-white p-2 rounded-xl shadow-sm border border-slate-200 h-[600px] lg:h-auto z-0">
          <MapContainer center={[40.7654, 29.9408]} zoom={10} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
            <TileLayer 
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
            />
            
            {/* Gerçek Rotaları Çiz (Varsa realRoutes, yoksa results'dan path) */}
            {(realRoutes.length > 0 ? realRoutes : (results?.routes || [])).map((route, idx) => (
              <Polyline 
                key={idx}
                positions={route.realPath || route.path} // Varsa gerçek yol, yoksa düz
                color={vehicleColors[idx % vehicleColors.length]}
                weight={5}
                opacity={0.8}
                dashArray={route.vehicle.isRental ? '10, 10' : null} 
              >
                <Popup>
                    <div className="font-bold text-slate-900">{route.vehicle.name}</div>
                    <div className="text-sm text-slate-600">Yük: {route.load} kg</div>
                </Popup>
              </Polyline>
            ))}
            
            {/* İstasyonları Marker Olarak Göster */}
            {scenario.demands.map(d => (
                <Marker key={d.id} position={[d.latitude, d.longitude]}>
                    <Popup>
                      <div className="text-center">
                        <div className="font-bold text-slate-900 text-sm mb-1">{d.station_name}</div>
                        <div className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded-full inline-block font-semibold">
                            {d.total_weight} kg
                        </div>
                      </div>
                    </Popup>
                </Marker>
            ))}
          </MapContainer>
        </div>
      </div>
    </div>
  );
};

export default OptimizePage;
