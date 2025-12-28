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

  const safeStops = route.stops.map(s => ({
      ...s,
      lat: parseFloat(s.lat),
      lng: parseFloat(s.lng)
  })).filter(s => !isNaN(s.lat) && !isNaN(s.lng));

  const centerPosition = safeStops.length > 0 ? [safeStops[0].lat, safeStops[0].lng] : [40.7654, 29.9408];

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        
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
                                    {!stop.isDestination && (
                                        <div className="text-xs">{stop.cargo_count || 0} Paket / {(stop.total_weight || 0).toFixed(1)} kg</div>
                                    )}
                                    {stop.isDestination && <div className="text-xs text-red-600 font-bold">VARIŞ (KAMPÜS)</div>}
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
                        {safeStops.map((stop, idx) => {
                            const isStart = stop.isOrigin;
                            const isEnd = stop.isDestination;
                            
                            return (
                                <div key={idx} className="relative pl-8">
                                    <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform hover:scale-125 ${isStart ? 'bg-green-500' : isEnd ? 'bg-red-600' : 'bg-blue-500'}`}></div>
                                    <div className={`p-3 rounded-xl border transition-all ${isStart ? 'bg-green-50/50 border-green-100' : isEnd ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100 hover:shadow-md hover:border-blue-200'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className={`font-bold text-sm ${isStart ? 'text-green-800' : isEnd ? 'text-red-900' : 'text-slate-800'}`}>
                                                {stop.name}
                                            </div>
                                        </div>
                                        
                                        {!isEnd ? (
                                            <div className="flex gap-3 text-[11px]">
                                                <div className="flex items-center text-slate-600">
                                                    <svg className="w-3 h-3 mr-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeWidth="2"/></svg>
                                                    {stop.cargo_count || 0} Paket
                                                </div>
                                                <div className="flex items-center text-slate-600 font-medium">
                                                    <svg className="w-3 h-3 mr-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" strokeWidth="2"/></svg>
                                                    {(stop.total_weight || 0).toFixed(1)} kg
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-500 italic">Teslimat tamamlandı.</div>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

export default RouteDetailModal;
