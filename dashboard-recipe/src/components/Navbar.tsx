import React, { useState, useEffect, useRef } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Search, Bell, User, Menu, Settings, LogOut } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '../App.tsx';
import { getProfile } from '../services/profileService';
import { supabase } from '../lib/supabaseClient';

const Navbar: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [profile, setProfile] = useState<any>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (session) {
      getProfile(session.user.id).then(setProfile);
    }
  }, [session]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (location.pathname === '/login' || location.pathname === '/register') return null;

  return (
    <nav className="sticky top-0 z-40 w-full bg-white/80 backdrop-blur-md border-b border-yellow-50 px-4 md:px-8 py-3">
      <div className="flex items-center justify-between">
        
        {/* Kiri: Search Bar */}
        <div className="flex items-center flex-1">
          <div className="flex md:hidden items-center gap-2 mr-4">
            <div className="bg-yellow-500 p-1.5 rounded-lg text-white">
              <Menu size={18} />
            </div>
          </div>

          <div className="relative w-full max-w-md hidden sm:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="Cari inspirasi masak hari ini..."
              className="w-full bg-gray-50 border-none rounded-xl py-2.5 pl-10 pr-4 text-sm outline-none focus:ring-2 focus:ring-yellow-500/20 transition-all"
            />
          </div>
        </div>

        {/* Kanan: Notifikasi & Profil */}
        <div className="flex items-center gap-2 md:gap-5">
          <button className="p-2 text-gray-400 hover:text-yellow-500 transition-colors relative">
            <Bell size={20} />
            <span className="absolute top-2 right-2.5 w-2 h-2 bg-yellow-500 rounded-full border-2 border-white"></span>
          </button>

          <div className="h-6 w-[1px] bg-gray-200 hidden md:block"></div>

          {/* User Profile Container dengan Hover Logic */}
          <div 
            className="relative py-2" 
            onMouseEnter={() => setIsDropdownOpen(true)}
            onMouseLeave={() => setIsDropdownOpen(false)}
          >
            <div className="flex items-center gap-3 cursor-pointer group">
              <div className="text-right hidden md:block">
                <p className="text-sm font-bold text-gray-800 leading-none group-hover:text-yellow-500 transition-colors">
                  {profile?.full_name || 'hai put'}
                </p>
              </div>

              <motion.div 
                whileHover={{ scale: 1.05 }}
                className="w-10 h-10 rounded-xl overflow-hidden border-2 border-yellow-100 shadow-sm shadow-yellow-100 bg-yellow-50 flex items-center justify-center text-yellow-500"
              >
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User size={20} />
                )}
              </motion.div>
            </div>

            {/* Dropdown Menu */}
            <AnimatePresence>
              {isDropdownOpen && (
                <motion.div 
                  initial={{ opacity: 0, y: 5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 5 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-1 w-48 bg-white border border-yellow-50 rounded-2xl shadow-xl shadow-yellow-900/5 p-2 z-50"
                >
                  <button 
                    onClick={() => { navigate('/settings'); setIsDropdownOpen(false); }}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-600 hover:bg-yellow-50 hover:text-yellow-600 rounded-xl transition-all"
                  >
                    <Settings size={18} />
                    Update Profile
                  </button>
                  
                  <div className="h-[1px] bg-gray-50 my-1"></div>

                  <button 
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 rounded-xl transition-all"
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;