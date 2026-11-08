import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'

export default function CommunityPage() {
  const { profile } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [loading, setLoading] = useState(true)

  const loadPosts = async () => {
    const { data, error } = await supabase
      .from('community_posts')
      .select('*, profiles(full_name, role)')
      .order('created_at', { ascending: false })
    
    if (!error) setPosts(data || [])
    setLoading(false)
  }

  useEffect(() => { loadPosts() }, [])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim()) return
    await supabase.from('community_posts').insert([{ author_id: profile.id, body: newPost }])
    setNewPost('')
    loadPosts()
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Campus Community</h1>
        <p className="text-sm text-slate-500">Connect with other students, lecturers, and staff.</p>
      </div>
      <form onSubmit={handlePost} className="bg-white p-4 rounded-xl border shadow-sm">
        <textarea required placeholder="What's happening on campus?" value={newPost} onChange={e => setNewPost(e.target.value)} className="w-full border p-3 rounded-lg resize-none focus:ring-2 focus:ring-brand-500 outline-none" rows="3"></textarea>
        <div className="flex justify-end mt-3">
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg font-medium hover:bg-brand-700">Post</button>
        </div>
      </form>
      {loading ? <p className="text-center text-slate-500 py-10">Loading feed...</p> : (
        <div className="space-y-4">
          {posts.map(post => (
            <div key={post.id} className="bg-white p-5 rounded-xl border shadow-sm">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-navy-900 text-white flex items-center justify-center font-bold">{post.profiles?.full_name?.charAt(0) || 'U'}</div>
                <div>
                  <p className="font-semibold text-slate-800">{post.profiles?.full_name || 'Unknown User'}</p>
                  <p className="text-xs text-slate-500 capitalize">{post.profiles?.role} • {new Date(post.created_at).toLocaleString()}</p>
                </div>
              </div>
              <p className="text-slate-700 whitespace-pre-wrap">{post.body}</p>
            </div>
          ))}
          {posts.length === 0 && <p className="text-center text-slate-500 py-10">No posts yet. Be the first to say something!</p>}
        </div>
      )}
    </div>
  )
}