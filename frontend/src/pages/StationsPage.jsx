import { useState, useEffect, useMemo, useRef } from 'react';
import { getStations, createStation, deleteStation } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';
import { useAuth } from '../context/AuthContext';

// Leaflet Icon Fix
let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

// Özel Pin İkonu (Oluşturma Modu İçin)
const createIcon = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-gold.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Haritayı Belirli Bir Noktaya Uçuran Bileşen
const FlyToLocation = ({ location }) => {
    const map = useMap();
    useEffect(() => {
        if (location) {
            map.flyTo(location, 13, { duration: 1.5 });
        }
    }, [location, map]);
    return null;
};

// Sürüklenebilir Marker Bileşeni
const DraggableMarker = ({ position, setPosition }) => {
    const markerRef = useRef(null);
    const eventHandlers = useMemo(
        () => ({
            dragend() {
                const marker = markerRef.current;
                if (marker != null) {
                    const { lat, lng } = marker.getLatLng();
                    setPosition({ lat, lng });
                }
            },
        }),
        [setPosition],
    );

    return (
        <Marker
            draggable={true}
            eventHandlers={eventHandlers}
            position={position}
            ref={markerRef}
            icon={createIcon}
        >
            <Popup minWidth={90}>Konumu ayarlamak için sürükleyin</Popup>
        </Marker>
    );
};

const StationsPage = () => {
  const [stations, setStations] = useState([]);
  const [loading, setLoading] = useState(true);
  const { logout } = useAuth();
  
  // Form ve Harita State'leri
  const [isCreating, setIsCreating] = useState(false);
  const [newStationPos, setNewStationPos] = useState(null); // { lat, lng }
  const [formData, setFormData] = useState({ name: '' });
  const [focusedLocation, setFocusedLocation] = useState(null); // Harita odağı

  useEffect(() => {
    fetchStations();
  }, []);

  const fetchStations = async () => {
    try {
      const response = await getStations();
      setStations(response.data);
    } catch (error) {
      console.error('İstasyonlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateStart = () => {
    // Haritanın mevcut merkezini alabilmek için basit bir varsayılan konum atıyoruz
    // Gerçekte map.getCenter() kullanmak için map instance lazım ama 
    // şimdilik İzmit merkez veya son odaklanılan yere koyalım.
    const startPos = focusedLocation || { lat: 40.7654, lng: 29.9408 };
    setNewStationPos(startPos);
    setFocusedLocation(startPos); // Haritayı oraya götür
    setIsCreating(true);
  };

  const handleCancel = () => {
    setIsCreating(false);
    setNewStationPos(null);
    setFormData({ name: '' });
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!newStationPos) return;

    try {
      await createStation({
          name: formData.name,
          latitude: newStationPos.lat,
          longitude: newStationPos.lng
      });
      alert('İstasyon başarıyla eklendi!');
      handleCancel();
      fetchStations();
    } catch (error) {
      console.error('Hata:', error);
      alert('İstasyon eklenirken bir hata oluştu.');
    }
  };

  const handleStationClick = (lat, lng) => {
      setFocusedLocation({ lat, lng });
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full relative">
      {/* Sol Panel: Liste ve Form (4 Sütun) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
        
        {/* Form Kartı */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-100">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">İstasyon Yönetimi</h2>
          </div>

          {!isCreating ? (
              <button 
                onClick={handleCreateStart}
                className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold shadow-md transition flex justify-center items-center"
              >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Yeni İstasyon Oluştur
              </button>
          ) : (
            <form onSubmit={handleSave} className="space-y-4">
                <div className="bg-amber-50 p-3 rounded-lg text-amber-800 text-sm mb-4 border border-amber-200">
                    📍 Haritadaki sarı pini sürükleyerek konumu belirleyin.
                </div>

                <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">İlçe Adı</label>
                <input 
                    type="text" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition" 
                    placeholder="Örn: Başiskele"
                    required 
                    autoFocus
                />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Enlem</label>
                    <input 
                    type="number" 
                    value={newStationPos?.lat || ''}
                    readOnly
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                </div>
                <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Boylam</label>
                    <input 
                    type="number" 
                    value={newStationPos?.lng || ''}
                    readOnly
                    className="w-full px-4 py-2 bg-slate-100 border border-slate-300 rounded-lg text-slate-500 cursor-not-allowed"
                    />
                </div>
                </div>

                <div className="flex space-x-3 pt-2">
                    <button type="button" onClick={handleCancel} className="flex-1 bg-white border border-slate-300 text-slate-700 py-2 rounded-lg font-semibold hover:bg-slate-50 transition">
                        İptal
                    </button>
                    <button type="submit" className="flex-1 bg-green-600 hover:bg-green-700 text-white py-2 rounded-lg font-semibold shadow-md transition">
                        Kaydet
                    </button>
                </div>
            </form>
          )}
        </div>

        {/* Liste Kartı */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col min-h-[300px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full mr-2">{stations.length}</span>
            Kayıtlı İstasyonlar
          </h2>
          <div className="overflow-y-auto flex-grow space-y-2 pr-2 custom-scrollbar">
            {stations.map(station => (
              <div 
                key={station.id} 
                className="group p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition flex justify-between items-center"
              >
                <div className="cursor-pointer flex-grow" onClick={() => handleStationClick(station.latitude, station.longitude)}>
                  <div className="font-medium text-slate-800">{station.name}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                  </div>
                </div>
                <div className="flex space-x-2">
                    <button 
                        onClick={() => handleStationClick(station.latitude, station.longitude)}
                        className="text-slate-300 hover:text-blue-500 transition p-1"
                        title="Haritada Göster"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                        </svg>
                    </button>
                    <button 
                        onClick={async (e) => {
                            e.stopPropagation();
                            if(window.confirm('Bu istasyonu silmek istediğinize emin misiniz?')) {
                                try {
                                    await deleteStation(station.id);
                                    fetchStations();
                                } catch (err) {
                                    alert('Silme işlemi başarısız.');
                                }
                            }
                        }}
                        className="text-slate-300 hover:text-red-500 transition p-1"
                        title="Sil"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ Panel: Harita */}
      <div className="lg:col-span-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 h-[600px] lg:h-auto min-h-[500px] z-0">
        <MapContainer center={[40.7654, 29.9408]} zoom={11} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          
          {/* Uçuş Animasyonu Bileşeni */}
          <FlyToLocation location={focusedLocation} />

          {/* Yeni İstasyon Pini (Sürüklenebilir) */}
          {isCreating && newStationPos && (
              <DraggableMarker 
                position={newStationPos} 
                setPosition={setNewStationPos} 
              />
          )}

          {/* Mevcut İstasyonlar */}
          {stations.map(station => (
            <Marker key={station.id} position={[station.latitude, station.longitude]}>
              <Popup>
                <div className="text-center">
                  <strong className="text-slate-900 block mb-1">{station.name}</strong>
                  <span className="text-xs text-slate-500">{station.latitude}, {station.longitude}</span>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
};

export default StationsPage;
