import { Link, Outlet, useLocation } from 'react-router-dom';

const Layout = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path ? 'bg-slate-800 text-white' : 'text-slate-300 hover:bg-slate-800 hover:text-white';
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50">
      {/* Navbar */}
      <nav className="bg-slate-900 shadow-lg border-b border-slate-800 sticky top-0 z-[1000]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            {/* Logo */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div className="bg-blue-600 p-2 rounded-lg group-hover:bg-blue-500 transition">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <span className="text-xl font-bold text-white tracking-tight">Kargo<span className="text-blue-500">Soft</span></span>
            </Link>

            {/* Menü */}
            <div className="flex space-x-2">
              <Link to="/user-cargo" className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive('/user-cargo')}`}>
                Kargo Gönder
              </Link>
              <Link to="/stations" className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive('/stations')}`}>
                İstasyon Yönetimi
              </Link>
              <Link to="/scenarios" className={`px-4 py-2 rounded-md text-sm font-medium transition-all ${isActive('/scenarios')}`}>
                Talep & Senaryolar
              </Link>
            </div>

            {/* CTA Button */}
            <Link to="/scenarios" className="hidden md:block bg-amber-500 hover:bg-amber-600 text-slate-900 px-5 py-2.5 rounded-lg font-bold text-sm shadow-md transition transform hover:-translate-y-0.5">
              Yeni Rota Planla
            </Link>
          </div>
        </div>
      </nav>

      {/* Main Content - Flex Grow ile boşluğu doldurur */}
      <main className="flex-grow container mx-auto px-6 py-8">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="container mx-auto px-6 py-6 text-center text-slate-500 text-sm">
          &copy; 2025 Kocaeli Üniversitesi Yazılım Lab. I - Proje III
        </div>
      </footer>
    </div>
  );
};

export default Layout;