import { useState, useEffect } from 'react';
import { getCargoByDate, seedRandomCargo } from '../services/api';
import { useNavigate } from 'react-router-dom';

const ScenariosPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [cargoItems, setCargoItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    fetchDailyCargo();
  }, [selectedDate]);

  const fetchDailyCargo = async () => {
    setLoading(true);
    try {
      const response = await getCargoByDate(selectedDate);
      setCargoItems(response.data);
    } catch (error) {
      console.error('Kargo yükleme hatası:', error);
      setCargoItems([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSeedRandom = async () => {
    setLoading(true);
    try {
      await seedRandomCargo(selectedDate);
      fetchDailyCargo();
      alert('Rastgele test kargoları oluşturuldu!');
    } catch (error) {
      console.error('Seed hatası:', error);
      alert('Hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const stationSummary = cargoItems.reduce((acc, item) => {
    if (!acc[item.station_name]) {
      acc[item.station_name] = { count: 0, weight: 0 };
    }
    acc[item.station_name].count += 1;
    acc[item.station_name].weight += item.weight;
    return acc;
  }, {});

  const totalDailyWeight = cargoItems.reduce((sum, item) => sum + item.weight, 0);

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Günlük Talep Takibi</h1>
            <p className="text-slate-500 mt-1">Seçili tarihteki kargo hareketlerini inceleyin veya test verisi üretin.</p>
          </div>
          <div className="flex flex-col md:flex-row items-center gap-3">
            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 flex items-center space-x-3">
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="bg-transparent border-none text-slate-900 font-bold focus:ring-0 outline-none cursor-pointer"
                />
            </div>
            <div className="flex gap-2">
                <button 
                    onClick={handleSeedRandom}
                    disabled={loading}
                    className="bg-amber-100 text-amber-700 hover:bg-amber-200 px-4 py-2.5 rounded-lg font-bold transition flex items-center shadow-sm"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                    </svg>
                    Sentetik Veri Oluştur
                </button>
                <button 
                    onClick={() => navigate(`/optimize?date=${selectedDate}`)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-lg font-bold shadow-md transition transform active:scale-95"
                >
                    Bu Günü Planla
                </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
            <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
                <span className="text-blue-600 text-xs font-black uppercase tracking-widest">Toplam Yük</span>
                <div className="text-3xl font-black text-blue-900 mt-1">{totalDailyWeight.toFixed(1)} <span className="text-lg font-normal">kg</span></div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Toplam Paket</span>
                <div className="text-3xl font-black text-slate-900 mt-1">{cargoItems.length} <span className="text-lg font-normal">Adet</span></div>
            </div>
            <div className="bg-slate-50 border border-slate-100 p-6 rounded-2xl">
                <span className="text-slate-500 text-xs font-black uppercase tracking-widest">Aktif İstasyon</span>
                <div className="text-3xl font-black text-slate-900 mt-1">{Object.keys(stationSummary).length} <span className="text-lg font-normal">Bölge</span></div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1 bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-blue-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
                </svg>
                İstasyon Özetleri
            </h2>
            <div className="space-y-3">
                {Object.keys(stationSummary).length === 0 ? (
                    <p className="text-slate-400 text-sm text-center py-10 italic">Veri bulunamadı.</p>
                ) : (
                    Object.entries(stationSummary).map(([name, data]) => (
                        <div key={name} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-blue-50 transition">
                            <div>
                                <div className="font-bold text-slate-800">{name}</div>
                                <div className="text-xs text-slate-500">{data.count} Paket</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm font-black text-slate-900">{data.weight.toFixed(1)} kg</div>
                                <div className="w-16 h-1 bg-slate-200 rounded-full mt-1 overflow-hidden">
                                    <div className="h-full bg-blue-500" style={{ width: `${(data.weight / (totalDailyWeight || 1)) * 100}%` }}></div>
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col">
            <h2 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Tüm Paket Hareketleri
            </h2>
            <div className="overflow-hidden border border-slate-100 rounded-xl flex-grow">
                <table className="w-full text-left">
                    <thead className="bg-slate-50 border-b border-slate-100">
                        <tr>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">ID</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">İstasyon</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Ağırlık</th>
                            <th className="px-6 py-3 text-xs font-bold text-slate-500 uppercase">Durum</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                        {loading ? (
                            <tr><td colSpan="4" className="text-center py-10">İşlem yapılıyor...</td></tr>
                        ) : cargoItems.length === 0 ? (
                            <tr><td colSpan="4" className="text-center py-10 text-slate-400 text-sm">Bu tarihte kayıtlı kargo bulunmamaktadır.</td></tr>
                        ) : (
                            cargoItems.map(item => (
                                <tr key={item.id} className="hover:bg-slate-50/50 transition">
                                    <td className="px-6 py-4 text-xs font-mono text-slate-400">#{item.id}</td>
                                    <td className="px-6 py-4 font-bold text-slate-800 text-sm">{item.station_name}</td>
                                    <td className="px-6 py-4 text-sm text-slate-600">{item.weight.toFixed(1)} kg</td>
                                    <td className="px-6 py-4 text-sm">
                                        {item.status === 'PLANNED' ? (
                                            <span className="text-green-600 font-bold text-[10px] bg-green-50 px-2 py-0.5 rounded-full border border-green-100">PLANLANDI</span>
                                        ) : (
                                            <span className="text-amber-600 font-bold text-[10px] bg-amber-100 text-amber-700/10 px-2 py-0.5 rounded-full border border-amber-100">BEKLEMEDE</span>
                                        )}
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScenariosPage;