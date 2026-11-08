import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Search, Mail, BookOpen } from 'lucide-react'

export default function DirectoryPage() {
  const [staff, setStaff] = useState([])
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('profiles').select('*').in('role', ['lecturer', 'admin']).order('full_name')
      setStaff(data || [])
    })()
  }, [])

  const filtered = staff.filter(s => 
    s.full_name?.toLowerCase().includes(search.toLowerCase()) || 
    s.department?.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Academic Directory</h1>
        <p className="text-sm text-slate-500">Find contact details for lecturers and administrators.</p>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input type="text" placeholder="Search by name or department..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map(person => (
          <div key={person.id} className="bg-white p-5 rounded-xl border shadow-sm flex items-start gap-4 overflow-hidden">
            <div className="w-12 h-12 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0">
              {person.full_name?.charAt(0) || 'U'}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-bold text-slate-800 truncate">{person.full_name}</h3>
              <span className="inline-block mt-1 px-2 py-0.5 bg-slate-100 rounded text-xs uppercase font-bold text-slate-600">{person.role}</span>
              
              <div className="mt-3 space-y-1 text-sm text-slate-600">
                {person.department && (
                  <p className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-slate-400 shrink-0" /> 
                    <span className="truncate">{person.department}</span>
                  </p>
                )}
                <p className="flex items-center gap-2 min-w-0">
                  <Mail className="w-4 h-4 text-slate-400 shrink-0" /> 
                  <a href={`mailto:${person.email}`} className="text-brand-600 hover:underline truncate block">{person.email}</a>
                </p>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="text-slate-500 col-span-full">No staff members found.</p>}
      </div>
    </div>
  )
}