import { useEffect } from 'react';
import { MapContainer, TileLayer, Polyline, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { vehicleColors } from '../utils/routeUtils';

// Harita Boyutlandırma Tetikleyicisi
const MapResizer = () => {
    const map = useMap();
    useEffect(() => {
        const timer = setTimeout(() => {
            map.invalidateSize();
        }, 200); 
        const handleResize = () => map.invalidateSize();
        window.addEventListener('resize', handleResize);
        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', handleResize);
        };
    }, [map]);
    return null;
};

// Özel İkonlar
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
  if (!route) return null;

  const centerPosition = route.path && route.path.length > 0 ? route.path[0] : [40.7654, 29.9408];

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex justify-center items-center p-4 backdrop-blur-sm transition-opacity" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl h-[85vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-slate-900 p-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center">
                {route.vehicle.name} Rota Detayı
                {route.vehicle.isRental && <span className="ml-2 text-[10px] bg-amber-500 text-slate-900 px-2 py-0.5 rounded-full font-black tracking-widest uppercase">KİRALIK</span>}
            </h2>
            <div className="text-sm opacity-80 flex gap-4 mt-1 items-center">
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-blue-400 mr-2"></span> Yük: {route.load} kg</span>
                <div className="w-px h-3 bg-white/20"></div>
                <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-amber-400 mr-2"></span> Kapasite: {route.vehicle.capacity} kg</span>
                <div className="w-px h-3 bg-white/20"></div>
                <span>Durak: {route.stops.length - 2}</span>
            </div>
          </div>
          <button onClick={onClose} className="bg-white/10 hover:bg-red-500/80 p-2 rounded-xl transition-all active:scale-90">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex flex-col md:flex-row h-full overflow-hidden">
            {/* Harita */}
            <div className="w-full md:w-2/3 h-[350px] md:h-full bg-slate-100 relative shadow-inner">
                 <MapContainer 
                    key={`detail-map-${routeIndex}`}
                    center={centerPosition} 
                    zoom={11} 
                    style={{ height: '100%', width: '100%' }}
                 >
                    <MapResizer />
                    <TileLayer url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png" />
                    
                    <Polyline 
                        positions={route.realPath || route.path}
                        color={vehicleColors[routeIndex % vehicleColors.length]}
                        weight={6}
                        opacity={0.9}
                    />

                    {/* Duraklar (Markerlar) */}
                    {route.stops.map((stop, idx) => {
                        let icon = stopIcon;
                        let title = stop.name;
                        if (idx === 0) { icon = startIcon; title = `Başlangıç: ${stop.name}`; }
                        else if (idx === route.stops.length - 1) { icon = endIcon; title = `Varış: ${stop.name}`; }

                        return (
                            <Marker key={idx} position={[stop.lat, stop.lng]} icon={icon}>
                                <Popup>
                                    <div className="text-center font-sans">
                                        <div className="font-bold text-slate-900 border-b pb-1 mb-1">{stop.name}</div>
                                        {idx !== 0 && idx !== route.stops.length - 1 && (
                                            <div className="text-xs space-y-1">
                                                <div className="text-blue-600 font-semibold">{stop.cargo_count} Paket</div>
                                                <div className="bg-slate-100 rounded px-1">{stop.total_weight} kg</div>
                                            </div>
                                        )}
                                    </div>
                                </Popup>
                            </Marker>
                        );
                    })}
                 </MapContainer>
            </div>

            {/* Bilgi Paneli */}
            <div className="w-full md:w-1/3 flex flex-col bg-white border-l border-slate-200">
                <div className="p-4 border-b border-slate-100 bg-slate-50 flex items-center justify-between">
                    <h3 className="font-bold text-slate-800 flex items-center">
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.806-.982l-4.694-2.583" />
                        </svg>
                        Güzergah Listesi
                    </h3>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{route.stops.length} Nokta</span>
                </div>
                
                <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
                    <div className="relative border-l-2 border-slate-100 ml-3 space-y-8">
                        {route.stops.map((stop, idx) => {
                            const isStart = idx === 0;
                            const isEnd = idx === route.stops.length - 1;
                            
                            return (
                                <div key={idx} className="relative pl-8">
                                    {/* Nokta İkonu */}
                                    <div className={`absolute -left-[11px] top-0 w-5 h-5 rounded-full border-4 border-white shadow-sm transition-transform hover:scale-125 ${isStart ? 'bg-green-500' : isEnd ? 'bg-red-600' : 'bg-blue-500'}`}></div>
                                    
                                    <div className={`p-3 rounded-xl border transition-all ${isStart ? 'bg-green-50/50 border-green-100' : isEnd ? 'bg-red-50/50 border-red-100' : 'bg-white border-slate-100 hover:shadow-md hover:border-blue-200'}`}>
                                        <div className="flex justify-between items-start mb-1">
                                            <div className={`font-bold text-sm ${isStart ? 'text-green-800' : isEnd ? 'text-red-900' : 'text-slate-800'}`}>
                                                {stop.name}
                                            </div>
                                            {!isStart && !isEnd && (
                                                <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded uppercase tracking-tighter">
                                                    Durak {idx}
                                                </span>
                                            )}
                                        </div>
                                        
                                        {!isStart && !isEnd ? (
                                            <div className="flex gap-3 text-[11px]">
                                                <div className="flex items-center text-slate-600">
                                                    <svg className="w-3 h-3 mr-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" strokeWidth="2"/></svg>
                                                    {stop.cargo_count} Paket
                                                </div>
                                                <div className="flex items-center text-slate-600 font-medium">
                                                    <svg className="w-3 h-3 mr-1 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" strokeWidth="2"/></svg>
                                                    {stop.total_weight} kg
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="text-[11px] text-slate-500 italic">
                                                {isStart ? 'Araç depodan çıkış yaptı.' : 'Teslimat tamamlandı.'}
                                            </div>
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
