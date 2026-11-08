import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Image as ImageIcon, Heart, MessageSquare, Send, Flag, ChevronDown, ChevronUp } from 'lucide-react'

export default function CommunityPage() {
  const { profile, role } = useAuth()
  const [posts, setPosts] = useState([])
  const [newPost, setNewPost] = useState('')
  const [file, setFile] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const [likes, setLikes] = useState([])
  const [comments, setComments] = useState({})
  const [commentText, setCommentText] = useState({})
  const [expandedPosts, setExpandedPosts] = useState({})

  const loadData = async () => {
    // ONLY load 'community' posts
    const { data } = await supabase.from('community_posts').select('*, profiles(full_name, avatar_url)').eq('post_type', 'community').order('created_at', { ascending: false })
    setPosts(data || [])
    
    const { data: l } = await supabase.from('post_likes').select('*')
    setLikes(l || [])

    const { data: c } = await supabase.from('post_comments').select('*, profiles(full_name)').order('created_at', { ascending: true })
    const grouped = {}
    c?.forEach(comment => {
      if (!grouped[comment.post_id]) grouped[comment.post_id] = []
      grouped[comment.post_id].push(comment)
    })
    setComments(grouped)
  }

  useEffect(() => { loadData() }, [])

  const handlePost = async (e) => {
    e.preventDefault()
    if (!newPost.trim() && !file) return
    setLoading(true)
    
    let mediaUrl = null; let mediaType = null
    if (file) {
      mediaType = file.type.startsWith('video') ? 'video' : 'image'
      const fileName = `post-${Math.random()}.${file.name.split('.').pop()}`
      await supabase.storage.from('community-media').upload(fileName, file)
      const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
      mediaUrl = data.publicUrl
    }

    await supabase.from('community_posts').insert([{ 
      author_id: profile.id, 
      body: newPost, 
      media_url: mediaUrl, 
      media_type: mediaType,
      post_type: 'community' // Explicitly set as community
    }])
    
    setNewPost(''); setFile(null); setLoading(false); loadData()
  }

  const toggleLike = async (postId) => {
    const existing = likes.find(l => l.post_id === postId && l.user_id === profile.id)
    if (existing) await supabase.from('post_likes').delete().eq('id', existing.id)
    else await supabase.from('post_likes').insert([{ post_id: postId, user_id: profile.id }])
    loadData()
  }

  const handleComment = async (postId) => {
    const text = commentText[postId]
    if (!text) return
    await supabase.from('post_comments').insert([{ post_id: postId, user_id: profile.id, content: text }])
    setCommentText({ ...commentText, [postId]: '' })
    loadData()
  }

  const toggleExpandComments = (postId) => {
    setExpandedPosts(prev => ({ ...prev, [postId]: !prev[postId] }))
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-10">
      <h1 className="text-2xl font-bold text-slate-800">Campus Community</h1>

      <div className="bg-white p-5 rounded-2xl border shadow-sm">
        <form onSubmit={handlePost}>
          <div className="flex gap-4 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold shrink-0">{profile?.full_name?.charAt(0)}</div>
            <textarea required value={newPost} onChange={e => setNewPost(e.target.value)} placeholder="What's happening on campus?" className="flex-1 bg-slate-50 border border-slate-200 p-3 rounded-xl resize-none focus:ring-2 focus:ring-brand-500 outline-none" rows="3"></textarea>
          </div>
          <div className="flex justify-between items-center pt-3 border-t">
            <label className="cursor-pointer text-slate-500 hover:text-brand-600 flex items-center gap-2 text-sm font-medium transition">
              <ImageIcon className="w-5 h-5 text-green-500" /> {file ? file.name : 'Photo/Video'}
              <input type="file" accept="image/*,video/*" onChange={e => setFile(e.target.files[0])} className="hidden" />
            </label>
            <button type="submit" disabled={loading} className="bg-brand-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-brand-700 transition disabled:opacity-50">Post</button>
          </div>
        </form>
      </div>

      {posts.map(post => {
        const postLikes = likes.filter(l => l.post_id === post.id).length
        const isLiked = likes.some(l => l.post_id === post.id && l.user_id === profile.id)
        const postComments = comments[post.id] || []
        
        const isExpanded = expandedPosts[post.id]
        const visibleComments = isExpanded ? postComments : postComments.slice(0, 2)
        const hasMoreComments = postComments.length > 2

        return (
          <div key={post.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden">
            <div className="p-5">
              <div className="flex justify-between items-start mb-4">
                <div className="flex gap-3">
                  <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">{post.profiles?.full_name?.charAt(0)}</div>
                  <div>
                    <p className="font-bold text-slate-800">{post.profiles?.full_name}</p>
                    <p className="text-xs text-slate-500">{new Date(post.created_at).toLocaleString()}</p>
                  </div>
                </div>
                <button className="text-slate-400 hover:text-red-500 transition"><Flag className="w-4 h-4" /></button>
              </div>
              <p className="text-slate-800 whitespace-pre-wrap">{post.body}</p>
            </div>

            {post.media_url && (
              <div className="bg-slate-100 border-y">
                {post.media_type === 'video' ? (
                  <video src={post.media_url} controls className="w-full max-h-[500px] object-contain" />
                ) : (
                  <img src={post.media_url} alt="Post" className="w-full max-h-[500px] object-contain" />
                )}
              </div>
            )}

            <div className="p-4">
              <div className="flex items-center justify-between text-sm text-slate-500 mb-3 border-b pb-3">
                <span>{postLikes} Likes</span>
                <span>{postComments.length} Comments</span>
              </div>
              <div className="flex gap-2 mb-4">
                <button onClick={() => toggleLike(post.id)} className={`flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 transition ${isLiked ? 'text-red-500 bg-red-50' : 'text-slate-600 hover:bg-slate-100'}`}>
                  <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} /> Like
                </button>
                <button className="flex-1 py-2 rounded-lg font-medium flex items-center justify-center gap-2 text-slate-600 hover:bg-slate-100 transition">
                  <MessageSquare className="w-5 h-5" /> Comment
                </button>
              </div>

              <div className="space-y-3 mb-3">
                {visibleComments.map(c => (
                  <div key={c.id} className="flex gap-2 text-sm">
                    <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 font-bold text-slate-600">{c.profiles?.full_name?.charAt(0)}</div>
                    <div className="bg-slate-100 p-2.5 rounded-xl rounded-tl-none flex-1">
                      <p className="font-bold text-slate-800 text-xs mb-0.5">{c.profiles?.full_name}</p>
                      <p className="text-slate-700">{c.content}</p>
                    </div>
                  </div>
                ))}

                {hasMoreComments && (
                  <button onClick={() => toggleExpandComments(post.id)} className="flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-brand-600 transition mt-2">
                    {isExpanded ? (
                      <><ChevronUp className="w-4 h-4" /> Show less</>
                    ) : (
                      <><ChevronDown className="w-4 h-4" /> View all {postComments.length} comments</>
                    )}
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <input type="text" placeholder="Write a comment..." value={commentText[post.id] || ''} onChange={e => setCommentText({...commentText, [post.id]: e.target.value})} className="flex-1 bg-slate-100 border-none rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                <button onClick={() => handleComment(post.id)} className="bg-brand-100 text-brand-600 p-2 rounded-xl hover:bg-brand-200 transition"><Send className="w-5 h-5" /></button>
              </div>
            </div>
          </div>
        )
      })}
    </div>
  )
}