import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Users, Plus, X, Trash2, Image as ImageIcon } from 'lucide-react'

export default function GroupsPage() {
  const { profile, role } = useAuth()
  const [groups, setGroups] = useState([])
  const [selectedGroup, setSelectedGroup] = useState(null)
  const [posts, setPosts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [activeTab, setActiveTab] = useState('All')
  
  const [form, setForm] = useState({ name: '', description: '', group_type: 'Study', category: 'Studies', requirements: '' })
  const [imageFile, setImageFile] = useState(null)
  const [postContent, setPostContent] = useState('')
  const [loading, setLoading] = useState(false)

  const CATEGORIES = ['All', 'Mind', 'Religion', 'Health', 'Studies', 'Others']

  const loadGroups = async () => {
    const { data } = await supabase.from('study_groups').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setGroups(data || [])
  }

  useEffect(() => { loadGroups() }, [])

  const loadGroupDetails = async (group) => {
    setSelectedGroup(group)
    const { data } = await supabase.from('group_posts').select('*, profiles(full_name)').eq('group_id', group.id).order('created_at', { ascending: false })
    setPosts(data || [])
  }

  const handleCreateGroup = async (e) => {
    e.preventDefault()
    setLoading(true)
    let imageUrl = null

    if (imageFile) {
      const fileName = `grp-${Math.random()}.${imageFile.name.split('.').pop()}`
      await supabase.storage.from('community-media').upload(fileName, imageFile)
      const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    await supabase.from('study_groups').insert([{ ...form, created_by: profile.id, image_url: imageUrl }])
    setForm({ name: '', description: '', group_type: 'Study', category: 'Studies', requirements: '' })
    setImageFile(null)
    setShowForm(false); setLoading(false); loadGroups()
  }

  const handleDeleteGroup = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Admin: Delete this group permanently?')) return
    await supabase.from('study_groups').delete().eq('id', id)
    loadGroups()
  }

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!postContent.trim()) return
    setLoading(true)
    await supabase.from('group_posts').insert([{ group_id: selectedGroup.id, user_id: profile.id, content: postContent }])
    setPostContent(''); setLoading(false); loadGroupDetails(selectedGroup)
  }

  const filteredGroups = activeTab === 'All' ? groups : groups.filter(g => g.category === activeTab)

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-800">Campus Groups</h1>
        <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 font-medium">
          <Plus className="w-4 h-4" /> Create Group
        </button>
      </div>

      <div className="flex gap-2 border-b border-slate-200 overflow-x-auto pb-px">
        {CATEGORIES.map(cat => (
          <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 font-medium text-sm border-b-2 transition whitespace-nowrap ${activeTab === cat ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'}`}>
            {cat}
          </button>
        ))}
      </div>

      {showForm && (
        <form onSubmit={handleCreateGroup} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <input required placeholder="Group Name" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border p-2 rounded-xl" />
          <select value={form.category} onChange={e => setForm({...form, category: e.target.value})} className="border p-2 rounded-xl w-full">
            {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
          </select>
          <textarea required placeholder="Description..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded-xl" rows="2"></textarea>
          <input placeholder="Requirements (e.g. Must be in CS 101)" value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} className="w-full border p-2 rounded-xl" />
          <div>
            <label className="block text-sm font-medium mb-1">Group Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
          </div>
          <button type="submit" disabled={loading} className="bg-navy-900 text-white px-6 py-2 rounded-xl">Create</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredGroups.map(g => (
          <div key={g.id} onClick={() => loadGroupDetails(g)} className="bg-white rounded-2xl border shadow-sm cursor-pointer hover:shadow-md transition overflow-hidden flex flex-col">
            {g.image_url ? (
              <img src={g.image_url} alt={g.name} className="w-full h-40 object-cover" />
            ) : (
              <div className="w-full h-40 bg-slate-50 flex items-center justify-center"><ImageIcon className="w-8 h-8 text-slate-300" /></div>
            )}
            <div className="p-5 flex-1 flex flex-col relative">
              {role === 'admin' && (
                <button onClick={(e) => handleDeleteGroup(e, g.id)} className="absolute top-4 right-4 bg-red-100 text-red-600 p-2 rounded-lg hover:bg-red-200" title="Admin Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              <h3 className="font-bold text-lg text-slate-800 pr-10">{g.name}</h3>
              <p className="text-sm text-slate-500 line-clamp-2 mt-1 flex-1">{g.description}</p>
              <span className="inline-block mt-4 bg-slate-100 text-slate-600 text-[10px] font-bold px-2 py-1 rounded-full uppercase w-fit">{g.category}</span>
            </div>
          </div>
        ))}
      </div>

      {selectedGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-2xl shadow-xl overflow-hidden flex flex-col h-[80vh]">
             <div className="p-4 border-b flex justify-between bg-slate-50">
               <h2 className="font-bold">{selectedGroup.name} Discussion</h2>
               <button onClick={() => setSelectedGroup(null)}><X className="w-5 h-5" /></button>
             </div>
             <div className="p-4 flex-1 overflow-y-auto space-y-4 bg-slate-100">
               {posts.map(p => (
                 <div key={p.id} className="bg-white p-4 rounded-xl shadow-sm">
                   <p className="font-bold text-xs mb-1">{p.profiles?.full_name}</p>
                   <p className="text-sm">{p.content}</p>
                 </div>
               ))}
             </div>
             <div className="p-4 border-t bg-white">
               <form onSubmit={handleCreatePost} className="flex gap-2">
                 <input required placeholder="Message group..." value={postContent} onChange={e => setPostContent(e.target.value)} className="flex-1 border rounded-xl px-3 py-2 text-sm" />
                 <button type="submit" className="bg-brand-600 text-white px-4 rounded-xl">Send</button>
               </form>
             </div>
          </div>
        </div>
      )}
    </div>
  )
}