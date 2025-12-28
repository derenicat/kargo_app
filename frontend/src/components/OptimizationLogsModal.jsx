const OptimizationLogsModal = ({ logs, onClose }) => {
  if (!logs || !Array.isArray(logs)) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[2000] flex justify-center items-center p-4 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-slate-900 rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col overflow-hidden animate-fade-in border border-slate-700" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="p-6 border-b border-slate-800 flex justify-between items-center shrink-0">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-3 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Algoritma Karar Defteri
            </h2>
            <p className="text-xs text-slate-400 mt-1 uppercase tracking-widest font-black">Genetik Optimizasyon Süreç Logları</p>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-full hover:bg-slate-800 transition">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-grow overflow-y-auto p-6 space-y-2 bg-slate-950 font-mono text-sm custom-scrollbar">
            {logs.map((log, idx) => {
                const isHeader = log.includes('---');
                const isGeneration = log.includes('Jenerasyon');
                
                return (
                    <div key={idx} className={`
                        py-1 px-3 rounded
                        ${isHeader ? 'text-blue-400 font-bold mt-4 border-l-2 border-blue-500 bg-blue-500/5' : ''}
                        ${isGeneration ? 'text-green-400' : 'text-slate-300'}
                        ${!isHeader && !isGeneration ? 'pl-8 opacity-80' : ''}
                    `}>
                        {log}
                    </div>
                )
            })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900 text-center">
            <span className="text-[10px] text-slate-500 uppercase font-bold tracking-tighter">Bu veriler algoritmanın gerçek zamanlı kararlarını temsil eder.</span>
        </div>
      </div>
    </div>
  );
};

export default OptimizationLogsModal;
