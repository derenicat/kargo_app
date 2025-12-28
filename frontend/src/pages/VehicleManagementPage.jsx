import { useState, useEffect } from 'react';
import { getVehicles, createVehicle, updateVehicleStatus, deleteVehicle } from '../services/api';

const VehicleManagementPage = () => {
  const [vehicles, setVehicles] = useState([]);
  const [formData, setFormData] = useState({ name: '', capacity: '', is_rental: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVehicles();
  }, []);

  const fetchVehicles = async () => {
    try {
      const response = await getVehicles();
      setVehicles(response.data);
    } catch (error) {
      console.error('Araçlar yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await createVehicle({ ...formData, capacity: parseFloat(formData.capacity) });
      setFormData({ name: '', capacity: '', is_rental: false });
      fetchVehicles();
      alert('Araç başarıyla eklendi.');
    } catch (error) {
      alert('Hata oluştu.');
    }
  };

  const handleToggleActive = async (id, currentStatus) => {
    try {
      await updateVehicleStatus(id, !currentStatus);
      fetchVehicles();
    } catch (error) {
      alert('Durum güncellenemedi.');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Bu aracı silmek istediğinize emin misiniz?')) {
      try {
        await deleteVehicle(id);
        fetchVehicles();
      } catch (error) {
        alert('Silme başarısız.');
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Sol Panel: Araç Ekleme */}
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Yeni Araç Tanımla
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Araç Tanımı / Plaka</label>
              <input 
                type="text" 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Örn: 34 ABC 123"
                required 
              />
            </div>
            <div>
              <label className="block text-xs font-black text-slate-400 uppercase mb-1">Kapasite (kg)</label>
              <input 
                type="number" 
                value={formData.capacity}
                onChange={(e) => setFormData({...formData, capacity: e.target.value})}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                placeholder="Örn: 500"
                required 
              />
            </div>
            <div className="flex items-center p-3 bg-slate-50 rounded-xl">
                <input 
                    type="checkbox" 
                    id="is_rental"
                    checked={formData.is_rental}
                    onChange={(e) => setFormData({...formData, is_rental: e.target.checked})}
                    className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                />
                <label htmlFor="is_rental" className="ml-3 text-sm font-bold text-slate-700">Bu bir kiralık araç modelidir</label>
            </div>
            <button type="submit" className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition shadow-lg">
              Araç Kaydet
            </button>
          </form>
        </div>
      </div>

      {/* Sağ Panel: Araç Listesi */}
      <div className="lg:col-span-8 bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
            Aktif Filo ve Tanımlar
        </h2>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase font-black tracking-widest">
                    <tr>
                        <th className="px-6 py-4">Araç</th>
                        <th className="px-6 py-4">Kapasite</th>
                        <th className="px-6 py-4 text-center">Tür</th>
                        <th className="px-6 py-4 text-center">Durum</th>
                        <th className="px-6 py-4 text-right">İşlem</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                    {vehicles.map(v => (
                        <tr key={v.id} className={`hover:bg-slate-50 transition ${!v.is_active && 'opacity-50'}`}>
                            <td className="px-6 py-4 font-bold text-slate-900">{v.name}</td>
                            <td className="px-6 py-4 font-mono text-blue-600 font-bold">{v.capacity} kg</td>
                            <td className="px-6 py-4 text-center">
                                {v.is_rental ? 
                                    <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded text-[10px] font-bold">KİRALIK MODEL</span> : 
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded text-[10px] font-bold">ÖZ MAL</span>
                                }
                            </td>
                            <td className="px-6 py-4 text-center">
                                <button 
                                    onClick={() => handleToggleActive(v.id, v.is_active)}
                                    className={`px-3 py-1 rounded-full text-[10px] font-black tracking-widest transition ${v.is_active ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}
                                >
                                    {v.is_active ? 'AKTİF' : 'PASİF'}
                                </button>
                            </td>
                            <td className="px-6 py-4 text-right">
                                <button onClick={() => handleDelete(v.id)} className="text-slate-300 hover:text-red-500 transition">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
      </div>
    </div>
  );
};

export default VehicleManagementPage;
