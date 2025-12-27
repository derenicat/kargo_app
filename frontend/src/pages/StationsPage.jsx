import { useState, useEffect } from 'react';
import { getStations, createStation } from '../services/api';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
    iconUrl: icon,
    shadowUrl: iconShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

const StationsPage = () => {
  const [stations, setStations] = useState([]);
  const [formData, setFormData] = useState({ name: '', latitude: '', longitude: '' });
  const [loading, setLoading] = useState(true);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createStation(formData);
      setFormData({ name: '', latitude: '', longitude: '' });
      fetchStations();
      alert('İstasyon başarıyla eklendi!');
    } catch (error) {
      console.error('Hata:', error);
      alert('İstasyon eklenirken bir hata oluştu.');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 h-full">
      {/* Sol Panel: Liste ve Form (4 Sütun) */}
      <div className="lg:col-span-4 space-y-6 flex flex-col h-full">
        
        {/* Form Kartı */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
          <div className="flex items-center space-x-2 mb-6 pb-4 border-b border-slate-100">
            <div className="bg-blue-100 p-2 rounded-lg">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-lg font-bold text-slate-800">Yeni İstasyon Ekle</h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">İlçe Adı</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition" 
                placeholder="Örn: Başiskele"
                required 
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Enlem</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.latitude}
                  onChange={(e) => setFormData({...formData, latitude: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="40.xxxx"
                  required 
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Boylam</label>
                <input 
                  type="number" 
                  step="any"
                  value={formData.longitude}
                  onChange={(e) => setFormData({...formData, longitude: e.target.value})}
                  className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                  placeholder="29.xxxx"
                  required 
                />
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 text-white py-3 rounded-lg font-semibold shadow-md hover:shadow-lg transition-all transform active:scale-95">
              Kaydet
            </button>
          </form>
        </div>

        {/* Liste Kartı - Flex grow ile alanı doldurur */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 flex-grow flex flex-col min-h-[300px]">
          <h2 className="text-lg font-bold text-slate-800 mb-4 flex items-center">
            <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full mr-2">{stations.length}</span>
            Kayıtlı İstasyonlar
          </h2>
          <div className="overflow-y-auto flex-grow space-y-2 pr-2 custom-scrollbar">
            {stations.map(station => (
              <div key={station.id} className="group p-3 rounded-lg border border-slate-100 hover:border-blue-300 hover:bg-blue-50 transition cursor-pointer flex justify-between items-center">
                <div>
                  <div className="font-medium text-slate-800">{station.name}</div>
                  <div className="text-xs text-slate-500 font-mono mt-0.5">
                    {station.latitude.toFixed(4)}, {station.longitude.toFixed(4)}
                  </div>
                </div>
                <div className="opacity-0 group-hover:opacity-100 transition text-blue-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ Panel: Harita (8 Sütun) */}
      <div className="lg:col-span-8 bg-white p-2 rounded-xl shadow-sm border border-slate-200 h-[600px] lg:h-auto min-h-[500px] z-0">
        <MapContainer center={[40.7654, 29.9408]} zoom={11} style={{ height: '100%', width: '100%', borderRadius: '0.75rem' }}>
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
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