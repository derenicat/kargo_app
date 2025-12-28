import { useState, useEffect } from 'react';
import { getStations, addCargo, getCargoByDate } from '../services/api';

const UserCargoPage = () => {
  const [stations, setStations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState([{ station_id: '', weight: '' }]);
  const [existingCargo, setExistingCargo] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchStations();
    fetchExistingCargo();
  }, [selectedDate]);

  const fetchStations = async () => {
    try {
      const response = await getStations();
      // Umuttepe'yi listeden çıkaralım, orası sadece varış noktası
      setStations(response.data.filter(s => !s.name.toLowerCase().includes('umuttepe')));
    } catch (error) {
      console.error('İstasyonlar yüklenemedi:', error);
    }
  };

  const fetchExistingCargo = async () => {
    try {
      const response = await getCargoByDate(selectedDate);
      setExistingCargo(response.data);
    } catch (error) {
      console.error('Kargolar yüklenemedi:', error);
    }
  };

  const handleAddItem = () => {
    setItems([...items, { station_id: '', weight: '' }]);
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleChange = (index, field, value) => {
    const newItems = [...items];
    newItems[index][field] = value;
    setItems(newItems);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formattedItems = items.map(item => ({
        station_id: parseInt(item.station_id),
        weight: parseFloat(item.weight)
      }));

      await addCargo({ date: selectedDate, items: formattedItems });
      alert('Kargo talepleriniz başarıyla kaydedildi!');
      setItems([{ station_id: '', weight: '' }]);
      fetchExistingCargo();
    } catch (error) {
      console.error('Kargo ekleme hatası:', error);
      alert('Kargo eklenirken bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'PLANNED': return <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded-full text-xs font-bold">PLANLANDI</span>;
      case 'REJECTED': return <span className="bg-red-100 text-red-700 px-2 py-0.5 rounded-full text-xs font-bold">REDDEDİLDİ</span>;
      default: return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-xs font-bold">BEKLEMEDE</span>;
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sol Form: Kargo Girişi */}
      <div className="lg:col-span-7 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-100">
            <div>
                <h1 className="text-2xl font-bold text-slate-900">Kargo Gönderimi</h1>
                <p className="text-slate-500 text-sm mt-1">Paket bilgilerinizi girerek taşıma talebi oluşturun.</p>
            </div>
            <div className="text-right">
                <label className="block text-xs font-bold text-slate-400 uppercase mb-1">Teslim Tarihi</label>
                <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="p-2 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 font-bold focus:ring-2 focus:ring-blue-500 outline-none"
                />
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {items.map((item, index) => (
              <div key={index} className="flex gap-4 items-end animate-fade-in">
                <div className="flex-grow">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">İstasyon (Nereden?)</label>
                  <select
                    value={item.station_id}
                    onChange={(e) => handleChange(index, 'station_id', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  >
                    <option value="">İstasyon Seçin</option>
                    {stations.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div className="w-32">
                  <label className="block text-xs font-semibold text-slate-500 mb-1 uppercase">Ağırlık (kg)</label>
                  <input
                    type="number"
                    step="any"
                    min="0.1"
                    placeholder="0.0"
                    value={item.weight}
                    onChange={(e) => handleChange(index, 'weight', e.target.value)}
                    className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-slate-900 focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
                {items.length > 1 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(index)}
                    className="p-2.5 text-red-500 hover:bg-red-50 rounded-xl transition"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                )}
              </div>
            ))}

            <div className="pt-4 flex justify-between items-center">
              <button
                type="button"
                onClick={handleAddItem}
                className="flex items-center text-blue-600 font-bold hover:text-blue-700 transition"
              >
                <div className="bg-blue-100 p-1.5 rounded-lg mr-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                    </svg>
                </div>
                Başka Paket Ekle
              </button>

              <button
                type="submit"
                disabled={loading}
                className={`px-10 py-3 rounded-2xl font-bold text-white shadow-lg transition-all transform active:scale-95 ${loading ? 'bg-slate-400' : 'bg-slate-900 hover:bg-slate-800'}`}
              >
                {loading ? 'Kaydediliyor...' : 'Talepleri Gönder'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Sağ Panel: Mevcut Kargolar */}
      <div className="lg:col-span-5 space-y-6">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 h-full flex flex-col">
          <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Seçili Tarihteki Kargolarınız
          </h2>

          <div className="flex-grow overflow-y-auto pr-2 custom-scrollbar">
            {existingCargo.length === 0 ? (
              <div className="text-center py-20 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-medium">Bu tarih için henüz kargo girişi yapılmamış.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {existingCargo.map(cargo => (
                  <div key={cargo.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex justify-between items-center group hover:bg-white hover:shadow-md transition">
                    <div>
                      <div className="font-bold text-slate-900">{cargo.station_name}</div>
                      <div className="text-xs text-slate-500 font-medium mt-0.5">{parseFloat(cargo.weight).toFixed(1)} kg • Paket #{cargo.id}</div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(cargo.status)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="mt-6 pt-4 border-t border-slate-100">
            <div className="flex justify-between text-sm">
                <span className="text-slate-500 font-medium">Toplam Paket:</span>
                <span className="font-bold text-slate-900">{existingCargo.length} Adet</span>
            </div>
            <div className="flex justify-between text-sm mt-1">
                <span className="text-slate-500 font-medium">Toplam Ağırlık:</span>
                <span className="font-bold text-blue-600">{existingCargo.reduce((sum, c) => sum + parseFloat(c.weight), 0).toFixed(1)} kg</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserCargoPage;
