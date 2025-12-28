import { Link, Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Layout = () => {
  const location = useLocation();
  const { isAdmin, logout } = useAuth();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-slate-800 text-white shadow-sm' : 'text-slate-300 hover:text-white';
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-slate-900 shadow-xl border-b border-slate-800 sticky top-0 z-[1000]">
        <div className="container mx-auto px-6">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group shrink-0">
              <div className="bg-blue-600 p-2.5 rounded-2xl group-hover:rotate-12 transition-transform shadow-lg shadow-blue-500/20">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-2xl font-black text-white tracking-tighter">Kargo<span className="text-blue-500">Soft</span></span>
            </Link>

            {/* Orta Menü (Genel) */}
            <div className="hidden md:flex bg-slate-800/50 p-1 rounded-2xl border border-slate-700 mx-4 overflow-hidden">
              <Link to="/user-cargo" className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${isActive('/user-cargo')}`}>
                Kargo Gönder
              </Link>
              <Link to="/track" className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${isActive('/track')}`}>
                Kargo Takip
              </Link>
              
              {/* Admin Menüsü (Sadece Giriş Yapınca Görünür) */}
              {isAdmin && (
                <>
                  <div className="w-px h-4 bg-slate-700 self-center mx-2"></div>
                  <Link to="/stations" className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${isActive('/stations')}`}>
                    İstasyonlar
                  </Link>
                  <Link to="/scenarios" className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${isActive('/scenarios')}`}>
                    Senaryolar
                  </Link>
                  <Link to="/dashboard" className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${isActive('/dashboard')}`}>
                    Dashboard
                  </Link>
                  <Link to="/vehicles" className={`px-5 py-2 rounded-xl text-sm font-black transition-all ${isActive('/vehicles')}`}>
                    Araçlar
                  </Link>
                </>
              )}
            </div>

            {/* Sağ Taraf: Auth / Action */}
            <div className="flex items-center space-x-4 shrink-0">
              {isAdmin ? (
                <>
                  <button 
                      onClick={logout}
                      className="bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-5 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all"
                  >
                      Çıkış Yap
                  </button>
                  <Link to="/scenarios" className="hidden lg:block bg-blue-600 hover:bg-blue-500 text-white px-6 py-3 rounded-2xl font-black text-sm shadow-lg shadow-blue-500/30 transition-all transform hover:-translate-y-0.5 active:scale-95">
                    Rota Planla
                  </Link>
                </>
              ) : (
                <Link to="/admin-login" className="bg-slate-800 text-slate-400 hover:text-white px-5 py-2 rounded-xl text-xs font-black tracking-widest uppercase transition-all">
                    Admin Girişi
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-6 py-10">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-10">
        <div className="container mx-auto px-6 text-center space-y-4">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-[0.2em]">
            Kocaeli Üniversitesi Yazılım Lab. I - Proje III
          </p>
          <div className="flex justify-center space-x-6 text-slate-300">
              <span className="hover:text-blue-500 cursor-pointer transition-colors text-xs font-bold uppercase">Dokümantasyon</span>
              <span className="hover:text-blue-500 cursor-pointer transition-colors text-xs font-bold uppercase">Gizlilik</span>
              <span className="hover:text-blue-500 cursor-pointer transition-colors text-xs font-bold uppercase">Destek</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
