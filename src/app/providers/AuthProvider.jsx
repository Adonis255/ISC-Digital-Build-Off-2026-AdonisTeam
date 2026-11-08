import { createContext, useEffect, useState, useCallback } from 'react'
import { supabase } from '../../services/supabase/client.js'

export const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null)
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async (userId) => {
    if (!userId) { setProfile(null); return }
    const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
    if (error) { console.error(error); setProfile(null) } 
    else { setProfile(data) }
  }, [])

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      setSession(data.session)
      if (data.session?.user) await loadProfile(data.session.user.id)
      setLoading(false)
    })

    const { data: sub } = supabase.auth.onAuthStateChange(async (_e, s) => {
      setSession(s)
      if (s?.user) await loadProfile(s.user.id)
      else setProfile(null)
    })
    return () => sub.subscription.unsubscribe()
  }, [loadProfile])

  const signOut = async () => { 
    await supabase.auth.signOut()
    setProfile(null)
    setSession(null)
    window.location.href = '/login'
  }

  return (
    <AuthContext.Provider value={{ user: session?.user, profile, role: profile?.role, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  )
}
