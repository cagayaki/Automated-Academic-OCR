import { Link, useLocation } from 'react-router-dom';
import { Home, UploadCloud, FileText, Settings } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const links = [
    { name: 'Dashboard', path: '/', icon: <Home size={20} /> },
    { name: 'Upload Document', path: '/upload', icon: <UploadCloud size={20} /> },
    { name: 'Reports', path: '/results/0', icon: <FileText size={20} /> }, // temporary link
    { name: 'Settings', path: '/settings', icon: <Settings size={20} /> }
  ];

  return (
    <aside className="w-64 bg-slate-900 text-slate-300 flex flex-col h-screen shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-slate-700 bg-slate-950">
        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center mr-3 shadow-lg shadow-blue-500/30">
          <span className="text-white font-bold text-lg">V</span>
        </div>
        <h1 className="text-lg font-semibold text-white tracking-wide">VerifyApp</h1>
      </div>
      <nav className="flex-1 px-4 py-8 space-y-2">
        {links.map((link) => {
          // Simple active state checking
          const isActive = location.pathname === link.path || (link.path !== '/' && location.pathname.startsWith(link.path.split('/')[0] + '/' + link.path.split('/')[1]));
          
          return (
            <Link
              key={link.name}
              to={link.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                isActive 
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-900/50 translate-x-1' 
                  : 'hover:bg-slate-800 hover:text-white hover:translate-x-1'
              }`}
            >
              {link.icon}
              <span className="font-medium">{link.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-700/50 bg-slate-900/50 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold text-white shadow-inner">
            AD
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-sm font-medium text-white truncate">Registrar</p>
            <p className="text-xs text-slate-500 truncate">Admin Office</p>
          </div>
        </div>
        <button 
          onClick={() => {
            localStorage.removeItem('ocr_token');
            localStorage.removeItem('ocr_user');
            window.location.href = '/login';
          }}
          className="w-full py-2 bg-slate-800/80 hover:bg-rose-600 text-slate-300 hover:text-white rounded-md text-sm font-medium transition-colors border border-slate-700 hover:border-rose-500 shadow-sm"
        >
          Sign out
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
