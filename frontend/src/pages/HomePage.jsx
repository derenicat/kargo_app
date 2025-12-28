import { useNavigate } from 'react-router-dom';

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-16">
      {/* Hero Section */}
      <div className="text-center max-w-3xl space-y-4">
        <h1 className="text-5xl md:text-6xl font-black text-slate-900 tracking-tight">
          Lojistikte Akıllı <span className="text-blue-600 font-black">Rota</span> Dönemi
        </h1>
        <p className="text-lg text-slate-500 font-medium leading-relaxed">
          KargoSoft, Kocaeli'nin her köşesinden gelen paketleri gelişmiş genetik algoritmalarla 
          en verimli şekilde Umuttepe kampüsüne ulaştırır.
        </p>
      </div>

      {/* CTA Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 w-full max-w-5xl px-4">
        {/* Card 1: Kargo Gönder */}
        <div 
          onClick={() => navigate('/user-cargo')}
          className="group bg-white p-10 rounded-3xl shadow-xl border border-slate-100 cursor-pointer hover:border-blue-500 hover:shadow-2xl transition-all transform hover:-translate-y-2 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-blue-600 w-32 h-32 -mr-16 -mt-16 rounded-full opacity-10 group-hover:scale-150 transition-transform"></div>
          <div className="bg-blue-100 text-blue-600 p-4 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 group-hover:text-white transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-slate-900 mb-2">Kargo Gönder</h2>
          <p className="text-slate-500 font-medium">Yeni paket bilgilerini girin ve sistemimize dahil olun.</p>
          <div className="mt-8 flex items-center text-blue-600 font-black tracking-wider uppercase text-xs">
            Hemen Başla 
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>

        {/* Card 2: Kargo Takip */}
        <div 
          onClick={() => navigate('/track')}
          className="group bg-slate-900 p-10 rounded-3xl shadow-xl border border-slate-800 cursor-pointer hover:border-blue-500 hover:shadow-2xl transition-all transform hover:-translate-y-2 relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 bg-white w-32 h-32 -mr-16 -mt-16 rounded-full opacity-5 group-hover:scale-150 transition-transform"></div>
          <div className="bg-white/10 text-white p-4 rounded-2xl w-fit mb-6 group-hover:bg-blue-600 transition-colors">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h2 className="text-2xl font-black text-white mb-2">Kargo Takip</h2>
          <p className="text-slate-400 font-medium">Paket numaranızla kargonuzun hangi rotada olduğunu öğrenin.</p>
          <div className="mt-8 flex items-center text-blue-400 font-black tracking-wider uppercase text-xs">
            Sorgulama Yap
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 ml-2 group-hover:translate-x-2 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
            </svg>
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-wrap justify-center gap-8 text-slate-400 text-xs font-bold uppercase tracking-widest">
          <div className="flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              Canlı Takip
          </div>
          <div className="flex items-center">
              <div className="w-2 h-2 bg-blue-500 rounded-full mr-2"></div>
              Akıllı Optimizasyon
          </div>
          <div className="flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Dinamik Filo
          </div>
      </div>
    </div>
  );
};

export default HomePage;
