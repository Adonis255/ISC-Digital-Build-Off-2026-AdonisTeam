import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'

export default function LostFoundPage() {
  const { profile } = useAuth()
  const [items, setItems] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', description: '', kind: 'lost', location: '' })
  const [file, setFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const loadItems = async () => {
    const { data } = await supabase.from('items').select('*').order('created_at', { ascending: false })
    setItems(data || [])
  }

  useEffect(() => { loadItems() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setUploading(true)
    let imageUrl = null

    if (file) {
      const fileExt = file.name.split('.').pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError } = await supabase.storage.from('lost-found').upload(fileName, file)
      if (uploadError) { alert(uploadError.message); setUploading(false); return }
      const { data: { publicUrl } } = supabase.storage.from('lost-found').getPublicUrl(fileName)
      imageUrl = publicUrl
    }

    await supabase.from('items').insert([{ ...form, reporter_id: profile.id, image_url: imageUrl }])
    setForm({ title: '', description: '', kind: 'lost', location: '' })
    setFile(null)
    setShowForm(false)
    setUploading(false)
    loadItems()
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Lost & Found</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
          {showForm ? 'Cancel' : '+ Report Item'}
        </button>
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
          <textarea required placeholder="Description" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <div>
            <label className="block text-sm font-medium mb-1">Upload Photo</label>
            <input type="file" accept="image/*" onChange={e => setFile(e.target.files[0])} className="block w-full text-sm text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-brand-50 file:text-brand-700 hover:file:bg-brand-100" />
          </div>
          <button type="submit" disabled={uploading} className="bg-brand-600 text-white px-4 py-2 rounded disabled:opacity-50">
            {uploading ? 'Uploading...' : 'Submit Report'}
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map(item => (
          <div key={item.id} className="bg-white rounded-xl border shadow-sm overflow-hidden flex flex-col">
            {item.image_url && <img src={item.image_url} alt={item.title} className="w-full h-48 object-cover border-b" />}
            <div className="p-5 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${item.kind === 'lost' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>{item.kind}</span>
                <span className="text-xs text-slate-400">{new Date(item.created_at).toLocaleDateString()}</span>
              </div>
              <h3 className="font-bold text-lg">{item.title}</h3>
              <p className="text-slate-600 text-sm mt-1 flex-1">{item.description}</p>
              <p className="text-xs text-slate-500 mt-3 font-medium">?? {item.location}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
