const RejectedItemsModal = ({ items, onClose }) => {
  if (!items || items.length === 0) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-[2000] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[70vh] flex flex-col overflow-hidden animate-fade-in" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="bg-red-600 p-5 flex justify-between items-center text-white shrink-0">
          <div>
            <h2 className="text-xl font-bold flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                Plana Dahil Edilemeyen Paketler
            </h2>
            <p className="text-xs opacity-80 mt-1">Mevcut filo kapasitesi yetersiz olduğu için bu paketler taşınamamaktadır.</p>
          </div>
          <button onClick={onClose} className="hover:bg-white/10 p-2 rounded-full transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 custom-scrollbar">
            <table className="w-full text-left border-collapse">
                <thead className="bg-slate-50 sticky top-0">
                    <tr>
                        <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase border-b border-slate-100">Takip No</th>
                        <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase border-b border-slate-100">İstasyon</th>
                        <th className="px-4 py-3 text-xs font-black text-slate-400 uppercase border-b border-slate-100 text-right">Ağırlık</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-slate-50">
                    {items.map((item) => (
                        <tr key={item.id} className="hover:bg-red-50/30 transition">
                            <td className="px-4 py-3 text-xs font-mono text-slate-400">#{item.id}</td>
                            <td className="px-4 py-3 text-sm font-bold text-slate-800">{item.station_name || 'Bilinmiyor'}</td>
                            <td className="px-4 py-3 text-sm font-black text-red-600 text-right">{item.weight.toFixed(1)} kg</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-between items-center text-sm font-bold">
            <span className="text-slate-500 uppercase tracking-widest text-[10px]">Toplam Kayıp Yük:</span>
            <span className="text-red-600">{items.reduce((sum, i) => sum + i.weight, 0).toFixed(1)} kg</span>
        </div>
      </div>
    </div>
  );
};

export default RejectedItemsModal;
