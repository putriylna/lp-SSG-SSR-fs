"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ArrowLeft, Plus, Trash2, Upload, Clock, 
  Users, Save, ChefHat, Loader2, ChevronDown, AlertCircle 
} from 'lucide-react';
import { useAuth } from '../App.tsx';
import { 
  getRecipeById, 
  updateRecipe, 
  getIngredientsByRecipeId, 
  getInstructionsByRecipeId 
} from '../services/recipeService';
import { getCategories } from '../services/categoryService';
import { uploadImage } from '../services/uploadService';

import MainLayout from '../components/MainLayout';
import Navbar from '../components/Navbar';

import type { Recipe, Difficulty } from '../types/recipe';
import type { Category } from '../types/category';

const EditRecipe: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { session } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [recipe, setRecipe] = useState<Recipe | null>(null);
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [cookingTime, setCookingTime] = useState(0);
  const [servings, setServings] = useState(0);
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const [categoryId, setCategoryId] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [ingredients, setIngredients] = useState<any[]>([]);
  const [instructions, setInstructions] = useState<any[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const rec = await getRecipeById(id || '');
        
        if (!rec) throw new Error("Resep tidak ditemukan");

        // Proteksi Akses
        if (session?.user.id !== rec.author_id) {
          navigate('/dashboard');
          return;
        }

        setRecipe(rec);
        setTitle(rec.title);
        setDescription(rec.description || '');
        setCookingTime(rec.cooking_time);
        setServings(rec.servings);
        setDifficulty(rec.difficulty);
        setCategoryId(rec.category_id || '');
        
        // Inisialisasi URL gambar dari Database
        setImageUrl(rec.image_url);
        setImagePreview(rec.image_url);

        const [ings, insts, cats] = await Promise.all([
          getIngredientsByRecipeId(rec.id),
          getInstructionsByRecipeId(rec.id),
          getCategories()
        ]);
        
        setIngredients(ings.map(i => ({ 
          item_name: i.item_name || '', 
          quantity: i.quantity || '', 
          unit: i.unit || 'gram' 
        })));
        setInstructions(insts.map(i => ({ 
          instruction_text: i.instruction_text || '' 
        })));
        setCategories(cats);
      } catch (err) { 
        setError("Gagal memuat data resep."); 
      } finally { 
        setLoading(false); 
      }
    };
    if (id) loadData();
  }, [id, session, navigate]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 1. Preview Lokal
    const localPreview = URL.createObjectURL(file);
    setImagePreview(localPreview);
    setUploadingImage(true);
    setError(null);

    try {
      // 2. Upload ke Storage
      const uploadedUrl = await uploadImage(file, session?.user.id || '', () => {});
      
      if (uploadedUrl && typeof uploadedUrl === 'string') {
        console.log("Image Uploaded Successfully:", uploadedUrl);
        setImageUrl(uploadedUrl); // Update state dengan URL baru
      } else {
        throw new Error("Format URL tidak valid");
      }
    } catch (err) {
      console.error("Upload failed:", err);
      setError("Gagal mengunggah gambar. Menggunakan gambar lama.");
      setImagePreview(imageUrl); // Reset ke gambar lama jika gagal
    } finally {
      setUploadingImage(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (uploadingImage || !recipe) return;

    setSubmitting(true);
    setError(null);

    try {
      // SAFETY CHECK: Jika imageUrl di state kosong/undefined, ambil dari data awal DB
      const finalImageUrl = imageUrl || recipe.image_url;

      const updatedData = {
        title,
        description,
        cooking_time: cookingTime,
        servings,
        difficulty,
        image_url: finalImageUrl, // Pastikan field ini masuk
        category_id: categoryId
      };

      console.log("Submitting Data:", updatedData);

      await updateRecipe(
        recipe.id,
        updatedData,
        ingredients,
        instructions
      );

      // Beri feedback sukses sebelum navigasi
      navigate(`/recipe/${recipe.id}`);
    } catch (err: any) {
      console.error("Update Error:", err);
      setError(err.message || "Terjadi kesalahan saat menyimpan.");
      setSubmitting(false);
    }
  };

  if (loading) return (
    <MainLayout>
      <Navbar />
      <div className="flex-1 flex flex-col items-center justify-center bg-white gap-4">
        <Loader2 className="animate-spin text-yellow-500" size={40} />
        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Memuat data...</p>
      </div>
    </MainLayout>
  );

  const inputBaseStyle = "w-full bg-white border border-gray-200 rounded-2xl p-4 text-sm outline-none transition-all hover:border-yellow-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-500/5";

  return (
    <MainLayout>
      <Navbar />
      <div className="flex-1 bg-[#fafafa] text-[#1a1a1a] overflow-y-auto pb-20">
        
        {/* Header */}
        <div className="max-w-6xl mx-auto px-6 pt-8 flex justify-between items-center">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-xs font-bold text-gray-400 hover:text-black transition-colors"
          >
            <ArrowLeft size={16} /> Batal & kembali
          </button>
          <div className="flex items-center gap-2 text-yellow-600 bg-yellow-50 px-4 py-2 rounded-full border border-yellow-100">
            <ChefHat size={16} />
            <span className="text-[10px] font-extrabold uppercase tracking-wider">Mode Edit Resep</span>
          </div>
        </div>

        <main className="max-w-6xl mx-auto px-6 py-10">
          <form onSubmit={handleSubmit} className="space-y-12">
            
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Image Section */}
              <div className="lg:col-span-5">
                <div 
                  onClick={() => !uploadingImage && fileInputRef.current?.click()}
                  className={`group relative aspect-[16/11] rounded-[2.5rem] overflow-hidden bg-white border-2 border-dashed border-gray-200 cursor-pointer transition-all hover:border-yellow-400 ${uploadingImage ? 'opacity-70 cursor-wait' : ''}`}
                >
                  {imagePreview ? (
                    <img src={imagePreview} className="w-full h-full object-cover" alt="Preview" />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-gray-300">
                      <Upload size={32} />
                      <span className="text-[10px] font-bold uppercase tracking-widest mt-2">Unggah Foto</span>
                    </div>
                  )}
                  
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-sm">
                    {uploadingImage ? (
                      <Loader2 className="animate-spin text-white" />
                    ) : (
                      <div className="text-center">
                        <Upload className="text-white mx-auto mb-2" size={24} />
                        <p className="text-white text-[10px] font-bold uppercase tracking-widest">Ganti Foto Resep</p>
                      </div>
                    )}
                  </div>
                  <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept="image/*" />
                </div>
              </div>

              {/* Title & Stats */}
              <div className="lg:col-span-7 flex flex-col justify-center space-y-8">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-yellow-600 uppercase tracking-widest ml-1">Judul Resep</label>
                  <input 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Masukkan nama masakan..."
                    className="w-full text-4xl font-bold text-gray-900 bg-transparent border-b-2 border-gray-100 focus:border-yellow-400 outline-none transition-all py-2"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200">
                    <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase">Kategori</label>
                    <select 
                      value={categoryId}
                      onChange={(e) => setCategoryId(e.target.value)}
                      className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer"
                      required
                    >
                      <option value="">Pilih Kategori</option>
                      {categories.map(cat => <option key={cat.id} value={cat.id}>{cat.name}</option>)}
                    </select>
                  </div>

                  <div className="bg-white p-4 rounded-2xl border border-gray-200">
                    <label className="text-[10px] font-bold text-gray-400 mb-2 block uppercase">Kesulitan</label>
                    <select 
                      value={difficulty}
                      onChange={(e) => setDifficulty(e.target.value as Difficulty)}
                      className="w-full bg-transparent text-sm font-bold text-gray-800 outline-none cursor-pointer"
                    >
                      <option value="easy">Mudah</option>
                      <option value="medium">Sedang</option>
                      <option value="hard">Sulit</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600"><Clock size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Waktu (Menit)</p>
                      <input type="number" value={cookingTime} onChange={(e) => setCookingTime(Number(e.target.value))} className="w-full bg-transparent font-bold text-sm outline-none" />
                    </div>
                  </div>
                  <div className="bg-white p-4 rounded-2xl border border-gray-200 flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-yellow-50 flex items-center justify-center text-yellow-600"><Users size={18} /></div>
                    <div className="flex-1">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">Porsi (Orang)</p>
                      <input type="number" value={servings} onChange={(e) => setServings(Number(e.target.value))} className="w-full bg-transparent font-bold text-sm outline-none" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Description Area */}
            <div className="space-y-4">
              <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-yellow-500 rounded-full" /> Deskripsi Resep
              </h2>
              <textarea 
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ceritakan sedikit tentang resep ini..."
                className={`${inputBaseStyle} min-h-[120px]`}
              />
            </div>

            {/* Ingredients & Instructions Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
              {/* Ingredients */}
              <div className="lg:col-span-5">
                <div className="bg-white rounded-[2rem] border border-gray-200 p-8">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Bahan-bahan</h2>
                    <button 
                      type="button"
                      onClick={() => setIngredients([...ingredients, { item_name: '', quantity: '', unit: 'gram' }])}
                      className="p-2 bg-yellow-500 text-white rounded-xl hover:shadow-lg hover:shadow-yellow-200 transition-all"
                    >
                      <Plus size={16} />
                    </button>
                  </div>
                  <div className="space-y-3">
                    {ingredients.map((ing, idx) => (
                      <div key={idx} className="flex gap-2 items-center">
                        <input 
                          placeholder="Bahan"
                          value={ing.item_name}
                          onChange={(e) => { const n = [...ingredients]; n[idx].item_name = e.target.value; setIngredients(n); }}
                          className="flex-1 bg-gray-50 border border-transparent rounded-xl p-3 text-xs outline-none focus:bg-white focus:border-yellow-200"
                        />
                        <input 
                          placeholder="Qty"
                          value={ing.quantity}
                          onChange={(e) => { const n = [...ingredients]; n[idx].quantity = e.target.value; setIngredients(n); }}
                          className="w-14 bg-gray-50 border border-transparent rounded-xl p-3 text-xs text-center outline-none"
                        />
                        <button type="button" onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={16}/></button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Instructions */}
              <div className="lg:col-span-7">
                <div className="flex justify-between items-center mb-6 px-1">
                  <h2 className="text-xs font-bold text-gray-900 uppercase tracking-widest">Langkah Memasak</h2>
                  <button 
                    type="button"
                    onClick={() => setInstructions([...instructions, { instruction_text: '' }])}
                    className="text-[10px] font-bold text-yellow-600 hover:underline"
                  >
                    + Tambah Langkah
                  </button>
                </div>
                <div className="space-y-4">
                  {instructions.map((inst, idx) => (
                    <div key={idx} className="flex gap-4 group">
                      <div className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-[10px] font-bold text-gray-400 shrink-0 mt-1 group-hover:bg-yellow-500 group-hover:text-white transition-all">
                        {idx + 1}
                      </div>
                      <div className="flex-1 relative">
                        <textarea 
                          value={inst.instruction_text}
                          onChange={(e) => { const n = [...instructions]; n[idx].instruction_text = e.target.value; setInstructions(n); }}
                          placeholder="Detail instruksi..."
                          className={`${inputBaseStyle} min-h-[80px] py-3`}
                        />
                        <button 
                          type="button" 
                          onClick={() => setInstructions(instructions.filter((_, i) => i !== idx))}
                          className="absolute -top-2 -right-2 bg-white text-red-500 p-1 rounded-full shadow-sm border border-red-50 opacity-0 group-hover:opacity-100 transition-opacity"
                        >
                          <Trash2 size={12}/>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Submit Section */}
            <div className="pt-10 border-t border-gray-100 flex flex-col items-center">
              {error && (
                <div className="flex items-center gap-2 text-red-500 text-xs font-bold mb-6 bg-red-50 px-4 py-2 rounded-full border border-red-100">
                  <AlertCircle size={14} /> {error}
                </div>
              )}
              
              <button 
                type="submit" 
                disabled={submitting || uploadingImage}
                className="group px-12 py-4 bg-gray-900 text-white rounded-full font-bold text-sm hover:bg-yellow-500 transition-all flex items-center gap-4 disabled:opacity-50"
              >
                {submitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {submitting ? "Menyimpan..." : "Simpan Perubahan"}
              </button>
            </div>

          </form>
        </main>
      </div>
    </MainLayout>
  );
};

export default EditRecipe;