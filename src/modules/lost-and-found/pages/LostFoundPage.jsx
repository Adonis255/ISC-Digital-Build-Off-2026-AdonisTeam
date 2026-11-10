import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Search, ShieldCheck, MessageSquare, Image as ImageIcon } from 'lucide-react'

export default function LostFoundPage() {
  const { profile, role } = useAuth()
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [activeTab, setActiveTab] = useState('Latest')
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', kind: 'lost', location: '' })
  const [imageFile, setImageFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  
  const [claimingItem, setClaimingItem] = useState(null)
  const [claimData, setClaimData] = useState({ proof: '', phone: '' })
  
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState({})

  const loadData = async () => {
    let query = supabase.from('items').select('*').order('created_at', { ascending: activeTab === 'Old' })
    const { data: i } = await query
    setItems(i || [])
    
    if (role === 'admin') {
      const { data: c } = await supabase.from('lost_found_claims').select('*, items(title), profiles(full_name)').order('created_at', { ascending: false })
      setClaims(c || [])
    }

    const { data: cm } = await supabase.from('item_comments').select('*, profiles(full_name)')
    const grouped = {}
    cm?.forEach(c => {
      if (!grouped[c.item_id]) grouped[c.item_id] = []
      grouped[c.item_id].push(c)
    })
    setComments(grouped)
  }

  useEffect(() => { loadData() }, [activeTab, role])

  const handleSubmitItem = async (e) => {
    e.preventDefault()
    setUploading(true)
    
    let imageUrl = null
    if (imageFile) {
      const fileName = `lostfound-${Math.random()}.${imageFile.name.split('.').pop()}`
      const { error: uploadErr } = await supabase.storage.from('lost-found').upload(fileName, imageFile)
      if (!uploadErr) {
        const { data } = supabase.storage.from('lost-found').getPublicUrl(fileName)
        imageUrl = data.publicUrl
      }
    }

    await supabase.from('items').insert([{ ...form, reporter_id: profile.id, image_url: imageUrl }])
    
    setForm({ title: '', description: '', kind: 'lost', location: '' })
    setImageFile(null)
    setUploading(false)
    setShowForm(false)
    loadData()
  }

  const handleClaim = async (e) => {
    e.preventDefault()
    await supabase.from('lost_found_claims').insert([{ item_id: claimingItem.id, claimant_id: profile.id, proof: claimData.proof, phone: claimData.phone }])
    setClaimingItem(null); setClaimData({ proof: '', phone: '' }); loadData()
  }

  const handleComment = async (itemId) => {
    const text = commentText[itemId]
    if (!text) return
    await supabase.from('item_comments').insert([{ item_id: itemId, user_id: profile.id, content: text }])
    setCommentText({ ...commentText, [itemId]: '' })
    loadData()
  }

  const updateClaim = async (id, status) => {
    await supabase.from('lost_found_claims').update({ status }).eq('id', id)
    loadData()
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Lost & Found</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-xl">Report Item</button>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {['Latest', 'Old'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-medium border-b-2 ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500'}`}>{tab} Posts</button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleSubmitItem} className="bg-white p-6 rounded-2xl border space-y-4">
          <select value={form.kind} onChange={e => setForm({...form, kind: e.target.value})} className="border p-2 rounded-xl w-full"><option value="lost">I Lost Something</option><option value="found">I Found Something</option></select>
          <input required placeholder="Item Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded-xl" />
          <textarea required placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded-xl" rows="2"></textarea>
          <input required placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border p-2 rounded-xl" />
          
          <div>
            <label className="block text-sm font-medium mb-1">Upload Photo (Optional)</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
          </div>

          <button type="submit" disabled={uploading} className="bg-navy-900 text-white px-6 py-2 rounded-xl">{uploading ? 'Uploading...' : 'Submit'}</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
            {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover" />}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.kind === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.kind}</span>
                <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-sm text-slate-600 mb-4 flex-1">{item.description}</p>
              
              {item.kind === 'found' && role !== 'admin' && (
                <button onClick={() => setClaimingItem(item)} className="w-full bg-slate-100 py-2 rounded-lg font-medium mb-3">Claim Item</button>
              )}

              <div className="border-t pt-3">
                <div className="space-y-2 mb-3">
                  {(comments[item.id] || []).map(c => (
                    <p key={c.id} className="text-xs bg-slate-50 p-2 rounded"><strong>{c.profiles?.full_name}:</strong> {c.content}</p>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" placeholder="Ask about this item..." value={commentText[item.id] || ''} onChange={e => setCommentText({...commentText, [item.id]: e.target.value})} className="flex-1 border p-1.5 rounded-lg text-xs" />
                  <button onClick={() => handleComment(item.id)} className="bg-brand-600 text-white px-3 py-1.5 rounded-lg text-xs">Send</button>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {claimingItem && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <form onSubmit={handleClaim} className="bg-white p-6 rounded-2xl w-full max-w-md shadow-xl">
            <h3 className="font-bold text-lg mb-2">Claim: {claimingItem.title}</h3>
            <p className="text-xs text-slate-500 mb-4">Provide proof of ownership. Admin will verify.</p>
            <input required placeholder="Phone Number" value={claimData.phone} onChange={e => setClaimData({...claimData, phone: e.target.value})} className="w-full border p-2 rounded-xl mb-3" />
            <textarea required placeholder="Proof of ownership (Serial number, unique marks, etc.)..." value={claimData.proof} onChange={e => setClaimData({...claimData, proof: e.target.value})} className="w-full border p-2 rounded-xl mb-4" rows="3"></textarea>
            <button type="submit" className="bg-brand-600 text-white w-full py-2 rounded-xl">Submit Claim</button>
          </form>
        </div>
      )}
    </div>
  )
}