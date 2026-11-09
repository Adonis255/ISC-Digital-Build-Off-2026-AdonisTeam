import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Building, Plus, Trash2, Image as ImageIcon } from 'lucide-react'

export default function OfficeManagement() {
  const [offices, setOffices] = useState([])
  const [form, setForm] = useState({ name: '', building: '', room: '', operating_hours: '', services: '', description: '' })
  const [imageFiles, setImageFiles] = useState([])
  const [loading, setLoading] = useState(false)

  const loadOffices = async () => {
    const { data } = await supabase.from('offices').select('*').order('name')
    setOffices(data || [])
  }

  useEffect(() => { loadOffices() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Upload images
    const uploadedUrls = []
    for (const file of imageFiles) {
      const fileName = `office-${Math.random()}.${file.name.split('.').pop()}`
      const { error } = await supabase.storage.from('community-media').upload(fileName, file)
      if (!error) {
        const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
        uploadedUrls.push(data.publicUrl)
      }
    }

    const { error } = await supabase.from('offices').insert([{ ...form, image_urls: uploadedUrls }])
    
    if (error) alert(error.message)
    else {
      setForm({ name: '', building: '', room: '', operating_hours: '', services: '', description: '' })
      setImageFiles([])
      loadOffices()
    }
    setLoading(false)
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this office?')) return
    await supabase.from('offices').delete().eq('id', id)
    loadOffices()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Building className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Office Management</h1>
          <p className="text-sm text-slate-500">Register campus offices, locations, and images.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Office Name (e.g. Admissions)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
          <input required placeholder="Building (e.g. Main Block)" value={form.building} onChange={e => setForm({...form, building: e.target.value})} className="w-full border p-2 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input placeholder="Room Number" value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full border p-2 rounded-xl" />
          <input placeholder="Operating Hours" value={form.operating_hours} onChange={e => setForm({...form, operating_hours: e.target.value})} className="w-full border p-2 rounded-xl" />
        </div>

        <input placeholder="Services Offered (comma separated)" value={form.services} onChange={e => setForm({...form, services: e.target.value})} className="w-full border p-2 rounded-xl" />
        <textarea placeholder="Office Description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded-xl" rows="2"></textarea>
        
        <div>
          <label className="block text-sm font-medium mb-1">Upload Location Images (Select Multiple)</label>
          <input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files))} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
        </div>

        <button type="submit" disabled={loading} className="bg-brand-600 text-white px-6 py-2 rounded-xl disabled:opacity-50">{loading ? 'Saving...' : 'Add Office'}</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {offices.map(o => (
          <div key={o.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
            {o.image_urls && o.image_urls.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 h-40">
                {o.image_urls.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="Office" className="w-full h-full object-cover" />
                ))}
              </div>
            ) : (
              <div className="w-full h-40 bg-slate-100 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-300" /></div>
            )}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-slate-800">{o.name}</h3>
              <p className="text-sm text-slate-600 font-medium">{o.building} • {o.room}</p>
              <p className="text-sm text-slate-500 mt-2 flex-1">{o.services}</p>
              <button onClick={() => handleDelete(o.id)} className="mt-4 text-red-500 text-sm font-bold self-end hover:underline">Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}