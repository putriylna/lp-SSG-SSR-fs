// src/services/profileService.ts
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/profile'

export const getProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data as Profile
}

export const createProfile = async (profile: Profile) => {
  const { data, error } = await supabase
    .from('profiles')
    .insert(profile)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

export const updateProfile = async (userId: string, updates: Partial<Profile>) => {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data as Profile
}

/**
 * Fungsi untuk mengunggah foto profil ke Supabase Storage
 */
export const uploadAvatar = async (userId: string, file: File) => {
  try {
    // 1. Tentukan nama file yang unik (menggunakan timestamp agar tidak bentrok)
    const fileExt = file.name.split('.').pop();
    const fileName = `${userId}-${Math.random()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    // 2. Upload file ke bucket 'avatars'
    // Pastikan Anda sudah membuat bucket bernama 'avatars' di dashboard Supabase
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(filePath, file, { upsert: true });

    if (uploadError) throw uploadError;

    // 3. Ambil Public URL dari file yang diupload
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(filePath);

    return data.publicUrl;
  } catch (error) {
    console.error('Error uploading avatar:', error);
    throw error;
  }
}