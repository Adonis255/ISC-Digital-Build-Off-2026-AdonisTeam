import { useState, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { supabase } from '../../services/supabase/client.js'

export default function Navbar() {
  const { profile } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    if (!profile) return
    const fetchUnread = async () => {
      const { count } = await supabase.from('notifications').select('*', { count: 'exact', head: true }).eq('user_id', profile.id).eq('is_read', false)
      setUnreadCount(count || 0)
    }
    fetchUnread()
    const sub = supabase.channel('public:notifications').on('postgres_changes', { event: '*', schema: 'public', table: 'notifications', filter: `user_id=eq.${profile.id}` }, fetchUnread).subscribe()
    return () => supabase.removeChannel(sub)
  }, [profile])

  return (
    <header className="h-16 bg-white border-b flex items-center justify-between px-8 sticky top-0 z-10">
      <h2 className="font-semibold text-slate-800">Welcome back, {profile?.full_name?.split(' ')[0]}</h2>
      <Link to={`/${profile?.role}/notifications`} className="relative p-2 hover:bg-slate-100 rounded-full transition">
        <Bell className="w-5 h-5 text-slate-600" />
        {unreadCount > 0 && <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>}
      </Link>
    </header>
  )
}