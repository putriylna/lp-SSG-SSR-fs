import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { Mail, Lock, ArrowRight, Loader2, UtensilsCrossed, UserPlus, LogIn } from "lucide-react";
import toast from "react-hot-toast";

// Pastikan ASTRO_URL sesuai dengan port Astro Anda
const ASTRO_URL = "http://localhost:4321";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  // Update avatar preview berdasarkan email
  useEffect(() => {
    const seed = email.trim() || "guest";
    setAvatarUrl(`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`);
  }, [email]);

  // Helper untuk mengirim data ke Astro dan menutup popup
  const handleAuthResult = (session: any) => {
    if (window.opener) {
      window.opener.postMessage(
        { type: "AUTH_SUCCESS", session },
        ASTRO_URL
      );
      toast.success("Berhasil! Menutup jendela...");
      // Memberi sedikit jeda agar pesan terkirim sebelum jendela ditutup
      setTimeout(() => window.close(), 100);
    } else {
      // Jika bukan pop-up, arahkan ke dashboard internal
      window.location.href = "/dashboard";
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    
    setLoading(true);
    try {
      if (isRegister) {
        // --- PERBAIKAN: LOGIKA REGISTER ---
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              avatar_url: avatarUrl, // Kirim avatar yang dihasilkan
            }
          }
        });
        if (error) throw error;
        
        if (data?.session) {
          handleAuthResult(data.session);
        } else {
          toast.success("Berhasil! Silakan cek email Anda untuk verifikasi.");
          setIsRegister(false); // Arahkan ke form login
        }
      } else {
        // PROSES MASUK
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;

        if (data?.session) {
          handleAuthResult(data.session);
        }
      }
    } catch (err: any) {
      toast.error(err.message || "Terjadi kesalahan");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: { 
          // --- PERBAIKAN: Gunakan flowType popup untuk jendela kecil ---
          redirectTo: `${window.location.origin}/oauth-callback`,
          flowType: 'popup', 
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-6 selection:bg-yellow-100 selection:text-yellow-900">
      <div className="w-full max-w-sm space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* LOGO SECTION */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-6">
            <div className="bg-yellow-500 p-4 rounded-[2rem] text-white shadow-2xl shadow-yellow-200 active:scale-90 transition-all cursor-pointer">
              <UtensilsCrossed size={36} strokeWidth={2.5} />
            </div>
          </div>
          <h2 className="text-4xl font-black text-slate-800 tracking-tighter">
            Resep<span className="text-yellow-500">ku</span>
          </h2>
          <p className="text-slate-400 font-medium text-sm">
            {isRegister ? "Lengkapi profil kulinermu" : "Siap memasak apa hari ini, Chef?"}
          </p>
        </div>

        {/* AVATAR PREVIEW */}
        {isRegister && (
          <div className="flex flex-col items-center space-y-3 animate-in zoom-in duration-300">
            <div className="w-24 h-24 rounded-3xl border-[6px] border-slate-50 bg-slate-100 overflow-hidden shadow-inner transform rotate-3">
              <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
            </div>
            <div className="px-3 py-1 bg-slate-100 rounded-full">
               <span className="text-[9px] font-black text-slate-500 uppercase tracking-[0.2em]">Avatar Chef</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-3">
            <div className="relative group">
              <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-yellow-500 transition-colors" size={20} />
              <input 
                type="email" 
                disabled={loading}
                autoFocus
                placeholder="Alamat Email" 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent outline-none focus:border-yellow-400 focus:bg-white transition-all font-semibold text-slate-700 disabled:opacity-50"
                onChange={(e) => setEmail(e.target.value)} 
                required 
              />
            </div>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-yellow-500 transition-colors" size={20} />
              <input 
                type="password" 
                disabled={loading}
                placeholder="Kata Sandi" 
                className="w-full pl-12 pr-4 py-4 rounded-2xl bg-slate-50 border-2 border-transparent outline-none focus:border-yellow-400 focus:bg-white transition-all font-semibold text-slate-700 disabled:opacity-50"
                onChange={(e) => setPassword(e.target.value)} 
                required 
              />
            </div>
          </div>

          <button 
            type="submit"
            disabled={loading} 
            className="w-full bg-yellow-500 hover:bg-yellow-600 text-white py-4 rounded-2xl font-black flex justify-center items-center gap-2 shadow-xl shadow-yellow-100 transition-all active:scale-95 disabled:grayscale disabled:cursor-not-allowed group"
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                {isRegister ? <UserPlus size={20} /> : <LogIn size={20} />}
                <span>{isRegister ? "Buat Akun" : "Masuk Sekarang"}</span>
                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>

          <div className="relative py-4">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-slate-100"></span>
            </div>
            <div className="relative flex justify-center text-[10px] uppercase">
              <span className="bg-white px-4 text-slate-300 font-black tracking-[0.3em]">Atau</span>
            </div>
          </div>

          <button 
            type="button" 
            disabled={loading}
            onClick={handleGoogleLogin} 
            className="w-full bg-white border-2 border-slate-100 py-3.5 rounded-2xl font-bold text-slate-600 hover:border-yellow-200 hover:bg-yellow-50/30 transition-all flex items-center justify-center gap-3 active:scale-95"
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-5 h-5" alt="Google" />
            <span className="text-sm">Lanjutkan dengan Google</span>
          </button>
        </form>

        <div className="text-center pt-4">
          <button 
            type="button"
            disabled={loading}
            onClick={() => setIsRegister(!isRegister)}
            className="text-sm font-bold text-slate-400 hover:text-yellow-600 transition-colors group px-4 py-2"
          >
            {isRegister ? (
              <>Sudah punya akun? <span className="text-yellow-500 underline decoration-2 underline-offset-8 group-hover:text-yellow-600">Masuk di sini</span></>
            ) : (
              <>Belum punya akun? <span className="text-yellow-500 underline decoration-2 underline-offset-8 group-hover:text-yellow-600">Daftar sekarang</span></>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}