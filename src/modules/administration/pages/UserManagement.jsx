import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Search, UserPlus } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student', department: '' })
  const [formMsg, setFormMsg] = useState('')

  const loadUsers = async () => {
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
    setUsers(data || [])
    setLoading(false)
  }

  useEffect(() => { loadUsers() }, [])

  const updateStatus = async (id, status) => {
    await supabase.from('profiles').update({ status }).eq('id', id)
    loadUsers()
  }

  const handleCreateUser = async (e) => {
    e.preventDefault()
    setFormMsg('Creating user...')
    
    const { error } = await supabase.rpc('admin_create_user', {
      p_email: form.email, p_password: form.password, p_full_name: form.full_name, p_role: form.role
    })

    if (error) {
      setFormMsg(`Error: ${error.message}`)
    } else {
      if (form.department) {
        // Find the newly created user and update their department
        const { data: newUser } = await supabase.from('profiles').select('id').eq('email', form.email).single()
        if (newUser) await supabase.from('profiles').update({ department: form.department }).eq('id', newUser.id)
      }
      setFormMsg('Account created successfully!')
      setForm({ full_name: '', email: '', password: '', role: 'student', department: '' })
      loadUsers()
      setTimeout(() => { setShowForm(false); setFormMsg('') }, 2000)
    }
  }

  const filtered = users.filter(u => u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2">Create New Account</h2>
          {formMsg && <p className={`text-sm p-2 rounded ${formMsg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{formMsg}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="border p-2 rounded" />
            <select value={form.role} onChange={e => setForm({...form, role: e.target.value})} className="border p-2 rounded">
              <option value="student">Student</option><option value="lecturer">Lecturer</option><option value="worker">Worker</option><option value="admin">Administrator</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border p-2 rounded" />
             <input placeholder="Department (Optional)" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <input required type="password" placeholder="Temporary Password (min 8 chars)" minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border p-2 rounded" />
          
          <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-lg">Create Account</button>
        </form>
      )}

      <div className="bg-white rounded-xl border p-6">
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder="Search users..." className="w-full pl-10 pr-4 py-2 border rounded-lg" onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <p>Loading users...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                  <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Role</th><th className="p-3">Department</th><th className="p-3">Status</th><th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{user.full_name || 'N/A'}</td>
                    <td className="p-3 text-slate-500">{user.email}</td>
                    <td className="p-3 capitalize"><span className="px-2 py-1 bg-slate-100 rounded text-xs">{user.role}</span></td>
                    <td className="p-3 text-sm">{user.department || '-'}</td>
                    <td className="p-3">
                      <span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {user.status || 'active'}
                      </span>
                    </td>
                    <td className="p-3">
                      <select value={user.status || 'active'} onChange={(e) => updateStatus(user.id, e.target.value)} className="border rounded p-1 text-sm">
                        <option value="active">Active</option><option value="suspended">Suspend</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}