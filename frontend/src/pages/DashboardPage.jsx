import { useState, useEffect } from 'react';
import api, { resetAllData } from '../services/api'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const DashboardPage = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const response = await api.get('/optimize/summary');
      console.log('Dashboard API Response:', response.data); // DEBUG

      const pivotMap = {};
      if (response.data && Array.isArray(response.data)) {
          response.data.forEach(item => {
              const dateStr = new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
              if (!pivotMap[dateStr]) {
                  pivotMap[dateStr] = { date: dateStr };
              }
              
              // Maliyet
              pivotMap[dateStr][item.mode] = parseFloat(item.total_cost || 0).toFixed(1);
              
              // Verimlilik (Anahtar ismine dikkat: unlimited_cap, max_weight_cap...)
              const capacity = parseFloat(item.avg_capacity || 0);
              pivotMap[dateStr][`${item.mode}_cap`] = capacity.toFixed(1);
          });
      }
      
      console.log('Processed Chart Data:', Object.values(pivotMap)); // DEBUG
      setSummaryData(Object.values(pivotMap));
    } catch (error) {
      console.error('Dashboard verisi yüklenemedi:', error);
      setSummaryData([]);
    } finally {
      setLoading(false);
    }
  };

  const handleResetAll = async () => {
      if(window.confirm("DİKKAT: Tüm kargo, senaryo ve rota verileri kalıcı olarak silinecek. İstasyon ve Araç tanımları korunacak. Onaylıyor musunuz?")) {
          try {
              await resetAllData();
              setSummaryData([]);
              alert("Sistem sıfırlandı.");
          } catch(err) {
              alert("Sıfırlama hatası.");
          }
      }
  };
  if (loading) return <div className="p-10 text-center font-bold">Veriler Analiz Ediliyor...</div>;

  return (
    <div className="space-y-8">
      
      <div className="flex justify-end">
          <button onClick={handleResetAll} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-lg font-bold text-xs hover:bg-red-600 hover:text-white transition">
              Tüm Kargo Verilerini Sıfırla
          </button>
      </div>

      <div className="grid grid-cols-1 gap-8">
        
        {/* Maliyet Karşılaştırma Grafiği */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            Strateji Bazlı Maliyet Karşılaştırması (Benchmark)
          </h2>
          <div className="h-[450px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }}
                />
                <Legend iconType="circle" wrapperStyle={{paddingTop: '20px'}} />
                <Bar dataKey="unlimited" name="Sınırsız (Maliyet Odaklı)" fill="#2563eb" radius={[6, 6, 0, 0]} barSize={30} />
                <Bar dataKey="max_weight" name="Sabit (Ağırlık Odaklı)" fill="#10b981" radius={[6, 6, 0, 0]} barSize={30} />
                <Bar dataKey="max_count" name="Sabit (Adet Odaklı)" fill="#f59e0b" radius={[6, 6, 0, 0]} barSize={30} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Verimlilik Trendi (Çizgi Grafik) */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
          <h2 className="text-xl font-bold text-slate-800 mb-8 flex items-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Kapasite Verimlilik Trendi (%)
          </h2>
          <div className="h-[350px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={summaryData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgba(0,0,0,0.1)' }} />
                <Legend />
                <Line type="monotone" dataKey="unlimited_cap" name="Sınırsız Verim" stroke="#2563eb" strokeWidth={3} dot={{r: 6}} activeDot={{r: 8}} connectNulls />
                <Line type="monotone" dataKey="max_weight_cap" name="Max Ağırlık Verim" stroke="#10b981" strokeWidth={3} dot={{r: 6}} connectNulls />
                <Line type="monotone" dataKey="max_count_cap" name="Max Adet Verim" stroke="#f59e0b" strokeWidth={3} dot={{r: 6}} connectNulls />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardPage;
