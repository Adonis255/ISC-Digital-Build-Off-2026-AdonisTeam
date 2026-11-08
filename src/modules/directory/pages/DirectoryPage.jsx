import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Search, Mail, MapPin, Clock } from 'lucide-react'

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
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Campus Directory</h1>
        <p className="text-sm text-slate-500">Find offices, services, and staff contacts.</p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input type="text" placeholder="Search for services (e.g. 'Fee Clearance', 'Admissions')..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm" />
      </div>

      {/* Offices Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredOffices.map(office => {
          const officeStaff = staff.filter(s => s.office_id === office.id)
          return (
            <div key={office.id} className="bg-white rounded-xl border shadow-sm overflow-hidden">
              <div className="bg-brand-600 text-white p-4">
                <h3 className="font-bold text-lg">{office.name}</h3>
                <p className="text-sm text-brand-100 flex items-center gap-1 mt-1"><MapPin className="w-4 h-4" /> {office.building}, {office.room}</p>
              </div>
              <div className="p-4 space-y-3">
                <p className="text-sm text-slate-600 flex items-center gap-2"><Clock className="w-4 h-4 text-slate-400" /> {office.operating_hours || 'Hours not set'}</p>
                <p className="text-sm text-slate-600"><strong>Services:</strong> {office.services || 'N/A'}</p>
                
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

      {/* All Staff Section */}
      <div className="mt-10">
        <h2 className="text-xl font-bold mb-4">All Faculty & Staff</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {staff.map(person => (
            <div key={person.id} className="bg-white p-4 rounded-xl border shadow-sm flex items-start gap-4 overflow-hidden">
              <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold shrink-0">
                {person.full_name?.charAt(0) || 'U'}
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="font-bold text-slate-800 truncate">{person.full_name}</h3>
                <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-[10px] uppercase font-bold text-slate-600">{person.role}</span>
                {person.offices && <p className="text-xs text-slate-500 mt-1">{person.offices.name}</p>}
                <p className="flex items-center gap-1 text-xs text-brand-600 mt-2 truncate">
                  <Mail className="w-3 h-3" /> <a href={`mailto:${person.email}`}>{person.email}</a>
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}