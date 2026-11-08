import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Bell } from 'lucide-react'

export default function NotificationsPage() {
  const { profile } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    if (!profile) return
    const { data } = await supabase.from('notifications').select('*').eq('user_id', profile.id).order('created_at', { ascending: false })
    setNotifications(data || [])
    setLoading(false)
  }

  useEffect(() => { loadNotifications() }, [profile?.id])

  const markAllRead = async () => {
    await supabase.from('notifications').update({ is_read: true }).eq('user_id', profile.id).eq('is_read', false)
    loadNotifications()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-sm text-slate-500">Your recent alerts and updates.</p>
        </div>
        <button onClick={markAllRead} className="text-sm text-brand-600 font-medium hover:underline">Mark all as read</button>
      </div>
      {loading ? <p>Loading...</p> : (
        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          {notifications.map((notif, index) => (
            <div key={notif.id} className={`p-5 flex gap-4 ${index !== notifications.length - 1 ? 'border-b' : ''} ${notif.is_read ? 'bg-white' : 'bg-blue-50/50'}`}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${notif.is_read ? 'bg-slate-100 text-slate-500' : 'bg-brand-100 text-brand-600'}`}>
                <Bell className="w-5 h-5" />
              </div>
              <div>
                <h3 className={`font-semibold ${notif.is_read ? 'text-slate-700' : 'text-slate-900'}`}>{notif.title}</h3>
                <p className="text-sm text-slate-600 mt-1">{notif.message}</p>
                <p className="text-xs text-slate-400 mt-2">{new Date(notif.created_at).toLocaleString()}</p>
              </div>
            </div>
          ))}
          {notifications.length === 0 && <p className="p-10 text-center text-slate-500">You have no notifications.</p>}
        </div>
      )}
    </div>
  )
}