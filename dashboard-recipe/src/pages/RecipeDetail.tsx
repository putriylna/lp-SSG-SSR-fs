"use client";

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  ArrowLeft, Edit3, Trash2, Clock, Users, 
  Share2, Bookmark, Calendar, Loader2, AlertCircle
} from 'lucide-react';
import { useAuth } from '../App.tsx';
import { 
  getRecipeById, 
  getIngredientsByRecipeId, 
  getInstructionsByRecipeId,
  deleteRecipe 
} from '../services/recipeService';

import MainLayout from '../components/MainLayout';
import Navbar from '../components/Navbar';

const RecipeDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [recipe, setRecipe] = useState<any>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rec = await getRecipeById(id || '');
        if (!rec) return;

        setRecipe(rec);
        const [ings, insts] = await Promise.all([
          getIngredientsByRecipeId(rec.id),
          getInstructionsByRecipeId(rec.id)
        ]);
        setIngredients(ings);
        setInstructions(insts);
      } catch (err) {
        console.error("Gagal memuat data:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [id]);

  const handleDelete = async () => {
    if (!window.confirm("Apakah Anda yakin ingin menghapus resep ini secara permanen?")) return;
    
    try {
      setDeleting(true);
      await deleteRecipe(recipe.id, recipe.image_url);
      navigate('/dashboard'); // Atau ke halaman list resep
    } catch (err) {
      alert("Gagal menghapus resep.");
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <MainLayout>
        <Navbar />
        <div className="flex-1 flex items-center justify-center bg-white">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-yellow-500 animate-spin" />
            <span className="text-xs font-bold text-gray-400 tracking-widest uppercase">Menyiapkan resep...</span>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!recipe) return (
    <MainLayout>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center bg-[#fafafa] gap-4">
        <AlertCircle size={48} className="text-gray-200" />
        <div className="text-gray-800 font-bold">Resep tidak ditemukan</div>
        <button onClick={() => navigate(-1)} className="text-xs font-bold text-yellow-600 hover:underline">Kembali ke Beranda</button>
      </div>
    </MainLayout>
  );

  const isOwner = session?.user.id === recipe.author_id;

  // Cache breaker agar gambar baru muncul setelah diedit
  const displayImageUrl = recipe.image_url 
    ? `${recipe.image_url}?t=${new Date(recipe.updated_at || recipe.created_at).getTime()}`
    : "/api/placeholder/800/600";

  return (
    <MainLayout>
      <Navbar />
      <div className="flex-1 bg-[#fafafa] text-[#1a1a1a] overflow-y-auto">
        
        {/* Navigation & Actions */}
        <div className="max-w-6xl mx-auto px-6 pt-8 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} /> Kembali
          </button>
          
          <div className="flex items-center gap-2">
            <button className="p-2 text-gray-400 hover:text-yellow-600 transition-all"><Share2 size={18}/></button>
            <button className="p-2 text-gray-400 hover:text-yellow-600 transition-all"><Bookmark size={18}/></button>
            {isOwner && (
              <div className="flex gap-1 ml-2 pl-3 border-l border-gray-200">
                <button 
                  onClick={() => navigate(`/edit-recipe/${recipe.id}`)} 
                  disabled={deleting}
                  className="p-2 text-gray-400 hover:text-yellow-600 hover:bg-yellow-50 rounded-xl transition-all"
                >
                  <Edit3 size={18}/>
                </button>
                <button 
                  onClick={handleDelete}
                  disabled={deleting}
                  className="p-2 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all disabled:opacity-50"
                >
                  {deleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18}/>}
                </button>
              </div>
            )}
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-6 py-8">
          
          {/* Section Atas: Hero Content */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 mb-16">
            
            {/* GAMBAR */}
            <div className="lg:col-span-5">
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="rounded-[2rem] overflow-hidden border border-gray-200 aspect-[16/11] bg-white transition-all hover:shadow-2xl hover:shadow-yellow-500/5 group"
              >
                <img 
                  src={displayImageUrl} 
                  alt={recipe.title} 
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
              </motion.div>
            </div>

            <div className="lg:col-span-7 flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-6">
                <span className="px-3 py-1 bg-yellow-50 text-yellow-700 text-[10px] font-bold rounded-full border border-yellow-100 uppercase tracking-widest">
                  {recipe.categories?.name || 'Masakan Indonesia'}
                </span>
                <span className="text-gray-300">•</span>
                <span className="px-3 py-1 bg-gray-50 text-gray-600 text-[10px] font-bold rounded-full border border-gray-100 uppercase tracking-tight">
                  {recipe.difficulty || 'Mudah'}
                </span>
                <div className="flex items-center gap-1 text-gray-400 text-[10px] font-bold ml-2">
                  <Calendar size={12} className="text-gray-300" /> 
                  {new Date(recipe.created_at || '').toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                </div>
              </div>

              <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 tracking-tight leading-[1.1]">
                {recipe.title}
              </h1>
              
              <p className="text-gray-500 text-base leading-relaxed mb-10 max-w-xl italic border-l-2 border-yellow-200 pl-4">
                "{recipe.description}"
              </p>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 transition-all hover:border-yellow-200">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 shrink-0">
                    <Clock size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Waktu Masak</p>
                    <p className="font-bold text-gray-800 text-sm">{recipe.cooking_time} <span className="text-gray-400 font-medium lowercase">menit</span></p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-2xl border border-gray-200 flex items-center gap-4 transition-all hover:border-yellow-200">
                  <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600 shrink-0">
                    <Users size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Porsi</p>
                    <p className="font-bold text-gray-800 text-sm">{recipe.servings} <span className="text-gray-400 font-medium lowercase">orang</span></p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section Bawah: Content Details */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            
            {/* Ingredients Side */}
            <div className="lg:col-span-4">
              <div className="bg-white rounded-[2rem] border border-gray-200 p-8 sticky top-24 transition-all hover:border-yellow-100">
                <h2 className="text-sm font-bold text-gray-900 mb-8 flex items-center gap-2">
                  <div className="w-1 h-4 bg-yellow-500 rounded-full" /> Bahan-bahan
                </h2>
                <div className="space-y-1">
                  {ingredients.map((ing, idx) => (
                    <div key={idx} className="flex justify-between items-center py-3 border-b border-gray-50 last:border-0">
                      <span className="text-gray-700 text-sm font-medium">{ing.item_name}</span>
                      <span className="text-yellow-600 font-bold text-xs">{ing.quantity} {ing.unit}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Instructions Side */}
            <div className="lg:col-span-8">
              <h2 className="text-sm font-bold text-gray-900 mb-10 flex items-center gap-2 px-2">
                <div className="w-1 h-4 bg-yellow-500 rounded-full" /> Langkah memasak
              </h2>
              <div className="space-y-10">
                {instructions.map((inst, idx) => (
                  <div key={idx} className="flex gap-6 group">
                    <div className="flex flex-col items-center shrink-0">
                      <div className="w-9 h-9 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-xs font-bold text-gray-400 group-hover:text-yellow-600 group-hover:border-yellow-200 group-hover:bg-yellow-50 transition-all">
                        {idx + 1}
                      </div>
                      {idx !== instructions.length - 1 && (
                        <div className="w-[1px] h-full bg-gray-100 mt-4 group-hover:bg-yellow-100 transition-colors" />
                      )}
                    </div>
                    <div className="pt-1.5 pb-6">
                      <p className="text-gray-600 text-base leading-relaxed font-medium group-hover:text-gray-900 transition-colors">
                        {inst.instruction_text}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </main>
      </div>
    </MainLayout>
  );
};

export default RecipeDetail;