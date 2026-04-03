import { useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import toast from "react-hot-toast";

// Pastikan ASTRO_URL sesuai dengan port Astro Anda
const ASTRO_URL = "http://localhost:4321";

export default function OauthCallback() {
  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // --- PERBAIKAN: Gunakan getSession untuk mengambil hasil OAuth ---
        const { data, error } = await supabase.auth.getSession();

        if (error) throw error;

        if (data.session) {
          if (window.opener) {
            // Kirim data session ke jendela utama (Astro)
            window.opener.postMessage(
              { type: "AUTH_SUCCESS", session: data.session },
              ASTRO_URL
            );
            
            // Tutup pop-up dengan sedikit jeda agar postMessage terkirim
            setTimeout(() => {
              window.close();
            }, 500);
          } else {
            // Fallback jika tidak ada opener: arahkan langsung
            window.location.href = "/";
          }
        }
      } catch (error) {
        console.error("Error during OAuth callback:", error);
        toast.error("Gagal memproses login Google");
        // Tutup popup jika error agar user tidak stuck
        setTimeout(() => window.close(), 1000);
      }
    };

    handleAuthCallback();
  }, []);

  return (
    <div className="h-screen flex flex-col items-center justify-center bg-white">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      <p className="mt-4 font-bold text-slate-600">Menyambungkan ke Resepku...</p>
      <p className="text-sm text-slate-400">Jendela ini akan menutup otomatis</p>
    </div>
  );
}