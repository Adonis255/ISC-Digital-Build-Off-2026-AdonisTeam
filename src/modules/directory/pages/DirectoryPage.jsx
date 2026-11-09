import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Search, Mail, MapPin, Clock, Image as ImageIcon } from 'lucide-react'

export default function DirectoryPage() {
  const [staff, setStaff] = useState([])
  const [offices, setOffices] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      const { data: s } = await supabase.from('profiles').select('*, offices(name, building, room)').in('role', ['lecturer', 'admin']).order('full_name')
      setStaff(s || [])
      const { data: o } = await supabase.from('offices').select('*').order('name')
      setOffices(o || [])
    })()
  }, [])

  const filteredOffices = offices.filter(o => 
    o.name?.toLowerCase().includes(search.toLowerCase()) || 
    o.services?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div>
        <h1 className="text-2xl font-bold">Campus Directory</h1>
        <p className="text-sm text-slate-500">Find offices, services, and staff contacts.</p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input type="text" placeholder="Search for services (e.g. 'Fee Clearance', 'Admissions')..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 outline-none" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredOffices.map(office => {
          const officeStaff = staff.filter(s => s.office_id === office.id)
          return (
            <div key={office.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
              
              {/* Office Images */}
              {office.image_urls && office.image_urls.length > 0 && (
                <div className="flex h-48 overflow-x-auto snap-x">
                  {office.image_urls.map((url, i) => (
                    <img key={i} src={url} alt="Location" className="w-full h-full object-cover shrink-0 snap-center" />
                  ))}
                </div>
              )}

              <div className="bg-brand-600 text-white p-4">
                <h3 className="font-bold text-lg">{office.name}</h3>
                <p className="text-sm text-brand-100 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {office.building}, {office.room}</p>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> {office.operating_hours || 'Hours not set'}</p>
                <p className="text-sm text-slate-600"><strong>Services:</strong> {office.services || 'N/A'}</p>
                {office.description && <p className="text-sm text-slate-500 italic">{office.description}</p>}
                
                <div className="mt-4 pt-4 border-t">
                  <p className="text-xs font-bold text-slate-400 uppercase mb-2">Staff in this office</p>
                  {officeStaff.length > 0 ? officeStaff.map(s => (
                    <div key={s.id} className="flex justify-between items-center py-1">
                      <span className="text-sm font-medium">{s.full_name}</span>
                      <a href={`mailto:${s.email}`} className="text-brand-600 text-xs hover:underline">Contact</a>
                    </div>
                  )) : <p className="text-sm text-slate-500 italic">No staff assigned yet.</p>}
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}