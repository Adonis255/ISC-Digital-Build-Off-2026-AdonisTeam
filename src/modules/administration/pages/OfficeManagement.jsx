import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Building, Plus, Trash2, Image as ImageIcon, MapPin, Clock, Phone, Search } from 'lucide-react'

export default function OfficeManagement() {
  const [offices, setOffices] = useState([])
  const [form, setForm] = useState({ name: '', building: '', room: '', operating_hours: '', services: '', contact_number: '', description: '' })
  const [imageFiles, setImageFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const loadOffices = async () => {
    const { data } = await supabase.from('offices').select('*').order('name')
    setOffices(data || [])
  }

  useEffect(() => { loadOffices() }, [])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    
    // Upload up to 5 images
    const uploadedUrls = []
    const filesToUpload = imageFiles.slice(0, 5) // limit to 5
    for (const file of filesToUpload) {
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
      setForm({ name: '', building: '', room: '', operating_hours: '', services: '', contact_number: '', description: '' })
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

  const filteredOffices = offices.filter(o => o.name.toLowerCase().includes(search.toLowerCase()) || o.services?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><Building className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Campus Directory Management</h1>
          <p className="text-sm text-slate-500">Add offices, locations, photos, and contact details.</p>
        </div>
      </div>

      <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
        <h2 className="font-bold text-lg border-b pb-2 text-slate-800">Add New Office / Department</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <input required placeholder="Office/Department Name (e.g. Admissions)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
          <input required placeholder="Building (e.g. Main Block)" value={form.building} onChange={e => setForm({...form, building: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <input placeholder="Room Number" value={form.room} onChange={e => setForm({...form, room: e.target.value})} className="w-full border p-3 rounded-xl" />
          <input placeholder="Operating Hours (e.g. Mon-Fri 8AM-5PM)" value={form.operating_hours} onChange={e => setForm({...form, operating_hours: e.target.value})} className="w-full border p-3 rounded-xl" />
          <input placeholder="Contact Phone Number" value={form.contact_number} onChange={e => setForm({...form, contact_number: e.target.value})} className="w-full border p-3 rounded-xl" />
        </div>

        <input placeholder="Services Offered (e.g. Fee Clearance, Admissions)" value={form.services} onChange={e => setForm({...form, services: e.target.value})} className="w-full border p-3 rounded-xl" />
        <textarea placeholder="Brief description of the office..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-3 rounded-xl" rows="2"></textarea>
        
        <div>
          <label className="block text-sm font-medium mb-1">Upload Location Images (Select up to 5)</label>
          <input type="file" multiple accept="image/*" onChange={e => setImageFiles(Array.from(e.target.files))} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
          <p className="text-xs text-slate-400 mt-1">{imageFiles.length} file(s) selected (Max 5).</p>
        </div>

        <button type="submit" disabled={loading} className="bg-brand-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-700 disabled:opacity-50 transition">{loading ? 'Saving...' : 'Add Office'}</button>
      </form>

      <div className="relative mt-8">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input type="text" placeholder="Search offices..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOffices.map(o => (
          <div key={o.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col">
            {o.image_urls && o.image_urls.length > 0 ? (
              <div className="grid grid-cols-2 gap-1 h-48 bg-slate-100">
                {o.image_urls.slice(0, 4).map((url, i) => (
                  <img key={i} src={url} alt="Office" className="w-full h-full object-cover" />
                ))}
                {o.image_urls.length > 4 && (
                   <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs font-bold px-2 py-1 rounded">+{o.image_urls.length - 4} more</div>
                )}
              </div>
            ) : (
              <div className="w-full h-48 bg-slate-50 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-slate-300" /></div>
            )}
            <div className="p-5 flex-1 flex flex-col">
              <h3 className="font-bold text-lg text-slate-800">{o.name}</h3>
              <p className="text-sm text-brand-600 font-bold mb-2">{o.services}</p>
              
              <div className="space-y-1 text-sm text-slate-500 mb-4 flex-1">
                <p className="flex items-center gap-2"><MapPin className="w-4 h-4" /> {o.building} • {o.room}</p>
                <p className="flex items-center gap-2"><Clock className="w-4 h-4" /> {o.operating_hours}</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4" /> {o.contact_number || 'No phone provided'}</p>
              </div>
              
              <button onClick={() => handleDelete(o.id)} className="text-red-500 text-sm font-bold self-end hover:underline">Delete Office</button>
            </div>
          </div>
        ))}
        {filteredOffices.length === 0 && <p className="text-center col-span-full text-slate-500">No offices found.</p>}
      </div>
    </div>
  )
}