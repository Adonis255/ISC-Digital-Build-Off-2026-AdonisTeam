import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '../../../services/supabase/client.js'
import { Users, Wrench, Search, Megaphone } from 'lucide-react'

export default function AdminDashboard() {
  const [stats, setStats] = useState({ users: 0, maintenance: 0, lostFound: 0, announcements: 0 })

  useEffect(() => {
    (async () => {
      const [u, m, l, a] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }),
        supabase.from('maintenance_requests').select('*', { count: 'exact', head: true }),
        supabase.from('items').select('*', { count: 'exact', head: true }),
        supabase.from('announcements').select('*', { count: 'exact', head: true })
      ])
      setStats({ users: u.count || 0, maintenance: m.count || 0, lostFound: l.count || 0, announcements: a.count || 0 })
    })()
  }, [])

  const cards = [
    { title: 'Total Users', value: stats.users, icon: Users, link: '/admin/users', color: 'bg-blue-100 text-blue-600' },
    { title: 'Maintenance Requests', value: stats.maintenance, icon: Wrench, link: '/admin/maintenance', color: 'bg-amber-100 text-amber-600' },
    { title: 'Lost & Found Items', value: stats.lostFound, icon: Search, link: '/admin/lost-found', color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Announcements', value: stats.announcements, icon: Megaphone, link: '/admin/announcements', color: 'bg-purple-100 text-purple-600' },
  ]

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Administrator Dashboard</h1>
        <p className="text-sm text-slate-500">Welcome to the admin control panel. Manage the entire campus from here.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Link key={card.title} to={card.link} className="bg-white p-6 rounded-xl border shadow-sm hover:shadow-md transition">
            <div className={`w-10 h-10 rounded-lg grid place-items-center mb-4 ${card.color}`}>
              <card.icon className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-slate-800">{card.title}</h3>
            <p className="text-3xl font-bold mt-1">{card.value}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}