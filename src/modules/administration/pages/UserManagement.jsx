import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Search, UserPlus } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [offices, setOffices] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('student')
  
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student', office_id: '' })
  const [formMsg, setFormMsg] = useState('')

  const loadData = async () => {
    const { data: u } = await supabase.from('profiles').select('*, offices(name)').order('created_at', { ascending: false })
    setUsers(u || [])
    const { data: o } = await supabase.from('offices').select('id, name')
    setOffices(o || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const updateStatus = async (id, status) => {
    await supabase.from('profiles').update({ status }).eq('id', id)
    loadData()
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
      if (form.office_id) {
        const { data: newUser } = await supabase.from('profiles').select('id').eq('email', form.email).single()
        if (newUser) await supabase.from('profiles').update({ office_id: form.office_id }).eq('id', newUser.id)
      }
      setFormMsg('Account created successfully!')
      setForm({ full_name: '', email: '', password: '', role: activeTab, office_id: '' })
      loadData()
      setTimeout(() => { setShowForm(false); setFormMsg('') }, 2000)
    }
  }

  const openForm = () => {
    setForm({ full_name: '', email: '', password: '', role: activeTab, office_id: '' })
    setShowForm(true)
  }

  // Filter by Tab and Search
  const filtered = users.filter(u => 
    u.role === activeTab && 
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={openForm} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <UserPlus className="w-4 h-4" /> Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {['student', 'lecturer', 'worker', 'admin'].map(tab => (
          <button 
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-medium capitalize border-b-2 transition ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
          >
            {tab}s
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <h2 className="font-semibold text-lg border-b pb-2 capitalize">Create New {activeTab}</h2>
          {formMsg && <p className={`text-sm p-2 rounded ${formMsg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{formMsg}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="border p-2 rounded" />
            <select disabled value={form.role} className="border p-2 rounded bg-slate-50 cursor-not-allowed capitalize">
              <option value={activeTab}>{activeTab}</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border p-2 rounded" />
             <select value={form.office_id} onChange={e => setForm({...form, office_id: e.target.value})} className="w-full border p-2 rounded">
               <option value="">Assign to Office (Optional)</option>
               {offices.map(o => <option key={o.id} value={o.id}>{o.name}</option>)}
             </select>
          </div>
          <input required type="password" placeholder="Temporary Password (min 8 chars)" minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border p-2 rounded" />
          
          <div className="flex gap-2">
            <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-lg">Create Account</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-slate-200 text-slate-700 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-xl border p-6">
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder={`Search ${activeTab}s...`} className="w-full pl-10 pr-4 py-2 border rounded-lg" onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <p>Loading users...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                  <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Office</th><th className="p-3">Status</th><th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{user.full_name || 'N/A'}</td>
                    <td className="p-3 text-slate-500">{user.email}</td>
                    <td className="p-3 text-sm text-slate-500">{user.offices?.name || '-'}</td>
                    <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status || 'active'}</span></td>
                    <td className="p-3">
                      <select value={user.status || 'active'} onChange={(e) => updateStatus(user.id, e.target.value)} className="border rounded p-1 text-sm">
                        <option value="active">Active</option><option value="suspended">Suspend</option>
                      </select>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && <tr><td colSpan="5" className="p-6 text-center text-slate-500">No {activeTab}s found.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}