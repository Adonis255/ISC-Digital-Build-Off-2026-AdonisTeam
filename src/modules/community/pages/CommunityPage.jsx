import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Flag, Trash2 } from 'lucide-react'

export default function CommunityPage() {
  const { profile, role } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')

  const loadPosts = async () => {
    const { data } = await supabase.from('community_posts').select('*, profiles(full_name, role)').order('created_at', { ascending: false })
    setPosts(data || [])
  }

  useEffect(() => { loadPosts() }, [])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim()) return
    await supabase.from('community_posts').insert([{ author_id: profile.id, body: newPost }])
    setNewPost('')
    loadPosts()
  }

  const reportPost = async (id) => {
    await supabase.from('community_posts').update({ is_reported: true }).eq('id', id)
    alert('Post reported to administration.')
    loadPosts()
  }

  const deletePost = async (id) => {
    if (!window.confirm('Delete this post?')) return
    await supabase.from('community_posts').delete().eq('id', id)
    loadPosts()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campus Community</h1>
        <p className="text-sm text-slate-500">Connect with other students, lecturers, and staff.</p>
      </div>

      <form onSubmit={handlePost} className="bg-white p-4 rounded-xl border shadow-sm">
        <textarea required placeholder="What's happening on campus?" value={newPost} onChange={e => setNewPost(e.target.value)} className="w-full border p-3 rounded-lg resize-none" rows="3"></textarea>
        <div className="flex justify-end mt-3">
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700">Post</button>
        </div>
      </form>

      <div className="space-y-4">
        {posts.map(post => (
          <div key={post.id} className={`bg-white p-5 rounded-xl border shadow-sm ${post.is_reported ? 'border-red-300 bg-red-50/30' : ''}`}>
            <div className="flex justify-between items-start mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold">{post.profiles?.full_name?.charAt(0) || 'U'}</div>
                <div>
                  <p className="font-semibold text-slate-800">{post.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-xs text-slate-500 capitalize">{post.profiles?.role} • {new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {post.is_reported && <span className="text-xs font-bold text-red-600 bg-red-100 px-2 py-1 rounded">Reported</span>}
                {isAdmin ? (
                  <button onClick={() => deletePost(post.id)} className="text-red-500 hover:bg-red-50 p-1 rounded"><Trash2 className="w-4 h-4" /></button>
                ) : (
                  <button onClick={() => reportPost(post.id)} className="text-slate-400 hover:text-red-500 p-1 rounded" title="Report Post"><Flag className="w-4 h-4" /></button>
                )}
              </div>
            </div>
            <p className="text-slate-700 whitespace-pre-wrap">{post.body}</p>
          </div>
        ))}
      </div>
    </div>
  )
}