"use client";

import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../App';
import { getProfile, updateProfile, uploadAvatar } from '../services/profileService';
import MainLayout from '../components/MainLayout';
import Navbar from '../components/Navbar';
import { User, Camera, Loader2, Save, ArrowLeft, CheckCircle2 } from 'lucide-react';
import { motion } from 'framer-motion';

const UpdateProfile: React.FC = () => {
  const { session } = useAuth();
  const navigate = useNavigate();
  
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [success, setSuccess] = useState(false);
  
  const [fullName, setFullName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (session) {
      loadProfile();
    }
  }, [session]);

  const loadProfile = async () => {
    try {
      setLoading(true);
      const data = await getProfile(session?.user.id!);
      if (data) {
        setFullName(data.full_name || '');
        setAvatarUrl(data.avatar_url || null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!e.target.files || e.target.files.length === 0) return;
      setUploading(true);
      const file = e.target.files[0];
      const url = await uploadAvatar(session?.user.id!, file);
      setAvatarUrl(url);
    } catch (err) {
      alert("Gagal mengunggah gambar");
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setUpdating(true);
      await updateProfile(session?.user.id!, {
        full_name: fullName,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      alert("Gagal memperbarui profil");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <MainLayout>
      <Navbar />
      <main className="p-6 md:p-10 max-w-2xl mx-auto w-full">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors text-gray-500"
          >
            <ArrowLeft size={20} />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Update profil</h1>
            <p className="text-sm text-gray-400">Kelola informasi akun dan identitas memasak Anda.</p>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="animate-spin text-yellow-500" size={32} />
          </div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white rounded-[2.5rem] border border-gray-200 p-8 transition-all hover:border-yellow-200"
          >
            <form onSubmit={handleSubmit} className="space-y-10">
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="relative">
                  <div className="w-32 h-32 rounded-[2.5rem] overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center text-gray-300">
                    {avatarUrl ? (
                      <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <User size={40} />
                    )}
                    {uploading && (
                      <div className="absolute inset-0 bg-white/80 flex items-center justify-center">
                        <Loader2 className="animate-spin text-yellow-500" size={20} />
                      </div>
                    )}
                  </div>
                  <label className="absolute -bottom-2 -right-2 bg-gray-900 hover:bg-yellow-500 text-white p-3 rounded-2xl cursor-pointer transition-all active:scale-90 border-4 border-white">
                    <Camera size={18} />
                    <input type="file" className="hidden" accept="image/*" onChange={handleAvatarUpload} disabled={uploading} />
                  </label>
                </div>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-6">Foto profil</p>
              </div>

              {/* Form Fields */}
              <div className="space-y-6">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 ml-1">Nama lengkap</label>
                  <input 
                    type="text" 
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Masukkan nama lengkap"
                    className="w-full bg-white border border-gray-200 rounded-2xl py-4 px-6 font-bold text-gray-700 outline-none hover:border-yellow-200 focus:border-yellow-400 focus:ring-4 focus:ring-yellow-500/5 transition-all"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-400 ml-1">Email akun</label>
                  <input 
                    type="text" 
                    value={session?.user.email}
                    disabled
                    className="w-full bg-gray-50 border border-gray-100 rounded-2xl py-4 px-6 font-bold text-gray-400 cursor-not-allowed opacity-70"
                  />
                </div>
              </div>

              {/* Feedback Success */}
              {success && (
                <motion.div 
                  initial={{ opacity: 0, x: -5 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="bg-yellow-50 text-yellow-700 p-4 rounded-2xl flex items-center gap-3 border border-yellow-100"
                >
                  <CheckCircle2 size={18} />
                  <span className="text-xs font-bold">Profil Anda berhasil diperbarui!</span>
                </motion.div>
              )}

              {/* Action Button */}
              <button 
                type="submit" 
                disabled={updating || uploading}
                className="w-full bg-gray-900 hover:bg-yellow-500 disabled:bg-gray-100 text-white font-bold py-4 rounded-2xl transition-all active:scale-[0.98] flex items-center justify-center gap-3 text-sm"
              >
                {updating ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                {updating ? 'Menyimpan...' : 'Simpan perubahan'}
              </button>
            </form>
          </motion.div>
        )}
      </main>
    </MainLayout>
  );
};

export default UpdateProfile;