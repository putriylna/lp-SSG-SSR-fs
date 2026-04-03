// src/services/uploadService.ts
import { supabase } from '../lib/supabaseClient'

export const uploadImage = async (file: File, userId: string, onProgress: (progress: number) => void) => {
  const fileName = `${Date.now()}-${file.name}`
  const path = `${userId}/${fileName}`

  const { data: signedData, error: signedError } = await supabase.storage
    .from('recipe-images')
    .createSignedUploadUrl(path)

  if (signedError) throw signedError

  return new Promise<string>((resolve, reject) => {
    const xhr = new XMLHttpRequest()
    // Menggunakan signedUrl dari Supabase
    xhr.open('PUT', signedData.signedUrl, true)
    xhr.setRequestHeader('Content-Type', file.type)

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 100)
        onProgress(progress)
      }
    }

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // PERBAIKAN DI SINI: 
        // getPublicUrl mengembalikan objek { data: { publicUrl: '...' } }
        const { data } = supabase.storage.from('recipe-images').getPublicUrl(path)
        
        console.log("Generated Public URL:", data.publicUrl); // Untuk debugging
        resolve(data.publicUrl); // Kita kirim string-nya saja
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}`))
      }
    }

    xhr.onerror = () => reject(new Error('Upload error'))
    xhr.send(file)
  })
}