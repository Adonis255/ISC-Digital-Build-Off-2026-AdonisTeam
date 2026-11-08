import { useState, useEffect } from 'react'
import { Bell, Menu, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'
import { supabase } from '../../services/supabase/client.js'
import GlobalSearch from './GlobalSearch.jsx'

export default function Navbar({ toggleMenu }) {
  const { profile } = useAuth()
  const [unreadCount, setUnreadCount] = useState(0)
  const [isSearchOpen, setIsSearchOpen] = useState(false)

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
    <>
      <header className="h-20 bg-white flex items-center justify-between px-4 md:px-8 sticky top-0 z-20 border-b border-slate-200">
        <div className="flex items-center gap-4 flex-1">
          <button onClick={toggleMenu} className="p-2 md:hidden text-slate-600 hover:bg-slate-100 rounded-lg">
            <Menu className="w-6 h-6" />
          </button>
          <div className="relative max-w-md w-full hidden md:block">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input onClick={() => setIsSearchOpen(true)} readOnly type="text" placeholder="Search courses, events, or services..." className="w-full pl-10 pr-4 py-2.5 bg-slate-100 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-500 cursor-pointer" />
          </div>
        </div>
        
        <div className="flex items-center gap-6">
          <Link to={`/${profile?.role}/notifications`} className="relative p-2 hover:bg-slate-100 rounded-full transition text-slate-600">
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">{unreadCount}</span>
            )}
          </Link>
          
          <div className="flex items-center gap-3 pl-6 border-l border-slate-200">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Profile" className="w-10 h-10 rounded-full object-cover border-2 border-slate-100" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg border-2 border-slate-100">{profile?.full_name?.charAt(0) || 'U'}</div>
            )}
            <div className="hidden md:block">
              <p className="text-sm font-bold text-slate-800 leading-tight">{profile?.full_name}</p>
              <p className="text-xs text-slate-500 capitalize">{profile?.role}</p>
            </div>
          </div>
        </div>
      </header>

      {isSearchOpen && <GlobalSearch onClose={() => setIsSearchOpen(false)} />}
    </>
  )
}