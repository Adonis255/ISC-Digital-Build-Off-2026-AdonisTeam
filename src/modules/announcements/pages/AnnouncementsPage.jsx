import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'

export default function AnnouncementsPage() {
  const { profile, role } = useAuth()
  const [announcements, setAnnouncements] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', body: '', urgency: 'normal' })

  const loadAnnouncements = async () => {
    const { data } = await supabase.from('announcements').select('*').order('created_at', { ascending: false })
    setAnnouncements(data || [])
  }

  useEffect(() => { loadAnnouncements() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('announcements').insert([{ 
      ...form, 
      author_id: profile.id,
      status: 'published',
      scope: 'public',
      is_public: true
    }])
    setForm({ title: '', body: '', urgency: 'normal' })
    setShowForm(false)
    loadAnnouncements()
  }

  const canPost = role === 'admin' || role === 'lecturer'

  return (
    <div className="space-y-6">
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
          <input required placeholder="Announcement Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Write your message here..." value={form.body} onChange={e => setForm({...form, body: e.target.value})} className="w-full border p-2 rounded" rows="4"></textarea>
          <select value={form.urgency} onChange={e => setForm({...form, urgency: e.target.value})} className="border p-2 rounded">
            <option value="low">Low Priority</option><option value="normal">Normal</option><option value="urgent">Urgent</option>
          </select>
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded block">Publish</button>
        </form>
      )}

      <div className="space-y-4">
        {announcements.map(a => (
          <div key={a.id} className="bg-white p-6 rounded-xl border shadow-sm">
            <div className="flex justify-between items-center mb-2">
              <h3 className="font-bold text-xl">{a.title}</h3>
              {a.urgency === 'urgent' && <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded font-bold uppercase">Urgent</span>}
            </div>
            <p className="text-slate-600 whitespace-pre-wrap">{a.body}</p>
            <p className="text-xs text-slate-400 mt-4">{new Date(a.created_at).toLocaleString()}</p>
          </div>
        ))}
        {announcements.length === 0 && <p className="text-slate-500">No announcements posted yet.</p>}
      </div>
    </div>
  )
}