import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Calendar, MapPin, Heart, Image as ImageIcon, Video, X, Play, Plus, Trash2 } from 'lucide-react'

export default function EventsPage() {
  const { profile, role } = useAuth()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [media, setMedia] = useState([])
  const [likes, setLikes] = useState([])
  const [showForm, setShowForm] = useState(false)
  
  const [form, setForm] = useState({ title: '', description: '', event_date: '', location: '', is_recurring: false, recurrence_pattern: '' })
  const [coverImage, setCoverImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const [mediaFile, setMediaFile] = useState(null)

  const loadEvents = async () => {
    const { data } = await supabase.from('campus_events').select('*, profiles(full_name)').order('event_date', { ascending: false })
    setEvents(data || [])
    const { data: l } = await supabase.from('event_likes').select('*')
    setLikes(l || [])
  }

  useEffect(() => { loadEvents() }, [])

  const loadEventDetails = async (event) => {
    setSelectedEvent(event)
    const { data: m } = await supabase.from('event_media').select('*, profiles(full_name)').eq('event_id', event.id).order('created_at', { ascending: false })
    setMedia(m || [])
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    setLoading(true)
    let imageUrl = null

    if (coverImage) {
      const fileName = `event-${Math.random()}.${coverImage.name.split('.').pop()}`
      await supabase.storage.from('community-media').upload(fileName, coverImage)
      const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    await supabase.from('campus_events').insert([{ ...form, created_by: profile.id, image_url: imageUrl }])
    setForm({ title: '', description: '', event_date: '', location: '', is_recurring: false, recurrence_pattern: '' })
    setCoverImage(null); setShowForm(false); setLoading(false); loadEvents()
  }

  const handleDeleteEvent = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Admin: Delete this event permanently?')) return
    await supabase.from('campus_events').delete().eq('id', id)
    loadEvents()
  }

  const handleUploadMedia = async (e) => {
    e.preventDefault()
    if (!mediaFile) return
    setLoading(true)
    const isVideo = mediaFile.type.startsWith('video')
    const fileName = `evt-${Math.random()}.${mediaFile.name.split('.').pop()}`
    await supabase.storage.from('community-media').upload(fileName, mediaFile)
    const { data } = await supabase.storage.from('community-media').getPublicUrl(fileName)

    await supabase.from('event_media').insert([{ event_id: selectedEvent.id, user_id: profile.id, media_url: data.publicUrl, media_type: isVideo ? 'video' : 'image' }])
    setMediaFile(null); setLoading(false); loadEventDetails(selectedEvent)
  }

  const toggleLike = async (eventId) => {
    const existing = likes.find(l => l.event_id === eventId && l.user_id === profile.id)
    if (existing) await supabase.from('event_likes').delete().eq('id', existing.id)
    else await supabase.from('event_likes').insert([{ event_id: eventId, user_id: profile.id }])
    loadEvents()
  }

  const canCreate = role === 'admin' || role === 'student'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Campus Events</h1>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Create Event'}
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <form onSubmit={handleCreateEvent} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Event Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Full description of the event..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="datetime-local" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} className="border p-2 rounded" />
            <input required placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="border p-2 rounded" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})} className="w-4 h-4" /> Recurring Event?
            </label>
            {form.is_recurring && <input placeholder="e.g. Every Monday" value={form.recurrence_pattern} onChange={e => setForm({...form, recurrence_pattern: e.target.value})} className="border p-1 text-sm rounded" />}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setCoverImage(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
          </div>
          <button type="submit" disabled={loading} className="bg-navy-900 text-white px-6 py-2 rounded-lg">{loading ? 'Creating...' : 'Publish Event'}</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(ev => {
          const likeCount = likes.filter(l => l.event_id === ev.id).length
          const isLiked = likes.some(l => l.event_id === ev.id && l.user_id === profile.id)
          
          return (
            <div key={ev.id} onClick={() => loadEventDetails(ev)} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md cursor-pointer transition flex flex-col group relative">
              {role === 'admin' && (
                <button onClick={(e) => handleDeleteEvent(e, ev.id)} className="absolute top-2 right-2 z-10 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition" title="Admin Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {ev.image_url ? (
                <img src={ev.image_url} alt={ev.title} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <div className="w-full h-48 bg-brand-50 flex items-center justify-center"><Calendar className="w-10 h-10 text-brand-300" /></div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-800">{ev.title}</h3>
                <p className="text-sm text-slate-500 mt-1 flex-1 line-clamp-2">{ev.description}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(ev.event_date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-slate-400">By {ev.profiles?.full_name}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(ev.id) }} className={`flex items-center gap-1 text-sm ${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}`}>
                    <Heart className={`w-4 h-4 ${isLiked ? 'fill-current' : ''}`} /> {likeCount}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative h-64">
              {selectedEvent.image_url ? (
                <img src={selectedEvent.image_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-navy-900 flex items-center justify-center"><Calendar className="w-16 h-16 text-white/20" /></div>
              )}
              <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{selectedEvent.title}</h2>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(selectedEvent.event_date).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedEvent.location}</span>
                  </div>
                  {selectedEvent.is_recurring && <p className="mt-1 text-sm font-medium text-brand-600">🔄 Recurring: {selectedEvent.recurrence_pattern}</p>}
                </div>
                <button onClick={() => toggleLike(selectedEvent.id)} className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition">
                  <Heart className="w-5 h-5" /> {likes.filter(l => l.event_id === selectedEvent.id).length} Likes
                </button>
              </div>
              
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-8">{selectedEvent.description}</p>

              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Event Gallery</h3>
                
                <form onSubmit={handleUploadMedia} className="flex gap-2 mb-6">
                  <input type="file" accept="image/*,video/*" onChange={e => setMediaFile(e.target.files[0])} className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700" />
                  <button type="submit" disabled={loading || !mediaFile} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">Upload Media</button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {media.map(m => (
                    <div key={m.id} className="relative rounded-xl overflow-hidden border bg-black group">
                      {m.media_type === 'video' ? (
                        <video src={m.media_url} controls className="w-full h-40 object-cover" />
                      ) : (
                        <img src={m.media_url} alt="Media" className="w-full h-40 object-cover hover:opacity-80 transition cursor-pointer" />
                      )}
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded">{m.profiles?.full_name}</span>
                    </div>
                  ))}
                  {media.length === 0 && <p className="text-sm text-slate-500 col-span-3 text-center py-4">No media uploaded yet. Be the first!</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}