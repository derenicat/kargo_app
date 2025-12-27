import { useState, useEffect } from 'react';
import { getStations, createScenario, getScenarios } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ScenariosPage = () => {
  const [stations, setStations] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [scenarioName, setScenarioName] = useState('');
  const [demands, setDemands] = useState({}); 
  const navigate = useNavigate();

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const [stRes, scRes] = await Promise.all([getStations(), getScenarios()]);
      setStations(stRes.data);
      setScenarios(scRes.data);
      
      const initialDemands = {};
      stRes.data.forEach(s => {
        initialDemands[s.id] = { cargo_count: 0, total_weight: 0 };
      });
      setDemands(initialDemands);
    } catch (error) {
      console.error('Veri yükleme hatası:', error);
    }
  };

  const handleDemandChange = (stationId, field, value) => {
    setDemands(prev => ({
      ...prev,
      [stationId]: { ...prev[stationId], [field]: parseFloat(value) || 0 }
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formattedDemands = Object.entries(demands)
      .filter(([_, data]) => data.cargo_count > 0 || data.total_weight > 0)
      .map(([id, data]) => ({
        station_id: parseInt(id),
        ...data
      }));

    if (formattedDemands.length === 0) {
        alert('Lütfen en az bir istasyon için talep girin.');
        return;
    }

    try {
      const response = await createScenario({ name: scenarioName, demands: formattedDemands });
      alert('Senaryo oluşturuldu!');
      navigate(`/optimize?id=${response.data.scenario.id}`);
    } catch (error) {
      console.error('Senaryo hatası:', error);
      alert('Senaryo oluşturulamadı.');
    }
  };

  return (
    <div className="space-y-10">
      {/* Üst Kısım: Form */}
      <div className="bg-white rounded-xl shadow-md border border-slate-200 overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50">
          <h1 className="text-2xl font-bold text-slate-900">Yeni Taşıma Senaryosu</h1>
          <p className="text-slate-500 mt-1">Günlük kargo taleplerini girerek optimizasyon işlemini başlatın.</p>
        </div>

        <form onSubmit={handleSubmit} className="p-8">
          <div className="max-w-xl mb-8">
            <label className="block text-sm font-semibold text-slate-700 mb-2">Senaryo Adı</label>
            <input 
              type="text" 
              placeholder="Örn: 28 Aralık Pazartesi Talepleri"
              value={scenarioName}
              onChange={(e) => setScenarioName(e.target.value)}
              className="w-full px-4 py-3 bg-white border border-slate-300 rounded-lg text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none transition shadow-sm"
              required 
            />
          </div>

          <div className="border border-slate-200 rounded-lg overflow-hidden shadow-sm mb-8">
            <table className="w-full text-left">
              <thead className="bg-slate-100 border-b border-slate-200">
                <tr>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">İlçe / İstasyon</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Kargo Sayısı (Adet)</th>
                  <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Toplam Ağırlık (kg)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {stations.map((station, idx) => (
                  <tr key={station.id} className={`hover:bg-blue-50/50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/30'}`}>
                    <td className="px-6 py-4 font-medium text-slate-800">{station.name}</td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        min="0"
                        className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="0"
                        onChange={(e) => handleDemandChange(station.id, 'cargo_count', e.target.value)}
                      />
                    </td>
                    <td className="px-6 py-3">
                      <input 
                        type="number" 
                        min="0"
                        className="w-32 px-3 py-2 bg-white border border-slate-300 rounded-md text-slate-900 focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition"
                        placeholder="0"
                        onChange={(e) => handleDemandChange(station.id, 'total_weight', e.target.value)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" className="bg-amber-500 hover:bg-amber-600 text-slate-900 px-8 py-3.5 rounded-xl font-bold text-base shadow-md transition-all transform hover:-translate-y-1 flex items-center">
              <span>Senaryoyu Kaydet ve Rota Planla</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 3.293a1 1 0 011.414 0l6 6a1 1 0 010 1.414l-6 6a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-4.293-4.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </form>
      </div>

      {/* Alt Kısım: Geçmiş */}
      <div>
        <h2 className="text-xl font-bold text-slate-800 mb-6 pl-1 border-l-4 border-blue-500">Geçmiş Senaryolar</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {scenarios.map(sc => (
            <div 
                key={sc.id} 
                onClick={() => navigate(`/optimize?id=${sc.id}`)} 
                className="group bg-white p-6 rounded-xl border border-slate-200 hover:border-blue-500 hover:shadow-md cursor-pointer transition-all relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
              </div>
              <h3 className="font-bold text-lg text-slate-800 mb-2 group-hover:text-blue-600 transition">{sc.name}</h3>
              <div className="flex items-center text-sm text-slate-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                {new Date(sc.created_at).toLocaleDateString('tr-TR', { year: 'numeric', month: 'long', day: 'numeric' })}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ScenariosPage;