"use client";

import React, { useState, useEffect } from 'react';
import { 
  getCategories, 
  createCategory, 
  updateCategory, 
  deleteCategory 
} from '../services/categoryService';
import { Plus, Edit2, Trash2, Tag, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// Import Layout Components
import MainLayout from '../components/MainLayout';
import Navbar from '../components/Navbar';

import type { Category } from '../types/category';

const Categories: React.FC = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [name, setName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      setLoading(true);
      const data = await getCategories();
      setCategories(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toSlug = (str: string) => 
    str.toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w-]+/g, '');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    
    setError(null);
    setSubmitting(true);
    const slug = toSlug(name);
    
    try {
      if (editingId) {
        const updated = await updateCategory(editingId, { name, slug });
        setCategories(categories.map((cat) => (cat.id === editingId ? updated : cat)));
        setEditingId(null);
      } else {
        const newCat = await createCategory({ name, slug });
        setCategories([...categories, newCat]);
      }
      setName('');
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan sistem.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEdit = (cat: Category) => {
    setName(cat.name);
    setEditingId(cat.id);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setEditingId(null);
    setName('');
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Hapus kategori ini? Resep dengan kategori ini mungkin akan terpengaruh.')) {
      try {
        await deleteCategory(id);
        setCategories(categories.filter((cat) => cat.id !== id));
      } catch (err) {
        console.error(err);
      }
    }
  };

  return (
    <MainLayout>
      <Navbar />
      <main className="flex-1 p-6 md:p-10 overflow-auto">
        <div className="max-w-3xl mx-auto">
          
          {/* Header Section */}
          <div className="mb-10">
            <h1 className="text-3xl font-black text-gray-800 tracking-tight flex items-center gap-3">
              <Tag className="text-yellow-500" /> Kelola Kategori
            </h1>
            <p className="text-gray-400 text-sm mt-2 font-medium">Atur klasifikasi resep Anda agar lebih terorganisir.</p>
          </div>
          
          {/* Form Card */}
          <div className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-yellow-100/20 border border-yellow-50 mb-10">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-2">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1">
                  {editingId ? 'Edit Kategori' : 'Kategori Baru'}
                </label>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      placeholder="Contoh: Makanan Penutup, Sarapan..."
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full px-6 py-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-yellow-500/20 text-sm font-bold text-gray-700 transition-all"
                      required
                    />
                    {editingId && (
                      <button 
                        type="button"
                        onClick={cancelEdit}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-red-500"
                      >
                        <X size={18} />
                      </button>
                    )}
                  </div>
                  <button 
                    type="submit" 
                    disabled={submitting}
                    className={`flex items-center justify-center gap-2 px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                      editingId 
                        ? 'bg-slate-800 text-white shadow-slate-100 hover:bg-slate-700' 
                        : 'bg-yellow-500 text-white shadow-yellow-100 hover:bg-yellow-600'
                    }`}
                  >
                    {submitting ? (
                      <Loader2 className="animate-spin" size={16} />
                    ) : (
                      editingId ? <Edit2 size={16} /> : <Plus size={16} />
                    )}
                    {editingId ? 'Simpan' : 'Tambah'}
                  </button>
                </div>
              </div>
              
              <AnimatePresence>
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="text-red-500 text-[10px] font-black uppercase tracking-widest bg-red-50 p-3 rounded-xl border border-red-100"
                  >
                    Error: {error}
                  </motion.p>
                )}
              </AnimatePresence>
            </form>
          </div>

          {/* Categories List */}
          <div className="space-y-4">
            <h2 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] ml-1 mb-4">
              Daftar Kategori ({categories.length})
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="animate-spin text-yellow-500" size={32} />
              </div>
            ) : categories.length > 0 ? (
              <div className="grid gap-3">
                <AnimatePresence mode="popLayout">
                  {categories.map((cat) => (
                    <motion.div 
                      key={cat.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className="flex items-center justify-between bg-white p-5 sm:p-6 rounded-[2rem] border border-gray-50 shadow-sm hover:shadow-md hover:border-yellow-100 transition-all group"
                    >
                      <div className="flex items-center gap-4 min-w-0">
                        <div className="w-12 h-12 rounded-2xl bg-yellow-50 flex items-center justify-center text-yellow-500 shrink-0 group-hover:scale-110 transition-transform">
                          <Tag size={20} />
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-black text-gray-800 text-sm sm:text-base truncate">{cat.name}</h3>
                          <p className="text-[9px] font-black text-gray-300 uppercase tracking-widest mt-0.5">Slug: {cat.slug}</p>
                        </div>
                      </div>
                      
                      <div className="flex gap-2 ml-4">
                        <button 
                          onClick={() => handleEdit(cat)} 
                          className="p-3 text-gray-300 hover:text-blue-500 hover:bg-blue-50 rounded-xl transition-all"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button 
                          onClick={() => handleDelete(cat.id)} 
                          className="p-3 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all"
                          title="Hapus"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-center py-20 bg-white rounded-[2.5rem] border border-dashed border-gray-200"
              >
                <Tag size={40} className="mx-auto text-gray-200 mb-4" />
                <p className="text-gray-400 text-sm font-medium">Belum ada kategori yang dibuat.</p>
              </motion.div>
            )}
          </div>
        </div>
      </main>
    </MainLayout>
  );
};

export default Categories;