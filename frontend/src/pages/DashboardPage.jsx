import { useState, useEffect } from 'react';
import api from '../services/api'; 
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, LineChart, Line } from 'recharts';

const DashboardPage = () => {
  const [summaryData, setSummaryData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      const response = await api.get('/optimize/summary');
      
      // VERİ DÖNÜŞTÜRME (PIVOT)
      // Backend'den gelen: [{date, mode, total_cost}, ...]
      // Recharts'ın beklediği: [{date, unlimited: 100, max_weight: 80, ...}, ...]
      
      const pivotMap = {};
      response.data.forEach(item => {
          const dateStr = new Date(item.date).toLocaleDateString('tr-TR', { day: 'numeric', month: 'short' });
          if (!pivotMap[dateStr]) {
              pivotMap[dateStr] = { date: dateStr };
          }
          pivotMap[dateStr][item.mode] = parseFloat(item.total_cost).toFixed(1);
          pivotMap[dateStr][`${item.mode}_cap`] = parseFloat(item.avg_capacity).toFixed(1);
      });

      setSummaryData(Object.values(pivotMap));
    } catch (error) {
      console.error('Dashboard verisi yüklenemedi:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-10 text-center font-bold">Veriler Analiz Ediliyor...</div>;

  return (
    <div className="space-y-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
        <h1 className="text-3xl font-black text-slate-900 mb-2">Karar Destek Sistemi</h1>
        <p className="text-slate-500 text-lg">Farklı optimizasyon stratejilerinin maliyet ve verimlilik karşılaştırması.</p>
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
                <Line type="monotone" dataKey="unlimited_cap" name="Sınırsız Verim" stroke="#2563eb" strokeWidth={3} dot={{r: 6}} activeDot={{r: 8}} />
                <Line type="monotone" dataKey="max_weight_cap" name="Max Ağırlık Verim" stroke="#10b981" strokeWidth={3} dot={{r: 6}} />
                <Line type="monotone" dataKey="max_count_cap" name="Max Adet Verim" stroke="#f59e0b" strokeWidth={3} dot={{r: 6}} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* Bilgi Kutusu */}
      <div className="bg-blue-900 text-white p-8 rounded-3xl shadow-xl flex items-center justify-between overflow-hidden relative">
          <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Nasıl Yorumlanmalı?</h3>
              <p className="text-blue-100 max-w-2xl text-sm leading-relaxed">
                  Grafikler, seçilen tarihte her üç algoritmanın da çalıştırılması durumunda ortaya çıkan maliyet farklarını gösterir. 
                  Genellikle <strong>Sınırsız</strong> mod tüm kargoları taşıdığı için daha yüksek maliyetli, 
                  <strong>Sabit</strong> modlar ise kapasite kısıtı nedeniyle daha düşük maliyetli ancak eksik kargolu sonuçlar üretir.
              </p>
          </div>
          <div className="absolute right-0 bottom-0 opacity-10 -mr-10 -mb-10">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-64 w-64" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 2v-6m0 10v4a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5z" />
              </svg>
          </div>
      </div>
    </div>
  );
};

export default DashboardPage;