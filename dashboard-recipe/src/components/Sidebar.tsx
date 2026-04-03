import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { 
  LayoutDashboard, PlusCircle, LogOut, UtensilsCrossed, 
  Settings, Layers, ChefHat, PanelLeftClose, PanelLeftOpen 
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSidebar } from './context/SidebarContext';

const Sidebar = () => {
  const { isCollapsed, toggleSidebar } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', path: '/dashboard' },
    { icon: ChefHat, label: 'Resep Saya', path: '/my-recipes' },
    { icon: PlusCircle, label: 'Tambah Resep', path: '/add-recipe' },
    { icon: Settings, label: 'Pengaturan', path: '/update-profile' },
  ];

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (!error) navigate('/login');
  };

  return (
    <aside className={`h-screen bg-white border-r border-gray-100 fixed left-0 top-0 hidden md:flex flex-col z-[60] transition-all duration-500 ease-in-out ${isCollapsed ? 'w-24' : 'w-72'}`}>
      <div className={`p-6 flex items-center transition-all duration-500 ${isCollapsed ? 'justify-center' : 'justify-between'} mb-6`}>
        <div className="flex items-center gap-3">
          <div className="bg-yellow-500 p-2.5 rounded-2xl text-white shadow-lg shadow-yellow-200 flex-shrink-0 flex items-center justify-center">
            <UtensilsCrossed size={22} />
          </div>
          <AnimatePresence>
            {!isCollapsed && (
              <motion.span initial={{ opacity: 0, width: 0 }} animate={{ opacity: 1, width: 'auto' }} exit={{ opacity: 0, width: 0 }} className="font-black text-xl text-gray-800 whitespace-nowrap overflow-hidden">
                Resepku
              </motion.span>
            )}
          </AnimatePresence>
        </div>
        {!isCollapsed && (
          <button onClick={() => toggleSidebar(true)} className="p-2 rounded-xl text-gray-400 hover:bg-gray-50 hover:text-yellow-600 transition-all">
            <PanelLeftClose size={20} />
          </button>
        )}
      </div>

      {isCollapsed && (
        <div className="flex justify-center mb-6">
          <button onClick={() => toggleSidebar(false)} className="p-2 rounded-xl text-yellow-600 bg-yellow-50 hover:bg-yellow-100 transition-all">
            <PanelLeftOpen size={20} />
          </button>
        </div>
      )}

      <nav className="flex-1 px-4 space-y-2">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              className={`w-full relative group flex items-center py-4 rounded-2xl transition-all duration-500 ${isCollapsed ? 'justify-center' : 'px-6'} ${
                isActive ? 'text-yellow-600 bg-gradient-to-r from-yellow-50 to-transparent' : 'text-gray-400 hover:bg-gray-50'
              }`}
            >
              {isActive && (
                <motion.div layoutId="activeIndicator" className="absolute left-0 w-1.5 h-10 bg-yellow-500 rounded-r-full shadow-[2px_0_8px_rgba(234,179,8,0.3)]" />
              )}
              <item.icon size={22} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-yellow-500' : ''} />
              {!isCollapsed && <span className={`ml-4 text-sm font-bold ${isActive ? 'text-gray-900' : 'text-gray-500'}`}>{item.label}</span>}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-gray-50">
        <button onClick={handleLogout} className={`w-full flex items-center text-gray-400 hover:text-red-500 hover:bg-red-50 py-4 rounded-2xl transition-all duration-300 font-bold ${isCollapsed ? 'justify-center' : 'px-6 gap-4'}`}>
          <LogOut size={22} />
          {!isCollapsed && <span className="text-sm">Keluar Aplikasi</span>}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;