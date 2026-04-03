"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getRecipes, deleteRecipe } from '../services/recipeService';
import { getCategories } from '../services/categoryService';
import RecipeCard from '../components/RecipeCard';
import CategoryFilter from '../components/CategoryFilter';
import MainLayout from '../components/MainLayout';
import Navbar from '../components/Navbar';
import { Loader2, ChefHat, Plus, Search } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import type { Recipe } from '../types/recipe';
import type { Category } from '../types/category';

const MyRecipes: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [recipes, setRecipes] = useState<Recipe[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [deleting, setDeleting] = useState<string | null>(null);

  const fullName = session?.user?.user_metadata?.full_name || "Koki Hebat";

  useEffect(() => {
    const fetchCats = async () => {
      try {
        const data = await getCategories();
        setCategories(data);
      } catch (err) {
        console.error("Gagal memuat kategori:", err);
      }
    };
    fetchCats();
  }, []);

  const loadRecipes = useCallback(async () => {
    if (!session?.user?.id) return;
    
    try {
      setLoading(true);
      const { data } = await getRecipes({ 
        page: 0, 
        limit: 100,
        authorId: session.user.id,
        categoryId: selectedCategory,
        search: search
      });
      setRecipes(data || []);
    } catch (err) {
      console.error("Gagal memuat resep saya:", err);
    } finally {
      setLoading(false);
    }
  }, [session, selectedCategory, search]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      loadRecipes();
    }, 400);
    return () => clearTimeout(delayDebounce);
  }, [loadRecipes, selectedCategory, search]);

  const handleEdit = (id: string) => {
    navigate(`/edit-recipe/${id}`);
  };

  const handleDelete = async (id: string, imageUrl?: string | null) => {
    if (!window.confirm('Hapus resep ini secara permanen?')) return;
    
    setDeleting(id);
    try {
      await deleteRecipe(id, imageUrl);
      setRecipes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      alert('Gagal menghapus resep');
      console.error(err);
    } finally {
      setDeleting(null);
    }
  };

  return (
    <MainLayout>
      <Navbar />
      <main className="p-6 md:p-10 flex-1 bg-[#fafafa] min-h-screen">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="bg-yellow-500 p-2 rounded-xl text-white shadow-lg shadow-yellow-100">
                <ChefHat size={24} strokeWidth={2.5} />
              </div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
                Resep <span className="text-yellow-500">saya</span>
              </h1>
            </div>
            <p className="text-gray-500 text-sm font-medium ml-1">
              Halo {fullName}, kelola semua kreasi kuliner Anda di sini.
            </p>
          </div>

          <button 
            onClick={() => navigate('/add-recipe')}
            className="flex items-center justify-center gap-3 bg-gray-900 hover:bg-yellow-600 text-white px-8 py-4 rounded-full font-bold text-sm transition-all shadow-xl shadow-gray-200 active:scale-95 group"
          >
            <Plus size={18} strokeWidth={3} className="group-hover:rotate-90 transition-transform duration-300" />
            Tambah resep
          </button>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm mb-10 space-y-5">
          <div className="relative group">
            <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-gray-300 group-focus-within:text-yellow-500 transition-colors" size={20} />
            <input 
              type="text" 
              placeholder="Cari dalam koleksi resep Anda..." 
              value={search} 
              onChange={(e) => setSearch(e.target.value)} 
              className="w-full bg-gray-50 border-none rounded-2xl py-4 pl-14 pr-6 outline-none focus:ring-2 focus:ring-yellow-500/10 text-sm font-medium transition-all" 
            />
          </div>
          <CategoryFilter 
            categories={categories} 
            selectedId={selectedCategory} 
            onSelect={setSelectedCategory} 
          />
        </div>

        {/* Content Section */}
        <div className="relative">
          {loading && recipes.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 bg-white rounded-[2.5rem] border border-gray-100 shadow-sm">
              <Loader2 className="animate-spin text-yellow-500 mb-4" size={40} strokeWidth={2.5} />
              <p className="text-gray-400 font-medium text-sm">Menyiapkan koleksi resep Anda...</p>
            </div>
          ) : recipes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              <AnimatePresence mode="popLayout">
                {recipes.map((recipe, index) => (
                  <motion.div
                    key={recipe.id}
                    layout
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className="w-full"
                  >
                    <RecipeCard 
                      recipe={recipe}
                      onViewDetail={(id) => navigate(`/recipe/${id}`)}
                      onEdit={handleEdit}
                      onDelete={(id, img) => handleDelete(id, img)}
                      isDeleting={deleting === recipe.id}
                      // Catatan: Pastikan RecipeCard menggunakan styling:
                      // badge tingkat kesulitan: "bg-yellow-400 text-black font-bold"
                      // image: "w-full object-cover"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-gray-100 flex flex-col items-center shadow-sm px-6"
            >
              <div className="bg-gray-50 p-8 rounded-full mb-6">
                <ChefHat size={48} className="text-gray-200" />
              </div>
              <h3 className="text-xl font-bold text-gray-900">
                {search ? "Hasil tidak ditemukan" : "Dapur Anda masih kosong"}
              </h3>
              <p className="text-gray-400 mt-2 mb-8 text-sm font-medium max-w-xs mx-auto">
                {search 
                  ? `Tidak ada resep "${search}" yang cocok dalam koleksi Anda.` 
                  : "Mari mulai simpan resep rahasia Anda dan bagikan keajaiban kuliner sekarang!"}
              </p>
              {!search && (
                <button 
                  onClick={() => navigate('/add-recipe')}
                  className="bg-gray-900 hover:bg-yellow-500 text-white px-10 py-4 rounded-full font-bold text-sm transition-all shadow-lg shadow-gray-200"
                >
                  Mulai memasak sekarang
                </button>
              )}
            </motion.div>
          )}
        </div>
      </main>
    </MainLayout>
  );
};

export default MyRecipes;