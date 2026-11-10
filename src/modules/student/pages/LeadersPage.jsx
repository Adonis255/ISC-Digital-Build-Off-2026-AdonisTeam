import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { ShieldCheck, Star, MessageSquare, Plus, X } from 'lucide-react'

const CATEGORIES = ['All', 'Department Heads', 'Student Body', 'Class Representatives', 'Club Leaders']

export default function LeadersPage() {
  const { profile, role } = useAuth()
  const [leaders, setLeaders] = useState([])
  const [reviews, setReviews] = useState([])
  const [activeTab, setActiveTab] = useState('All')
  const [selectedLeader, setSelectedLeader] = useState(null)
  
  // Form State (Admin)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', position: '', category: 'Student Body', image_url: '' })
  const [loading, setLoading] = useState(false)

  // Review State (Student)
  const [rating, setRating] = useState(5)
  const [comment, setComment] = useState('')

  const loadData = async () => {
    const { data: l } = await supabase.from('leaders').select('*').order('created_at', { ascending: false })
    setLeaders(l || [])
    const { data: r } = await supabase.from('leader_reviews').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setReviews(r || [])
  }

  useEffect(() => { loadData() }, [])

  const handleCreateLeader = async (e) => {
    e.preventDefault()
    setLoading(true)
    await supabase.from('leaders').insert([form])
    setForm({ name: '', position: '', category: 'Student Body', image_url: '' })
    setShowForm(false)
    setLoading(false)
    loadData()
  }

  const handleSubmitReview = async (e, leaderId) => {
    e.preventDefault()
    const { error } = await supabase.from('leader_reviews').upsert([{ 
      leader_id: leaderId, 
      user_id: profile.id, 
      rating, 
      comment 
    }], { onConflict: 'leader_id,user_id' })
    
    if (error) alert(error.message)
    else {
      setComment('')
      setRating(5)
      loadData()
    }
  }

  const filteredLeaders = activeTab === 'All' ? leaders : leaders.filter(l => l.category === activeTab)

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><ShieldCheck className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Student Leaders Board</h1>
            <p className="text-sm text-slate-500">Evaluate and discuss your campus leaders.</p>
          </div>
        </div>
        {role === 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Add Leader'}
          </button>
        )}
      </div>

      {showForm && role === 'admin' && (
        <form onSubmit={handleCreateLeader} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Full Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="border p-2 rounded-xl" />
            <input required placeholder="Position (e.g. President)" value={form.position} onChange={e => setForm({...form, position: e.target.value})} className="border p-2 rounded-xl" />
          </div>
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="w-full border p-2 rounded-xl">
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <input placeholder="Image URL (Optional)" value={form.image_url} onChange={e => setForm({...form, image_url: e.target.value})} className="w-full border p-2 rounded-xl" />
          <button type="submit" disabled={loading} className="bg-navy-900 text-white px-6 py-2 rounded-xl">Post Leader</button>
        </form>
      )}

      <div className="flex gap-2 overflow-x-auto pb-2">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${activeTab === cat ? 'bg-brand-600 text-white shadow-md' : 'bg-white text-slate-600 border border-slate-200'}`}>
            {cat}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredLeaders.map(leader => {
          const leaderReviews = reviews.filter(r => r.leader_id === leader.id)
          const avgRating = leaderReviews.length > 0 ? (leaderReviews.reduce((sum, r) => sum + r.rating, 0) / leaderReviews.length).toFixed(1) : 0
          const progressPercent = (avgRating / 5) * 100

          return (
            <div key={leader.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
              <div className="p-6 flex items-center gap-4">
                {leader.image_url ? (
                  <img src={leader.image_url} alt={leader.name} className="w-20 h-20 rounded-full object-cover border-4 border-slate-50" />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center text-2xl font-bold border-4 border-slate-50">{leader.name.charAt(0)}</div>
                )}
                <div>
                  <h3 className="font-bold text-xl text-slate-800">{leader.name}</h3>
                  <p className="text-brand-600 font-medium">{leader.position}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 text-slate-500 rounded text-[10px] font-bold uppercase">{leader.category}</span>
                </div>
              </div>

              <div className="px-6 pb-4">
                <div className="flex justify-between items-end mb-1">
                  <span className="text-sm font-bold text-slate-700">Evaluation Rating</span>
                  <span className="text-sm font-bold text-brand-600">{avgRating} / 5.0</span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-yellow-400 h-2.5 rounded-full" style={{ width: `${progressPercent}%` }}></div>
                </div>
              </div>

              <div className="border-t p-4 bg-slate-50 mt-auto flex justify-between items-center">
                <button onClick={() => setSelectedLeader(leader)} className="text-sm font-bold text-slate-600 hover:text-brand-600 flex items-center gap-1">
                  <MessageSquare className="w-4 h-4" /> {leaderReviews.length} Reviews
                </button>
                <button onClick={() => setSelectedLeader(leader)} className="bg-white border text-brand-600 border-brand-200 px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-brand-50 transition">
                  Evaluate
                </button>
              </div>
            </div>
          )
        })}
      </div>

      {selectedLeader && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-4 border-b flex justify-between bg-slate-50">
              <h2 className="font-bold">{selectedLeader.name} - Reviews</h2>
              <button onClick={() => setSelectedLeader(null)}><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-slate-100">
              {reviews.filter(r => r.leader_id === selectedLeader.id).map(r => (
                <div key={r.id} className="bg-white p-3 rounded-xl shadow-sm border text-sm">
                  <div className="flex justify-between items-center mb-1">
                    <p className="font-bold text-xs">{r.profiles?.full_name}</p>
                    <div className="flex text-yellow-400">
                      {[...Array(r.rating)].map((_, i) => <Star key={i} className="w-3 h-3 fill-current" />)}
                    </div>
                  </div>
                  <p className="text-slate-600">{r.comment}</p>
                </div>
              ))}
              {reviews.filter(r => r.leader_id === selectedLeader.id).length === 0 && <p className="text-center text-slate-500 py-4">No reviews yet.</p>}
            </div>

            <div className="p-4 border-t bg-white">
              <form onSubmit={(e) => handleSubmitReview(e, selectedLeader.id)} className="space-y-3">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold">Rating:</span>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button type="button" key={star} onClick={() => setRating(star)}>
                      <Star className={`w-6 h-6 ${rating >= star ? 'text-yellow-400 fill-current' : 'text-slate-300'}`} />
                    </button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input required placeholder="Leave a comment..." value={comment} onChange={e => setComment(e.target.value)} className="flex-1 border rounded-xl px-3 py-2 text-sm" />
                  <button type="submit" className="bg-brand-600 text-white px-4 rounded-xl text-sm">Post</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}