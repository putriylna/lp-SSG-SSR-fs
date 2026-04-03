"use client";

import React, { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft, ArrowRight, Plus, Trash2, Upload, CheckCircle2, AlertCircle, Clock, Users, ChevronDown
} from "lucide-react";
import { supabase } from "../lib/supabaseClient";
import { v4 as uuidv4 } from "uuid";

// Import Layout & Auth
import MainLayout from "../components/MainLayout";
import Navbar from "../components/Navbar";
import { useAuth } from "../App";

const DIFFICULTIES = ["Mudah", "Sedang", "Sulit"];
const UNIT_OPTIONS = ["gram", "kg", "liter", "ml", "sdm", "sdt", "butir", "siung", "buah", "secukupnya"];

interface Category {
  id: string;
  name: string;
}

export default function AddRecipePage() {
  const navigate = useNavigate();
  const { session } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    category_id: "",
    difficulty: "Mudah",
    cooking_time: "",
    servings: "",
    thumbnail: null as File | null,
    thumbnailPreview: "",
  });

  const [ingredients, setIngredients] = useState([{ item_name: "", quantity: "", unit: "gram" }]);
  const [steps, setSteps] = useState([{ instruction_text: "" }]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fullName = session?.user?.user_metadata?.full_name || "Koki Hebat";

  useEffect(() => {
    const fetchCategories = async () => {
      const { data, error } = await supabase.from("categories").select("id, name");
      if (!error && data) setDbCategories(data);
    };
    fetchCategories();
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (formData.thumbnailPreview) URL.revokeObjectURL(formData.thumbnailPreview);
    setFormData((prev) => ({
      ...prev,
      thumbnail: file,
      thumbnailPreview: URL.createObjectURL(file),
    }));
  };

  // --- PERBAIKAN LOGIKA STEP ---
  const nextStep = () => {
    setError(null); // Reset error setiap pindah step
    
    if (currentStep === 1) {
      if (!formData.title.trim()) return setError("Judul wajib diisi");
      if (!formData.category_id) return setError("Kategori wajib dipilih");
    }
    
    // Tambahkan validasi jika perlu di step 2 atau 3
    
    setCurrentStep((prev) => Math.min(prev + 1, 4)); // Mencegah step > 4
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const prevStep = () => {
    setError(null);
    setCurrentStep((prev) => Math.max(prev - 1, 1));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const generateSlug = (text: string) => {
    return text.toLowerCase().trim().replace(/[^\w\s-]/g, '').replace(/[\s_-]+/g, '-').replace(/^-+|-+$/g, '');
  };

  const handleSubmit = async () => {
    if (!session?.user) return setError("Silakan login terlebih dahulu.");
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // 1. Upload Gambar jika ada
      let finalImageUrl = "";
      if (formData.thumbnail) {
        const fileExt = formData.thumbnail.name.split('.').pop();
        const filePath = `thumbnails/${uuidv4()}.${fileExt}`;
        const { error: uploadError } = await supabase.storage
          .from("recipe-images")
          .upload(filePath, formData.thumbnail);
        
        if (uploadError) throw new Error(`Gagal upload gambar: ${uploadError.message}`);
        
        const { data: urlData } = supabase.storage
          .from("recipe-images")
          .getPublicUrl(filePath);
        
        finalImageUrl = urlData.publicUrl;
      }

      // 2. Generate Unique Slug
      const slugBase = generateSlug(formData.title);
      const uniqueSlug = `${slugBase}-${Math.random().toString(36).substring(2, 7)}`;

      // 3. Insert Recipe
      const { data: recipeData, error: recipeError } = await supabase.from("recipes").insert([{
        title: formData.title.trim(),
        slug: uniqueSlug,
        description: formData.description.trim(),
        cooking_time: parseInt(formData.cooking_time) || 0,
        servings: parseInt(formData.servings) || 0,
        difficulty: formData.difficulty,
        image_url: finalImageUrl,
        category_id: formData.category_id || null,
        author_id: session.user.id,
      }]).select().single();

      if (recipeError) throw new Error(`Gagal simpan resep: ${recipeError.message}`);

      // 4. Insert Ingredients
      const ingPayload = ingredients
        .filter(i => i.item_name.trim() !== "")
        .map(i => ({
          recipe_id: recipeData.id,
          item_name: i.item_name.trim(),
          quantity: parseFloat(i.quantity) || 0,
          unit: i.unit
        }));

      if (ingPayload.length > 0) {
        const { error: ingError } = await supabase.from("ingredients").insert(ingPayload);
        if (ingError) throw new Error(`Gagal simpan bahan: ${ingError.message}`);
      }

      // 5. Insert Instructions
      const stepPayload = steps
        .filter(s => s.instruction_text.trim() !== "")
        .map((s, idx) => ({
          recipe_id: recipeData.id,
          instruction_text: s.instruction_text.trim(),
          step_number: idx + 1
        }));

      if (stepPayload.length > 0) {
        const { error: stepError } = await supabase.from("instructions").insert(stepPayload);
        if (stepError) throw new Error(`Gagal simpan langkah: ${stepError.message}`);
      }

      setSuccess(true);
      // Tunggu 2 detik agar user bisa lihat status sukses
      setTimeout(() => navigate('/dashboard'), 2000);

    } catch (err: any) {
      console.error("Submit Error:", err);
      setError(err.message || "Terjadi kesalahan saat menyimpan resep.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <MainLayout>
      <Navbar />
      <div className="flex-1 p-6 md:p-10 overflow-auto bg-[#fafafa]">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <header className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-3">
                <div className="bg-yellow-500 p-2 rounded-xl text-white shadow-lg shadow-yellow-100">
                  <Plus size={24} strokeWidth={3} />
                </div>
                Tambah resep
              </h1>
              <p className="text-gray-500 text-sm mt-1 font-medium">Halo {fullName}, ayo bagikan inspirasi masakan Anda.</p>
            </div>
            <button onClick={() => navigate('/dashboard')} className="text-gray-400 hover:text-red-500 font-bold text-xs transition-colors flex items-center gap-2">
              <ArrowLeft size={16} /> Batal
            </button>
          </header>

          {/* Stepper */}
          <div className="mb-10">
            <div className="flex justify-between mb-4 px-2">
              {["Info", "Bahan", "Langkah", "Preview"].map((label, i) => (
                <div key={i} className={`flex flex-col items-center gap-2 ${currentStep >= i + 1 ? "text-yellow-600" : "text-gray-300"}`}>
                  <div className={`w-10 h-10 rounded-2xl flex items-center justify-center border-2 transition-all duration-500 ${currentStep >= i + 1 ? "border-yellow-500 bg-yellow-500 text-white shadow-lg shadow-yellow-200" : "border-gray-200 bg-white"}`}>
                    <span className="font-bold text-sm">{i + 1}</span>
                  </div>
                  <span className="text-[10px] font-bold tracking-wide">{label}</span>
                </div>
              ))}
            </div>
            <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden mx-2">
              <motion.div className="h-full bg-yellow-500" animate={{ width: `${(currentStep / 4) * 100}%` }} transition={{ duration: 0.5 }} />
            </div>
          </div>

          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep} // Penting untuk animasi per step
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="bg-white rounded-[2.5rem] p-8 md:p-10 shadow-sm border border-gray-100"
            >
              {/* --- UI STEPS (Tetap Sama) --- */}
              {currentStep === 1 && (
                <div className="space-y-6">
                  <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">Judul resep</label>
                    <input name="title" value={formData.title} onChange={handleInputChange} placeholder="Misal: Rendang daging spesial" className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm transition-all" />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">Deskripsi</label>
                    <textarea name="description" value={formData.description} onChange={handleInputChange} placeholder="Ceritakan sejarah atau rasa masakan ini..." className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 h-32 text-sm transition-all resize-none" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">Kategori</label>
                      <div className="relative">
                        <select name="category_id" value={formData.category_id} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm appearance-none cursor-pointer">
                          <option value="">Pilih kategori</option>
                          {dbCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">Kesulitan</label>
                      <div className="relative">
                        <select name="difficulty" value={formData.difficulty} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm appearance-none cursor-pointer">
                          {DIFFICULTIES.map(d => <option key={d} value={d}>{d}</option>)}
                        </select>
                        <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">Waktu masak (menit)</label>
                      <input type="number" name="cooking_time" value={formData.cooking_time} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm" />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">Porsi (orang)</label>
                      <input type="number" name="servings" value={formData.servings} onChange={handleInputChange} className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm" />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-400 ml-1 mb-2 block">Foto utama</label>
                    <div onClick={() => fileInputRef.current?.click()} className="h-56 border-2 border-dashed border-gray-100 rounded-[2rem] flex flex-col items-center justify-center cursor-pointer overflow-hidden bg-gray-50 group hover:bg-gray-100 hover:border-gray-300 transition-all">
                      {formData.thumbnailPreview ? (
                        <img src={formData.thumbnailPreview} className="w-full h-full object-cover" alt="Preview" />
                      ) : (
                        <div className="text-center">
                          <div className="bg-white p-4 rounded-2xl shadow-sm mb-3 mx-auto w-fit group-hover:scale-110 transition-transform">
                            <Upload className="text-gray-400 group-hover:text-gray-600" size={24} />
                          </div>
                          <p className="text-xs text-gray-400 font-bold group-hover:text-gray-600">Klik untuk unggah foto</p>
                        </div>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" onChange={handleImageChange} className="hidden" accept="image/*" />
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Daftar bahan</h2>
                    <button onClick={() => setIngredients([...ingredients, { item_name: "", quantity: "", unit: "gram" }])} className="p-3 bg-yellow-500 text-white rounded-xl shadow-lg shadow-yellow-100 hover:scale-105 transition-all"><Plus size={20} /></button>
                  </div>
                  <div className="space-y-3">
                    {ingredients.map((ing, idx) => (
                      <motion.div initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} key={idx} className="flex gap-3 items-center">
                        <input placeholder="Nama bahan" value={ing.item_name} onChange={(e) => {
                          const n = [...ingredients]; n[idx].item_name = e.target.value; setIngredients(n);
                        }} className="flex-1 px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/10 text-sm" />
                        <input placeholder="Jumlah" type="number" value={ing.quantity} onChange={(e) => {
                          const n = [...ingredients]; n[idx].quantity = e.target.value; setIngredients(n);
                        }} className="w-20 px-2 py-4 bg-gray-50 border-none rounded-2xl outline-none text-center text-sm" />
                        <div className="relative">
                          <select value={ing.unit} onChange={(e) => {
                            const n = [...ingredients]; n[idx].unit = e.target.value; setIngredients(n);
                          }} className="appearance-none w-28 px-4 py-4 bg-gray-50 border-none rounded-2xl outline-none text-sm cursor-pointer font-bold text-gray-600">
                            {UNIT_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
                          </select>
                          <ChevronDown size={12} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
                        </div>
                        <button onClick={() => setIngredients(ingredients.filter((_, i) => i !== idx))} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={18} /></button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-bold text-gray-800">Cara membuat</h2>
                    <button onClick={() => setSteps([...steps, { instruction_text: "" }])} className="p-3 bg-yellow-500 text-white rounded-xl shadow-lg shadow-yellow-100 hover:scale-105 transition-all"><Plus size={20} /></button>
                  </div>
                  <div className="space-y-6">
                    {steps.map((s, idx) => (
                      <div key={idx} className="flex gap-4">
                        <div className="w-8 h-8 bg-orange-50 text-orange-600 rounded-lg flex items-center justify-center text-sm font-bold shrink-0">{idx + 1}</div>
                        <div className="flex-1 relative">
                          <textarea value={s.instruction_text} onChange={(e) => {
                            const n = [...steps]; n[idx].instruction_text = e.target.value; setSteps(n);
                          }} className="w-full px-5 py-4 bg-gray-50 border-none rounded-2xl outline-none h-24 text-sm resize-none" placeholder="Jelaskan langkah ini..." />
                          <button onClick={() => setSteps(steps.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-white shadow-md rounded-full p-1.5 text-gray-300 hover:text-red-500 border border-gray-50"><Trash2 size={12} /></button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {currentStep === 4 && (
                <div className="text-center space-y-8 py-4">
                  <div className="max-w-xs mx-auto">
                    <div className="aspect-[4/3] rounded-3xl overflow-hidden shadow-xl mb-6 border-4 border-white">
                      <img src={formData.thumbnailPreview || '/api/placeholder/400/400'} className="w-full h-full object-cover" alt="Preview" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">{formData.title || "Resep tanpa judul"}</h2>
                    <div className="flex justify-center gap-4 mt-4 text-gray-500 font-bold text-[11px] tracking-wide">
                      <span className="flex items-center gap-1.5 bg-gray-50 px-4 py-1.5 rounded-full text-gray-600 border border-gray-100"><Clock size={12} /> {formData.cooking_time || 0} mnt</span>
                      <span className="flex items-center gap-1.5 bg-gray-50 px-4 py-1.5 rounded-full text-gray-600 border border-gray-100"><Users size={12} /> {formData.servings || 0} porsi</span>
                    </div>
                  </div>
                  <div className="p-6 bg-yellow-50 rounded-2xl border border-yellow-100">
                    <p className="text-yellow-700 text-sm font-semibold">Siap untuk membagikan resep ini ke dunia?</p>
                  </div>

                  <AnimatePresence>
                    {error && <motion.div className="text-red-500 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100 flex items-center justify-center gap-2"><AlertCircle size={14} /> {error}</motion.div>}
                    {success && <motion.div className="text-green-600 text-sm font-bold bg-green-50 p-4 rounded-xl border border-green-100 flex items-center justify-center gap-2"><CheckCircle2 size={14} /> Sukses! Mengalihkan...</motion.div>}
                  </AnimatePresence>
                </div>
              )}
            </motion.div>
          </AnimatePresence>

          {/* Controls */}
          <div className="mt-10 flex justify-between items-center px-2">
            <button
              disabled={currentStep === 1 || loading}
              onClick={prevStep}
              className={`flex items-center gap-2 font-bold text-sm transition-all ${currentStep === 1 ? 'opacity-0' : 'text-gray-400 hover:text-black'}`}
            >
              <ArrowLeft size={16} /> Kembali
            </button>

            <button
              onClick={currentStep === 4 ? handleSubmit : nextStep}
              disabled={loading || success}
              className="bg-gray-900 hover:bg-yellow-500 disabled:bg-gray-200 text-white px-10 py-4 rounded-full font-bold shadow-lg hover:-translate-y-1 transition-all flex items-center gap-3 text-sm"
            >
              {loading ? "Menyimpan..." : currentStep === 4 ? "Publikasikan sekarang" : (
                <>
                  Selanjutnya <ArrowRight size={16} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}