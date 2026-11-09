import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Search, UserPlus, BookOpen, X, Check } from 'lucide-react'

export default function UserManagement() {
  const [users, setUsers] = useState([])
  const [departments, setDepartments] = useState([])
  const [allCourses, setAllCourses] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('student')
  
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ full_name: '', email: '', password: '', role: 'student', department_id: '' })
  const [formMsg, setFormMsg] = useState('')

  // Class Assignment State
  const [assigningLecturer, setAssigningLecturer] = useState(null)

  const loadData = async () => {
    const { data: u } = await supabase.from('profiles').select('*, departments(name)').order('created_at', { ascending: false })
    setUsers(u || [])
    
    const { data: d } = await supabase.from('departments').select('id, name')
    setDepartments(d || [])
    
    const { data: c } = await supabase.from('courses').select('id, code, title, lecturer_id')
    setAllCourses(c || [])
    
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
      if (form.department_id) {
        const { data: newUser } = await supabase.from('profiles').select('id').eq('email', form.email).single()
        if (newUser) await supabase.from('profiles').update({ department_id: form.department_id }).eq('id', newUser.id)
      }
      
      setFormMsg('Account created successfully!')
      setForm({ full_name: '', email: '', password: '', role: activeTab, department_id: '' })
      loadData()
      setTimeout(() => { setShowForm(false); setFormMsg('') }, 2000)
    }
  }

  const openForm = () => {
    setForm({ full_name: '', email: '', password: '', role: activeTab, department_id: '' })
    setShowForm(true)
  }

  // Toggle Course Assignment
  const toggleCourse = async (courseId, isAssigned) => {
    if (isAssigned) {
      await supabase.from('courses').update({ lecturer_id: null }).eq('id', courseId)
    } else {
      await supabase.from('courses').update({ lecturer_id: assigningLecturer.id }).eq('id', courseId)
    }
    // Refresh courses in background
    const { data: c } = await supabase.from('courses').select('id, code, title, lecturer_id')
    setAllCourses(c || [])
  }

  const filtered = users.filter(u => 
    u.role === activeTab && 
    (u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase()))
  )

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">User Management</h1>
        <button onClick={openForm} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:bg-brand-700 transition">
          <UserPlus className="w-4 h-4" /> Create {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto">
        {['student', 'lecturer', 'worker', 'admin'].map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)} className={`px-4 py-2 font-bold capitalize border-b-2 transition ${activeTab === tab ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>
            {tab}s
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleCreateUser} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <h2 className="font-bold text-lg border-b pb-2 capitalize">Create New {activeTab}</h2>
          {formMsg && <p className={`text-sm p-2 rounded-lg ${formMsg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{formMsg}</p>}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Full Name" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} className="border p-3 rounded-xl" />
            <select disabled value={form.role} className="border p-3 rounded-xl bg-slate-50 cursor-not-allowed capitalize">
              <option value={activeTab}>{activeTab}</option>
            </select>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             <input required type="email" placeholder="Email Address" value={form.email} onChange={e => setForm({...form, email: e.target.value})} className="w-full border p-3 rounded-xl" />
             <select value={form.department_id} onChange={e => setForm({...form, department_id: e.target.value})} className="w-full border p-3 rounded-xl text-slate-600">
               <option value="">Assign to Department (Optional)</option>
               {departments.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
             </select>
          </div>
          
          <input required type="password" placeholder="Temporary Password (min 8 chars)" minLength={8} value={form.password} onChange={e => setForm({...form, password: e.target.value})} className="w-full border p-3 rounded-xl" />
          
          <div className="flex gap-2">
            <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-xl">Create Account</button>
            <button type="button" onClick={() => setShowForm(false)} className="bg-slate-200 text-slate-700 px-6 py-2 rounded-xl">Cancel</button>
          </div>
        </form>
      )}

      <div className="bg-white rounded-2xl border p-6 shadow-sm">
        <div className="relative mb-6">
          <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder={`Search ${activeTab}s...`} className="w-full pl-10 pr-4 py-2 border rounded-xl" onChange={e => setSearch(e.target.value)} />
        </div>

        {loading ? <p className="text-center py-4">Loading users...</p> : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 text-sm border-b">
                  <th className="p-3">Name</th><th className="p-3">Email</th><th className="p-3">Department</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(user => (
                  <tr key={user.id} className="border-b hover:bg-slate-50">
                    <td className="p-3 font-medium">{user.full_name || 'N/A'}</td>
                    <td className="p-3 text-slate-500">{user.email}</td>
                    <td className="p-3 text-sm">
                      {user.departments?.name ? (
                        <span className="bg-purple-50 text-purple-700 px-2 py-1 rounded-md text-xs font-bold">{user.departments.name}</span>
                      ) : '-'}
                    </td>
                    <td className="p-3"><span className={`px-2 py-1 rounded-md text-xs font-bold ${user.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{user.status || 'active'}</span></td>
                    <td className="p-3 flex items-center justify-end gap-3">
                      
                      {/* NEW: Manage Classes Button for Lecturers */}
                      {user.role === 'lecturer' && (
                        <button onClick={() => setAssigningLecturer(user)} className="text-brand-600 hover:bg-brand-50 p-2 rounded-lg text-xs font-bold flex items-center gap-1 border border-brand-200">
                          <BookOpen className="w-3 h-3" /> Manage Classes
                        </button>
                      )}

                      <select value={user.status || 'active'} onChange={(e) => updateStatus(user.id, e.target.value)} className="border rounded-lg p-1 text-sm">
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

      {/* ASSIGN CLASSES MODAL */}
      {assigningLecturer && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <div>
                <h2 className="text-xl font-bold text-slate-800">Assign Classes</h2>
                <p className="text-sm text-slate-500">Select the courses taught by <strong>{assigningLecturer.full_name}</strong></p>
              </div>
              <button onClick={() => setAssigningLecturer(null)} className="p-2 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-2 flex-1 bg-slate-50">
              {allCourses.map(course => {
                const isAssigned = course.lecturer_id === assigningLecturer.id;
                // Disable if assigned to another lecturer
                const isAssignedToOther = course.lecturer_id && course.lecturer_id !== assigningLecturer.id;
                
                return (
                  <div 
                    key={course.id} 
                    onClick={() => !isAssignedToOther && toggleCourse(course.id, isAssigned)}
                    className={`flex items-center justify-between p-4 rounded-xl border transition cursor-pointer ${isAssigned ? 'bg-brand-50 border-brand-300' : isAssignedToOther ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed' : 'bg-white border-slate-200 hover:border-brand-300'}`}
                  >
                    <div>
                      <p className="font-bold text-slate-800">{course.code}</p>
                      <p className="text-sm text-slate-500">{course.title}</p>
                    </div>
                    <div>
                      {isAssigned ? (
                        <span className="w-6 h-6 rounded-full bg-brand-600 text-white flex items-center justify-center"><Check className="w-4 h-4" /></span>
                      ) : isAssignedToOther ? (
                        <span className="text-xs font-bold text-slate-400">Assigned to another lecturer</span>
                      ) : (
                        <span className="w-6 h-6 rounded-full border-2 border-slate-300"></span>
                      )}
                    </div>
                  </div>
                )
              })}
              
              {allCourses.length === 0 && <p className="text-center text-slate-500 py-10">No courses exist yet. Create courses in Academic Mgmt first.</p>}
            </div>
            
            <div className="p-4 border-t bg-white flex justify-end">
              <button onClick={() => setAssigningLecturer(null)} className="bg-navy-900 text-white px-6 py-2 rounded-xl">Done</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}