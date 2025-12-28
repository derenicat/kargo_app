import { useState } from 'react';
import { trackCargo } from '../services/api';
import { MapContainer, TileLayer, Polyline, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { vehicleColors } from '../utils/routeUtils';
import L from 'leaflet';

const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const CargoTrackingPage = () => {
  const [trackingId, setTrackingId] = useState('');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleTrack = async (e) => {
    e.preventDefault();
    if (!trackingId) return;
    setLoading(true);
    setError('');
    setData(null);
    try {
      const response = await trackCargo(trackingId);
      setData(response.data);
    } catch (err) {
      setError('Kargo bulunamadı veya henüz planlanmadı.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      {/* Sorgulama Alanı */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 text-center">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Kargo Takip Sistemi</h1>
        <p className="text-slate-500 mb-8 text-lg">Kargonuzun nerede olduğunu ve teslimat rotasını anlık takip edin.</p>
        
        <form onSubmit={handleTrack} className="flex flex-col md:flex-row gap-4 justify-center items-center">
          <input 
            type="text" 
            placeholder="Kargo Takip No (Örn: 42)"
            value={trackingId}
            onChange={(e) => setTrackingId(e.target.value)}
            className="w-full md:w-80 px-6 py-4 bg-slate-50 border-2 border-slate-200 rounded-2xl text-slate-900 font-bold focus:border-blue-500 outline-none transition-all"
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full md:w-auto bg-slate-900 hover:bg-blue-600 text-white px-10 py-4 rounded-2xl font-bold shadow-lg transition-all transform active:scale-95"
          >
            {loading ? 'Sorgulanıyor...' : 'Kargomu Bul'}
          </button>
        </form>
        {error && <p className="mt-4 text-red-500 font-bold animate-pulse">{error}</p>}
      </div>

      {/* Sonuç Alanı */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-fade-in">
          {/* Bilgiler */}
          <div className="lg:col-span-4 space-y-6">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Paket Bilgileri</h2>
                <div className="space-y-4">
                    <div>
                        <span className="text-sm text-slate-500 block">Kalkış İstasyonu</span>
                        <span className="text-xl font-bold text-slate-900">{data.cargo.station_name}</span>
                    </div>
                    <div className="flex gap-8">
                        <div>
                            <span className="text-sm text-slate-500 block">Ağırlık</span>
                            <span className="text-lg font-bold text-blue-600">{data.cargo.weight} kg</span>
                        </div>
                        <div>
                            <span className="text-sm text-slate-500 block">Durum</span>
                            <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded text-xs font-black tracking-tighter uppercase">TAŞIMA SÜRECİNDE</span>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Teslimat Rotası</h2>
                <div className="space-y-4">
                    {data.route?.stops?.length > 0 ? (
                        data.route.stops.map((stop, idx) => (
                            <div key={idx} className="flex items-center gap-3">
                                <div className={`w-3 h-3 rounded-full ${stop.isOrigin ? 'bg-green-500' : stop.isDestination ? 'bg-red-600' : 'bg-blue-500'}`}></div>
                                <span className={`text-sm font-medium ${stop.name === data.cargo.station_name ? 'text-blue-600 font-bold scale-105' : 'text-slate-600'}`}>
                                    {stop.name}
                                    {stop.name === data.cargo.station_name && ' (Buradasınız)'}
                                </span>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-400 italic text-sm">Rota bilgisi alınamadı.</p>
                    )}
                </div>
            </div>
          </div>

          {/* Harita */}
          <div className="lg:col-span-8 bg-white p-2 rounded-2xl shadow-sm border border-slate-200 h-[500px]">
            <MapContainer 
                key={data.cargo.id}
                center={data.route?.path?.[0] || [40.7654, 29.9408]} 
                zoom={10} 
                style={{ height: '100%', width: '100%', borderRadius: '1rem' }}
            >
                <TileLayer url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png" />
                <Polyline positions={data.route?.realPath || data.route?.path || []} color={vehicleColors[0]} weight={6} opacity={0.8} />
                
                {data.route?.stops?.map((stop, idx) => {
                    // Koordinat kontrolü: lat/lng veya latitude/longitude
                    const position = [stop.lat || stop.latitude, stop.lng || stop.longitude];
                    
                    if (!position[0] || !position[1]) return null;

                    let icon = createIcon('blue');
                    if (stop.isOrigin) icon = createIcon('green');
                    else if (stop.isDestination) icon = createIcon('red');
                    
                    return (
                        <Marker key={idx} position={position} icon={icon}>
                            <Popup><span className="font-bold">{stop.name}</span></Popup>
                        </Marker>
                    )
                })}
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
};

export default CargoTrackingPage;
