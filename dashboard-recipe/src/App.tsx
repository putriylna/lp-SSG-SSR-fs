import { useState, useEffect, createContext, useContext } from 'react'
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { supabase } from './lib/supabaseClient.ts'
import { Session } from '@supabase/supabase-js'
import { SidebarProvider } from '../src/components/context/SidebarContext.tsx'

// Pages
import Login from './pages/Login.tsx'
import Dashboard from './pages/Dashboard.tsx'
import MyRecipes from './pages/MyRecipes.tsx'
import Categories from './pages/Categories.tsx'
import AddRecipe from './pages/AddRecipe.tsx'
import EditRecipe from './pages/EditRecipe.tsx'
import RecipeDetail from './pages/RecipeDetail.tsx'
import UpdateProfile from './pages/UpdateProfile.tsx'
import OAuthCallback from './pages/OAuthCallback'; // Import

interface AuthContextType {
  session: Session | null
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({ session: null, loading: true })
export const useAuth = () => useContext(AuthContext)

const App: React.FC = () => {
  const [session, setSession] = useState<Session | null>(null)
  const [loading, setLoading] = useState(true)

  // Cek apakah ini jendela pop-up (dibuka oleh window.open)
  const isPopup = window.opener !== null;

  useEffect(() => {
    // 1. Ambil session awal
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setLoading(false)
    })

    // 2. Listener perubahan Auth internal Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session)
      setLoading(false)
    })

    // 3. --- PERBAIKAN: Sinkronisasi Logout dari Astro ---
    const authChannel = new BroadcastChannel("auth_sync");
    
    authChannel.onmessage = async (event) => {
      if (event.data.type === "LOGOUT_EVENT") {
        // Hapus session supabase dan bersihkan state
        await supabase.auth.signOut();
        setSession(null);
        // Pastikan token benar-benar dihapus
        localStorage.removeItem("sb-ioltdxkiemcxlskvqbpc-auth-token");
        window.location.href = "/login"; // Force redirect
      }
    };

    return () => {
      subscription.unsubscribe();
      authChannel.close(); // Tutup channel saat komponen unmount
    }
  }, [])

  if (loading) return (
    <div className="h-screen flex flex-col items-center justify-center bg-slate-50">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-500"></div>
      <p className="mt-4 text-slate-500 font-medium">Memuat Dapur...</p>
    </div>
  )

  return (
    <AuthContext.Provider value={{ session, loading }}>
      <SidebarProvider>
        <Router>
          <Routes>
            {/* Route Login selalu bisa diakses */}
            <Route path="/login" element={<Login />} />
            <Route path="/oauth-callback" element={<OAuthCallback />} />

            {session ? (
              <>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/my-recipes" element={<MyRecipes />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/add-recipe" element={<AddRecipe />} />
                <Route path="/edit-recipe/:id" element={<EditRecipe />} />
                <Route path="/recipe/:id" element={<RecipeDetail />} />
                <Route path="/update-profile" element={<UpdateProfile />} />
                
                {/* Jika di dalam POP-UP, biarkan di Login agar script window.close() bekerja.
                  Jika di tab utama, arahkan ke dashboard.
                */}
                <Route 
                  path="*" 
                  element={isPopup ? <Login /> : <Navigate to="/dashboard" />} 
                />
              </>
            ) : (
              <Route path="*" element={<Navigate to="/login" replace />} />
            )}
          </Routes>
        </Router>
      </SidebarProvider>
    </AuthContext.Provider>
  )
}

export default App