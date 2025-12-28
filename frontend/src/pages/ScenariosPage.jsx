import { useState, useEffect } from 'react';
import api, { getCargoByDate, seedRandomCargo } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ScenariosPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [cargoItems, setCargoItems] = useState([]);
  const [scenarios, setScenarios] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDailyCargo();
    fetchActiveScenarios();
  }, [selectedDate]);

  const fetchDailyCargo = async () => {
    setLoading(true);
    try {
      const response = await getCargoByDate(selectedDate);
      setCargoItems(response.data);
    } catch (error) {
      setCargoItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveScenarios = async () => {
      try {
          const res = await api.get('/optimize/summary');
          setScenarios(res.data);
      } catch (err) {
          console.error(err);
      }
  };

  const handleSeedRandom = async () => {
    setLoading(true);
    try {
      await seedRandomCargo(selectedDate);
      fetchDailyCargo();
    } catch (error) {
      alert('Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteScenario = async (id) => {
      if (window.confirm('Bu senaryoyu silmek istediğinize emin misiniz?')) {
          try {
              await api.delete(`/optimize/${id}`);
              fetchActiveScenarios();
              fetchDailyCargo();
          } catch (err) { alert('Hata.'); }
      }
  };

  const stationSummary = cargoItems.reduce((acc, item) => {
    if (!acc[item.station_name]) acc[item.station_name] = { count: 0, weight: 0 };
    acc[item.station_name].count += 1;
    acc[item.station_name].weight += item.weight;
    return acc;
  }, {});

  const totalDailyWeight = cargoItems.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="space-y-10 pb-20">
      {/* Günlük Takip Paneli */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Günlük Talep Takibi</h1>
            <p className="text-slate-500 mt-1">Tarih seçerek kargo hareketlerini inceleyin.</p>
          </div>
          <div className="flex items-center gap-3">
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-slate-50 border border-slate-200 p-2.5 rounded-xl font-bold text-slate-900 outline-none" />
            <button onClick={handleSeedRandom} className="bg-amber-100 text-amber-700 px-4 py-2.5 rounded-xl font-bold text-sm hover:bg-amber-200 transition">Test Verisi Üret</button>
            <button onClick={() => navigate(`/optimize?date=${selectedDate}`)} className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl font-bold shadow-md transition">Planla</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase mb-4">İstasyon Dağılımı</h3>
                <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(stationSummary).map(([name, data]) => (
                        <div key={name} className="flex justify-between items-center p-3 bg-white rounded-xl border border-slate-100 shadow-sm">
                            <div className="font-bold text-slate-800 text-sm">{name}</div>
                            <div className="text-right text-xs font-black text-blue-600">{data.weight.toFixed(1)} kg</div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="lg:col-span-2 bg-slate-50 p-6 rounded-2xl border border-slate-100">
                <h3 className="text-sm font-black text-slate-400 uppercase mb-4">Tüm Paketler ({cargoItems.length})</h3>
                <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                    <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        <table className="w-full text-left">
                            <thead className="bg-slate-50 sticky top-0 z-10 border-b border-slate-200">
                                <tr>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">ID</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">İstasyon</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400">Ağırlık</th>
                                    <th className="px-4 py-3 text-[10px] font-black uppercase text-slate-400 text-right">Durum</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {cargoItems.map(item => (
                                    <tr key={item.id} className="text-xs hover:bg-slate-50 transition">
                                        <td className="px-4 py-3 font-mono text-slate-400">#{item.id}</td>
                                        <td className="px-4 py-3 font-bold text-slate-800">{item.station_name}</td>
                                        <td className="px-4 py-3 text-slate-600">{item.weight.toFixed(1)} kg</td>
                                        <td className="px-4 py-3 text-right">
                                            {item.status === 'PLANNED' ? 
                                                <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-black text-[9px]">PLANLANDI</span> :
                                                <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-black text-[9px]">BEKLEMEDE</span>
                                            }
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* Aktif Senaryolar Paneli */}
      <div className="bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-800 text-white">
          <h2 className="text-2xl font-black mb-6 flex items-center">
              <div className="w-2 h-8 bg-blue-500 rounded-full mr-4"></div>
              Kesinleşmiş Aktif Senaryolar
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {scenarios.map(sc => (
                  <div key={sc.id} className="bg-slate-800 p-6 rounded-2xl border border-slate-700 hover:border-blue-500 transition-all group relative">
                      <div className="flex justify-between items-start mb-4">
                          <div className="font-black text-xl">{new Date(sc.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long' })}</div>
                          <button onClick={() => handleDeleteScenario(sc.id)} className="text-slate-500 hover:text-red-500 transition p-1">
                              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                  <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                              </svg>
                          </button>
                      </div>
                      <div className="space-y-2">
                          <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-400 uppercase tracking-widest">Strateji</span>
                              <span className="text-blue-400 font-black">{(sc.mode || 'unlimited').toUpperCase()}</span>
                          </div>
                          <div className="flex justify-between text-xs font-bold">
                              <span className="text-slate-400 uppercase tracking-widest">Maliyet</span>
                              <span className="text-white font-black font-mono">{parseFloat(sc.total_cost || 0).toFixed(1)}</span>
                          </div>
                      </div>
                      <button 
                        onClick={() => {
                            const d = new Date(sc.date);
                            const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                            navigate(`/optimize?date=${formattedDate}`);
                        }}
                        className="mt-6 w-full bg-slate-700 group-hover:bg-blue-600 py-2.5 rounded-xl font-bold text-sm transition-all"
                      >
                          Senaryoyu Görüntüle
                      </button>
                  </div>
              ))}
              {scenarios.length === 0 && <p className="text-slate-500 italic py-10 text-center col-span-full">Henüz kesinleşmiş bir planlama bulunmuyor.</p>}
          </div>
      </div>
    </div>
  );
};

export default ScenariosPage;
