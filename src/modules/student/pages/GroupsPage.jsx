import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Users, Plus, LogOut } from 'lucide-react'

export default function GroupsPage() {
  const { profile } = useAuth()
  const [groups, setGroups] = useState([])
  const [myGroups, setMyGroups] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', description: '' })

  const loadData = async () => {
    const { data: g } = await supabase.from('study_groups').select('*, profiles(full_name), group_members(count)').order('created_at', { ascending: false })
    setGroups(g || [])
    
    const { data: myG } = await supabase.from('group_members').select('group_id').eq('user_id', profile.id)
    setMyGroups(myG?.map(x => x.group_id) || [])
  }

  useEffect(() => { if (profile) loadData() }, [profile])

  const handleCreate = async (e) => {
    e.preventDefault()
    const { data } = await supabase.from('study_groups').insert([{ ...form, created_by: profile.id }]).select()
    if (data && data[0]) {
      // Automatically join the group you created
      await supabase.from('group_members').insert([{ group_id: data[0].id, user_id: profile.id }])
    }
    setForm({ name: '', description: '' })
    setShowForm(false)
    loadData()
  }

  const toggleJoin = async (groupId, isJoined) => {
    if (isJoined) {
      await supabase.from('group_members').delete().eq('group_id', groupId).eq('user_id', profile.id)
    } else {
      await supabase.from('group_members').insert([{ group_id: groupId, user_id: profile.id }])
    }
    loadData()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Study Groups</h1>
          <p className="text-sm text-slate-500">Join or create groups for collaborative learning.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Create Group'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Group Name (e.g. CS 101 Study Group)" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="What is this group about?" value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="2"></textarea>
          <button type="submit" className="bg-brand-600 text-white px-4 py-2 rounded-lg">Create</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {groups.map(g => {
          const isJoined = myGroups.includes(g.id)
          const memberCount = g.group_members?.[0]?.count || 0
          return (
            <div key={g.id} className="bg-white p-5 rounded-xl border shadow-sm flex flex-col">
              <h3 className="font-bold text-lg text-slate-800 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600" /> {g.name}</h3>
              <p className="text-slate-600 text-sm mt-2 flex-1">{g.description}</p>
              <div className="mt-4 pt-3 border-t flex justify-between items-center">
                <span className="text-xs text-slate-500">{memberCount} members</span>
                <button 
                  onClick={() => toggleJoin(g.id, isJoined)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition ${isJoined ? 'bg-slate-100 text-slate-600 hover:bg-red-50 hover:text-red-600' : 'bg-brand-600 text-white hover:bg-brand-700'}`}
                >
                  {isJoined ? 'Leave Group' : 'Join Group'}
                </button>
              </div>
            </div>
          )
        })}
        {groups.length === 0 && <p className="text-slate-500">No study groups yet. Create the first one!</p>}
      </div>
    </div>
  )
}