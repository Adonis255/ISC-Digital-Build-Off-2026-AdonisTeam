import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Shield } from 'lucide-react'

export default function DepartmentPermissions() {
  const [departments, setDepartments] = useState([])
  const [selectedDept, setSelectedDept] = useState('')
  const [permissions, setPermissions] = useState([])
  const MODULES = ['Finance', 'Maintenance', 'Lost & Found', 'Counselling']

  const loadData = async () => {
    const { data: d } = await supabase.from('departments').select('*')
    setDepartments(d || [])
    if (d?.length > 0 && !selectedDept) setSelectedDept(d[0].id)
  }

  const loadPermissions = async () => {
    if (!selectedDept) return
    const { data } = await supabase.from('department_permissions').select('*').eq('department_id', selectedDept)
    
    // Ensure all modules have a record
    const formatted = MODULES.map(m => {
      const existing = data?.find(p => p.module === m)
      return existing || { department_id: selectedDept, module: m, can_view: false, can_edit: false }
    })
    setPermissions(formatted)
  }

  useEffect(() => { loadData() }, [])
  useEffect(() => { loadPermissions() }, [selectedDept])

  const togglePermission = async (module, field) => {
    const perm = permissions.find(p => p.module === module)
    const newVal = !perm[field]
    
    // Update local state
    setPermissions(prev => prev.map(p => p.module === module ? { ...p, [field]: newVal } : p))
    
    // Upsert to DB
    await supabase.from('department_permissions').upsert({ 
      department_id: selectedDept, 
      module, 
      [field]: newVal 
    }, { onConflict: 'department_id, module' })
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center"><Shield className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Department Permissions</h1>
          <p className="text-sm text-slate-500">Configure what each department can view and edit.</p>
        </div>
      </div>

      <div className="bg-white rounded-xl border p-6">
        <select value={selectedDept} onChange={e => setSelectedDept(e.target.value)} className="border p-2 rounded-lg mb-6 w-full max-w-xs">
          {departments.map(d => <option key={d.id} value={d.id}>{d.name} Department</option>)}
        </select>

        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b">
            <tr><th className="p-3">Module</th><th className="p-3 text-center">Can View</th><th className="p-3 text-center">Can Edit</th></tr>
          </thead>
          <tbody>
            {permissions.map(p => (
              <tr key={p.module} className="border-b">
                <td className="p-3 font-medium">{p.module}</td>
                <td className="p-3 text-center">
                  <input type="checkbox" checked={p.can_view} onChange={() => togglePermission(p.module, 'can_view')} className="w-5 h-5 cursor-pointer accent-brand-600" />
                </td>
                <td className="p-3 text-center">
                  <input type="checkbox" checked={p.can_edit} onChange={() => togglePermission(p.module, 'can_edit')} className="w-5 h-5 cursor-pointer accent-brand-600" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}