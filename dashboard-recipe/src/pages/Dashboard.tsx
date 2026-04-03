"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ChefHat, Plus, BookOpen, Clock, Layers, Star, 
  Flame, TrendingUp, ArrowRight, UtensilsCrossed, 
  Target, Award
} from 'lucide-react';

import MainLayout from '../components/MainLayout';
import Navbar from '../components/Navbar';
import { getRecipes } from '../services/recipeService';
import { getCategories } from '../services/categoryService';
import { useAuth } from '../App.tsx';

import type { Recipe } from '../types/recipe';
import type { Category } from '../types/category';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session } = useAuth();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const fullName = session?.user?.user_metadata?.full_name || "Koki Hebat";

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Mengambil semua resep milik user untuk statistik yang akurat
        const [recipeRes, catRes] = await Promise.all([
          getRecipes({ page: 0, limit: 1000, authorId: session?.user.id }),
          getCategories()
        ]);
        
        setRecipes(recipeRes.data || []);
        setTotalCount(recipeRes.count || 0);
        setCategories(catRes || []);
      } catch (err) {
        console.error("Gagal memuat data dashboard:", err);
      } finally {
        setLoading(false);
      }
    };
    if (session?.user.id) fetchData();
  }, [session]);

  // Statistik Lanjutan
  const stats = useMemo(() => {
    const total = recipes.length;
    const avgTime = total > 0 
      ? Math.round(recipes.reduce((acc, curr) => acc + (curr.cooking_time || 0), 0) / total)
      : 0;
    
    // Hitung level berdasarkan jumlah resep
    let level = "Pemula";
    let levelColor = "text-blue-600";
    if (total > 20) { level = "Executive Chef"; levelColor = "text-red-600"; }
    else if (total > 10) { level = "Sous Chef"; levelColor = "text-orange-600"; }
    else if (total > 5) { level = "Home Cook"; levelColor = "text-yellow-600"; }

    return [
      { label: 'Koleksi Resep', value: total, icon: BookOpen, color: 'text-blue-600', bg: 'bg-blue-50' },
      { label: 'Kategori Unik', value: [...new Set(recipes.map(r => r.category_id))].length, icon: Layers, color: 'text-purple-600', bg: 'bg-purple-50' },
      { label: 'Rata-rata Menit', value: `${avgTime}'`, icon: Clock, color: 'text-orange-600', bg: 'bg-orange-50' },
      { label: 'Level Dapur', value: level, icon: Award, color: levelColor, bg: 'bg-gray-50' },
    ];
  }, [recipes]);

  if (loading) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center min-h-screen bg-white">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
          >
            <ChefHat className="text-yellow-500 mb-4" size={48} />
          </motion.div>
          <p className="text-xs font-black text-gray-400 tracking-[0.3em] uppercase">Menganalisis Dapur...</p>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Navbar />
      <main className="flex-1 p-6 md:p-10 bg-[#fafafa] min-h-screen">
        
        {/* Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
          <div>
            <h1 className="text-3xl font-black text-gray-900 tracking-tighter mb-1">
              Ringkasan Dapur
            </h1>
            <p className="text-gray-500 text-sm font-medium">
              Senang melihatmu lagi, <span className="text-yellow-600 font-bold">{fullName}</span>!
            </p>
          </div>
          <button 
            onClick={() => navigate('/add-recipe')}
            className="flex items-center justify-center gap-3 bg-gray-900 hover:bg-yellow-500 text-white px-8 py-4 rounded-2xl font-bold text-sm transition-all shadow-xl shadow-gray-200 active:scale-95 group"
          >
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
            Tambah Resep Baru
          </button>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {stats.map((stat, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white p-6 rounded-[2.5rem] border border-gray-100 shadow-sm hover:shadow-md transition-all group"
            >
              <div className={`${stat.bg} ${stat.color} w-12 h-12 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                <stat.icon size={24} />
              </div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{stat.label}</p>
              <h4 className="text-2xl font-black text-gray-900 leading-none">{stat.value}</h4>
            </motion.div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Action Area */}
          <div className="lg:col-span-2 space-y-6">
            <button 
              onClick={() => navigate('/my-recipes')}
              className="w-full group bg-white p-8 rounded-[2.5rem] border border-gray-100 flex items-center justify-between hover:border-yellow-500 transition-all text-left shadow-sm"
            >
              <div className="flex items-center gap-6">
                <div className="bg-gray-900 text-white p-5 rounded-2xl group-hover:bg-yellow-500 transition-colors shadow-lg shadow-gray-200">
                  <UtensilsCrossed size={28} />
                </div>
                <div>
                  <h3 className="font-black text-gray-900 text-xl tracking-tight">Eksplor Koleksi Anda</h3>
                  <p className="text-sm text-gray-400 mt-1 font-medium italic">Anda telah menciptakan {recipes.length} hidangan sejauh ini.</p>
                </div>
              </div>
              <ArrowRight className="text-gray-300 group-hover:text-yellow-500 group-hover:translate-x-2 transition-all" size={28} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
                <div className="flex items-center gap-3 mb-4 text-orange-500">
                  <Flame size={24} />
                  <span className="text-[10px] font-black uppercase tracking-widest">Tips Dapur</span>
                </div>
                <h3 className="font-bold text-gray-900 text-base mb-2">Rahasia Aroma</h3>
                <p className="text-sm text-gray-400 leading-relaxed font-medium">Jangan mencuci daging merah sebelum dimasak agar tekstur dan rasa aslinya tetap terjaga saat dipanggang.</p>
              </div>

              <div className="bg-gray-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                <div className="relative z-10">
                  <div className="flex items-center gap-3 mb-4 text-yellow-500">
                    <Target size={24} />
                    <span className="text-[10px] font-black uppercase tracking-widest">Insight</span>
                  </div>
                  <h3 className="font-bold text-base mb-2">Target Berikutnya</h3>
                  <p className="text-sm text-gray-400 leading-relaxed font-medium">Buat 3 resep lagi untuk membuka lencana <span className="text-yellow-500 font-bold">"Pecinta Rempah"</span>.</p>
                </div>
                <TrendingUp size={120} className="absolute -bottom-10 -right-10 text-white/5 rotate-12 group-hover:scale-110 transition-transform" />
              </div>
            </div>
          </div>

          {/* Motivational Banner */}
          <div className="bg-yellow-500 rounded-[3rem] p-10 text-white relative overflow-hidden shadow-2xl shadow-yellow-200 flex flex-col justify-between min-h-[400px]">
              <div className="relative z-10">
                <Star className="mb-6 opacity-30" size={48} fill="white" />
                <h2 className="text-4xl font-black leading-[1.1] mb-6 tracking-tighter">
                  Jadilah <br /> Inspirasi <br /> Kuliner.
                </h2>
                <p className="text-yellow-900/60 text-sm font-bold leading-relaxed mb-8">
                  Dapur Anda adalah laboratorium kreativitas. Setiap resep baru adalah satu langkah menuju kesempurnaan.
                </p>
              </div>
              
              <button 
                onClick={() => navigate('/add-recipe')}
                className="relative z-10 bg-white text-gray-900 w-full py-5 rounded-2xl font-black text-sm hover:bg-gray-900 hover:text-white transition-all shadow-xl active:scale-95"
              >
                Tulis Resep Sekarang
              </button>

              {/* Dekorasi ChefHat Besar di Background */}
              <ChefHat size={250} className="absolute -bottom-16 -right-16 text-white opacity-10 rotate-12" />
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default Dashboard;