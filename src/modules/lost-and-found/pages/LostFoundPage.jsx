import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Search, ShieldCheck } from 'lucide-react'

export default function LostFoundPage() {
  const { profile, role } = useAuth()
  const [items, setItems] = useState([])
  const [claims, setClaims] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', kind: 'lost', location: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  // Claim state
  const [claimingItem, setClaimingItem] = useState(null)
  const [proof, setProof] = useState('')

  const loadData = async () => {
    const { data: i } = await supabase.from('items').select('*').order('created_at', { ascending: false })
    setItems(i || [])
    if (role === 'admin') {
      const { data: c } = await supabase.from('lost_found_claims').select('*, items(title), profiles(full_name)').order('created_at', { ascending: false })
      setClaims(c || [])
    }
  }

  useEffect(() => { loadData() }, [role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    let imageUrl = null
    if (file) {
      const fileName = `${Math.random()}.${file.name.split('.').pop()}`
      await supabase.storage.from('lost-found').upload(fileName, file)
      const { data: { publicUrl } } = supabase.storage.from('lost-found').getPublicUrl(fileName)
      imageUrl = publicUrl
    }
    await supabase.from('items').insert([{ ...form, reporter_id: profile.id, image_url: imageUrl }])
    setForm({ title: '', description: '', kind: 'lost', location: '' })
    setFile(null)
    setShowForm(false)
    setUploading(false)
    loadData()
  }

  const submitClaim = async (e) => {
    e.preventDefault()
    await supabase.from('lost_found_claims').insert([{ item_id: claimingItem.id, claimant_id: profile.id, proof }])
    setClaimingItem(null)
    setProof('')
    alert('Claim submitted! Admin will review it.')
    loadData()
  }

  const updateClaim = async (id, status) => {
    await supabase.from('lost_found_claims').update({ status }).eq('id', id)
    if (status === 'approved') {
      const claim = claims.find(c => c.id === id)
      await supabase.from('items').update({ status: 'returned' }).eq('id', claim.item_id)
    }
    loadData()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lost & Found</h1>
        {role !== 'admin' && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Report Item'}
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select value={form.kind} onChange={e => setForm({...form, kind: e.target.value})} className="border p-2 rounded">
              <option value="lost">I Lost Something</option>
              <option value="found">I Found Something</option>
            </select>
            <input required placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="border p-2 rounded" />
          </div>
          <input required placeholder="Item Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="2"></textarea>
          <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          <button type="submit" disabled={uploading} className="bg-brand-600 text-white px-4 py-2 rounded disabled:opacity-50">{uploading ? 'Uploading...' : 'Submit'}</button>
        </form>
      )}

      {claimingItem && (
        <form onSubmit={submitClaim} className="bg-blue-50 border border-blue-200 p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-lg">Claim: {claimingItem.title}</h3>
          <p className="text-sm text-slate-600">Provide private proof of ownership (serial number, unique marks, etc.). This is only visible to Admins.</p>
          <textarea required value={proof} onChange={e => setProof(e.target.value)} className="w-full border p-2 rounded" rows="3" placeholder="Proof of ownership..."></textarea>
          <div className="flex gap-2">
            <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-lg">Submit Claim</button>
            <button type="button" onClick={() => setClaimingItem(null)} className="bg-slate-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
            {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.kind === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.kind}</span>
                <span className="text-xs text-slate-400">{item.status}</span>
              </div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-slate-600 text-sm mt-1 flex-1">{item.description}</p>
              <p className="text-xs text-slate-500 mt-3 mb-3">📍 {item.location}</p>
              
              {item.kind === 'found' && item.status === 'open' && role !== 'admin' && (
                <button onClick={() => setClaimingItem(item)} className="w-full bg-slate-100 hover:bg-slate-200 text-slate-800 py-2 rounded-lg font-medium text-sm">This is mine (Claim)</button>
              )}
            </div>
          </div>
        ))}
      </div>

      {role === 'admin' && claims.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4">Pending Claims</h2>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-3">Item</th><th className="p-3">Claimant</th><th className="p-3">Proof</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
              </thead>
              <tbody>
                {claims.map(c => (
                  <tr key={c.id} className="border-b">
                    <td className="p-3 font-medium">{c.items?.title}</td>
                    <td className="p-3">{c.profiles?.full_name}</td>
                    <td className="p-3 text-sm text-slate-600">{c.proof}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{c.status}</span></td>
                    <td className="p-3 flex gap-2">
                      {c.status === 'pending' && (
                        <>
                          <button onClick={() => updateClaim(c.id, 'approved')} className="bg-green-600 text-white px-3 py-1 rounded text-xs">Approve</button>
                          <button onClick={() => updateClaim(c.id, 'rejected')} className="bg-red-600 text-white px-3 py-1 rounded text-xs">Reject</button>
                        </>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}