import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Calendar, MapPin } from 'lucide-react'

export default function EventsPage() {
  const { profile, role } = useAuth()
  const [events, setEvents] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', event_date: '', location: '' })

  const loadEvents = async () => {
    const { data } = await supabase.from('campus_events').select('*, profiles(full_name)').order('event_date', { ascending: true })
    setEvents(data || [])
  }

  useEffect(() => { loadEvents() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    await supabase.from('campus_events').insert([{ ...form, created_by: profile.id }])
    setForm({ title: '', description: '', event_date: '', location: '' })
    setShowForm(false)
    loadEvents()
  }

  const canCreate = role === 'admin' || role === 'lecturer'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Campus Events</h1>
          <p className="text-sm text-slate-500">Upcoming activities, seminars, and social gatherings.</p>
        </div>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Create Event'}
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Event Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Event Details" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="2"></textarea>
          <div className="grid grid-cols-2 gap-4">
            <input required type="datetime-local" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} className="border p-2 rounded" />
            <input required placeholder="Location (e.g. Main Auditorium)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="border p-2 rounded" />
          </div>
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg">Publish Event</button>
        </form>
      )}

      <div className="space-y-4">
        {events.map(ev => (
          <div key={ev.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col md:flex-row gap-6">
            <div className="bg-brand-50 text-brand-700 p-4 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
              <span className="text-2xl font-bold">{new Date(ev.event_date).getDate()}</span>
              <span className="text-sm font-medium uppercase">{new Date(ev.event_date).toLocaleString('default', { month: 'short' })}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-xl">{ev.title}</h3>
              <p className="text-slate-600 mt-1">{ev.description}</p>
              <div className="flex gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(ev.event_date).toLocaleTimeString()}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {ev.location}</span>
              </div>
            </div>
          </div>
        ))}
        {events.length === 0 && <p className="text-slate-500">No upcoming events.</p>}
      </div>
    </div>
  )
}