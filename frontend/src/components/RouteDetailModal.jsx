import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { vehicleColors } from '../utils/routeUtils';

const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => map.invalidateSize(), 250); 
        return () => clearTimeout(timer);
    }, [map]);
    return null;
};

const createIcon = (color) => new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

const startIcon = createIcon('green');
const endIcon = createIcon('red');
const stopIcon = createIcon('blue');

const RouteDetailModal = ({ route, routeIndex, onClose }) => {
  if (!route || !route.stops) return null;

  // Koordinatları sayıya zorla ve doğrula
  const safeStops = route.stops.map(s => ({
      ...s,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lng)
  })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));

  const centerPosition = safeStops.length > 0 ? [safeStops[0].lat, safeStops[0].lng] : [40.7654, 29.9408];

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden" onClick={e => e.stopPropagation()}>
        
        <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold">{route.vehicle.name} Rota Detayı</h2>
            <div className="text-xs opacity-70 mt-1 flex gap-4">
                <span>Yük: {route.load.toFixed(1)} kg</span>
                <span>Durak: {safeStops.length - 2}</span>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            <div className="w-full md:w-2/3 h-full bg-slate-100 relative">
                 <MapContainer key={`detail-${routeIndex}`} center={centerPosition} zoom={11} style={{ height: '100%', width: '100%' }}>
                    <MapResizer />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    <Polyline positions={route.realPath || route.path || []} color={vehicleColors[routeIndex % vehicleColors.length]} weight={6} opacity={0.9} />

                    {safeStops.map((stop, idx) => (
                        <Marker key={idx} position={[stop.lat, stop.lng]} icon={stop.isOrigin ? startIcon : stop.isDestination ? endIcon : stopIcon}>
                            <Popup>
                                <div className="text-center">
                                    <div className="font-bold border-b mb-1 pb-1">{stop.name}</div>
                                    {!stop.isOrigin && !stop.isDestination && <div className="text-xs">{stop.cargo_count} Paket / {stop.total_weight.toFixed(1)} kg</div>}
                                </div>
                            </Popup>
                        </Marker>
                    ))}
                 </MapContainer>
            </div>

            <div className="w-full md:w-1/3 flex flex-col bg-white border-l">
                <div className="p-4 bg-slate-50 border-b font-bold text-slate-800">Güzergah Listesi</div>
                <div className="flex-grow overflow-y-auto p-6">
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                        {safeStops.map((stop, idx) => (
                            <div key={idx} className="relative pl-8">
                                <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm ${stop.isOrigin ? 'bg-green-500' : stop.isDestination ? 'bg-red-600' : 'bg-blue-500'}`}></div>
                                <div className="p-3 bg-white border border-slate-100 rounded-xl shadow-sm">
                                    <div className="font-bold text-sm text-slate-800">{stop.name}</div>
                                    {!stop.isOrigin && !stop.isDestination && (
                                        <div className="text-[10px] text-slate-500 mt-1">{stop.cargo_count} Paket • {stop.total_weight.toFixed(1)} kg</div>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailModal;