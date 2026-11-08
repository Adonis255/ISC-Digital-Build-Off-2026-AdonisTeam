import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'

export default function AnnouncementsPage() {
  const { profile, role } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', urgency: 'normal', target_role: 'all' })

  const loadAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setAnnouncements(data || [])
  }

  useEffect(() => { loadAnnouncements() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('announcements').insert([{ ...form, author_id: profile.id, status: 'published', is_public: form.target_role === 'all' }])
    setForm({ title: '', body: '', urgency: 'normal', target_role: 'all' })
    setShowForm(false)
    loadAnnouncements()
  }

  const canPost = role === 'admin' || role === 'lecturer'
  const visibleAnnouncements = announcements.filter(a => a.target_role === 'all' || a.target_role === role || a.author_id === profile.id)

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Campus Announcements</h1>
        {canPost && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Post Announcement'}
          </button>
        )}
      </div>

      {showForm && canPost && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border space-y-4">
          <input required placeholder="Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Message..." value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <div className="grid grid-cols-2 gap-4">
            <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className="border p-2 rounded">
              <option value="normal">Normal</option><option value="urgent">Urgent</option>
            </select>
            <select value={form.target_role} onChange={e => setForm({...form, target_role: e.target.value})} className="border p-2 rounded">
              <option value="all">Everyone</option>
              <option value="student">Students Only</option>
              <option value="lecturer">Lecturers Only</option>
              <option value="worker">Workers Only</option>
            </select>
          </div>
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded block">Publish</button>
        </form>
      )}

      <div className="space-y-4">
        {visibleAnnouncements.map(a => (
          <div key={a.id} className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xl">{a.title}</h3>
              <div className="flex gap-2">
                {a.target_role !== 'all' && <span className="bg-purple-100 text-purple-700 text-xs px-2 py-1 rounded font-bold uppercase">{a.target_role}</span>}
                {a.urgency === 'urgent' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold uppercase">Urgent</span>}
              </div>
            </div>
            <p className="text-slate-600 whitespace-pre-wrap">{a.body}</p>
            <p className="text-xs text-slate-400 mt-4">{new Date(a.created_at).toLocaleString()}</p>
          </div>
        ))}
      </div>
    </div>
  )
}