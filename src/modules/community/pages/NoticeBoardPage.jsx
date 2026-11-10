import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Megaphone, Plus, TrendingUp, Search, Heart, MessageSquare, Bookmark, X, Flag, CheckCircle, Clock, AlertTriangle } from 'lucide-react'

const CATEGORIES = ['All', 'Announcements', 'Events', 'Academic', 'General', 'Student Life', 'Jobs & Opportunities']

export default function NoticeBoardPage() {
  const { profile, role } = useAuth()
  const [posts, setPosts] = useState([])
  const [likes, setLikes] = useState([])
  const [bookmarks, setBookmarks] = useState([])
  const [comments, setComments] = useState({})
  const [loading, setLoading] = useState(true)
  
  const [activeTab, setActiveTab] = useState('All')
  const [noticeFilter, setNoticeFilter] = useState('current')
  const [searchQuery, setSearchQuery] = useState('')
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [expandedComments, setExpandedComments] = useState({})
  const [commentText, setCommentText] = useState({})
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')

  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'General', urgency: 'Normal', expiry_date: '' })
  const [imageFile, setImageFile] = useState(null)
  const [posting, setPosting] = useState(false)

  const loadData = async () => {
    setLoading(true)
    // Fetch Banner
    const { data: settings } = await supabase.from('system_settings').select('banner_url').eq('id', 1).maybeSingle()
    if (settings?.banner_url) setBannerUrl(settings.banner_url)

    const { data: p } = await supabase.from('community_posts').select('*, profiles(full_name, role, avatar_url)').eq('post_type', 'notice').order('created_at', { ascending: false })
    setPosts(p || [])
    
    const { data: l } = await supabase.from('post_likes').select('*')
    setLikes(l || [])
    const { data: b } = await supabase.from('post_bookmarks').select('*')
    setBookmarks(b || [])

    const { data: c } = await supabase.from('post_comments').select('*, profiles(full_name, avatar_url)').order('created_at', { ascending: true })
    const grouped = {}
    c?.forEach(comment => {
      if (!grouped[comment.post_id]) grouped[comment.post_id] = []
      grouped[comment.post_id].push(comment)
    })
    setComments(grouped)
    setLoading(false)
  }

  useEffect(() => { loadData() }, [])

  const handleCreatePost = async (e) => {
    e.preventDefault()
    if (!profile?.id) return
    setPosting(true)
    
    let mediaUrl = null; let mediaType = null
    if (imageFile) {
      mediaType = imageFile.type.startsWith('video') ? 'video' : 'image'
      const fileName = `notice-${Math.random()}.${imageFile.name.split('.').pop()}`
      await supabase.storage.from('community-media').upload(fileName, imageFile)
      const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
      mediaUrl = data.publicUrl
    }

    await supabase.from('community_posts').insert([{ 
      author_id: profile.id, 
      title: newPost.title,
      body: newPost.content, 
      category: newPost.category,
      urgency: newPost.urgency,
      expiry_date: newPost.expiry_date || null,
      media_url: mediaUrl, 
      media_type: mediaType,
      post_type: 'notice'
    }])
    
    setNewPost({ title: '', content: '', category: 'General', urgency: 'Normal', expiry_date: '' })
    setImageFile(null)
    setShowCreateModal(false)
    setPosting(false)
    loadData()
  }

  const toggleLike = async (postId) => {
    const existing = likes.find(l => l.post_id === postId && l.user_id === profile.id)
    if (existing) await supabase.from('post_likes').delete().eq('id', existing.id)
    else await supabase.from('post_likes').insert([{ post_id: postId, user_id: profile.id }])
    loadData()
  }

  const toggleBookmark = async (postId) => {
    const existing = bookmarks.find(b => b.post_id === postId && b.user_id === profile.id)
    if (existing) await supabase.from('post_bookmarks').delete().eq('id', existing.id)
    else await supabase.from('post_bookmarks').insert([{ post_id: postId, user_id: profile.id }])
    loadData()
  }

  const handleComment = async (postId) => {
    const text = commentText[postId]
    if (!text) return
    await supabase.from('post_comments').insert([{ post_id: postId, user_id: profile.id, content: text }])
    setCommentText({ ...commentText, [postId]: '' })
    loadData()
  }

  const deletePost = async (postId) => {
    if (!window.confirm("Are you sure you want to delete this post?")) return
    await supabase.from('community_posts').delete().eq('id', postId)
    loadData()
  }

  const reportPost = async (postId) => {
    const reason = prompt("Reason for reporting this post:")
    if (!reason) return
    await supabase.from('post_reports').insert([{ post_id: postId, reporter_id: profile.id, reason }])
    alert("Post reported to administration.")
  }

  const today = new Date().toISOString().split('T')[0]
  
  const filteredPosts = posts.filter(p => {
    const matchesTab = activeTab === 'All' || p.category === activeTab
    const matchesSearch = p.title?.toLowerCase().includes(searchQuery.toLowerCase()) || p.body?.toLowerCase().includes(searchQuery.toLowerCase())
    const isPast = p.expiry_date && p.expiry_date < today
    const matchesFilter = noticeFilter === 'past' ? isPast : !isPast
    return matchesTab && matchesSearch && matchesFilter
  })

  const trendingPosts = [...posts].filter(p => {
    const isPast = p.expiry_date && p.expiry_date < today
    return !isPast
  }).sort((a, b) => {
    const aLikes = likes.filter(l => l.post_id === a.id).length
    const bLikes = likes.filter(l => l.post_id === b.id).length
    return bLikes - aLikes
  }).slice(0, 3)

  const getUrgencyColor = (urgency) => {
    switch(urgency) {
      case 'Urgent': return 'bg-red-100 text-red-700 border-red-200'
      case 'High': return 'bg-orange-100 text-orange-700 border-orange-200'
      case 'Low': return 'bg-green-100 text-green-700 border-green-200'
      default: return 'bg-blue-100 text-blue-700 border-blue-200'
    }
  }

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-10">
      
      {/* BANNER */}
      <div className="relative bg-[#1a0b2e] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img src={bannerUrl} alt="Campus Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a0b2e]/70"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2 flex items-center gap-3">
            <Megaphone className="w-10 h-10 text-purple-300" /> Notice Board
          </h1>
          <p className="text-purple-200 text-lg max-w-xl">Share announcements, updates and important information with the UEAB community.</p>
        </div>
        <button onClick={() => setShowCreateModal(true)} className="relative z-10 mt-6 md:mt-0 bg-white text-brand-700 px-6 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-slate-50 transition shadow-lg shrink-0">
          <Plus className="w-5 h-5" /> Post a Notice
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <div className="flex flex-wrap gap-4 justify-between items-center">
            <div className="flex gap-2 bg-white p-1.5 rounded-xl border border-slate-200">
              <button onClick={() => setNoticeFilter('current')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${noticeFilter === 'current' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Current</button>
              <button onClick={() => setNoticeFilter('past')} className={`px-6 py-2 rounded-lg text-sm font-bold transition ${noticeFilter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Past</button>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search notices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)} className={`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition ${activeTab === cat ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}`}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? <p className="text-center py-10 text-slate-500">Loading feed...</p> : filteredPosts.map(post => {
            const isLiked = likes.some(l => l.post_id === post.id && l.user_id === profile.id)
            const isBookmarked = bookmarks.some(b => b.post_id === post.id && b.user_id === profile.id)
            const postLikes = likes.filter(l => l.post_id === post.id).length
            const postComments = comments[post.id] || []
            const isExpanded = expandedComments[post.id]
            const isPast = post.expiry_date && post.expiry_date < today
            
            return (
              <div key={post.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col ${isPast ? 'opacity-70 border-slate-300' : 'border-slate-200'}`}>
                <div className="p-5 flex justify-between items-start gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-700 flex items-center justify-center font-bold text-lg shrink-0">
                      {post.profiles?.avatar_url ? <img src={post.profiles.avatar_url} className="w-full h-full rounded-full object-cover" /> : post.profiles?.full_name?.charAt(0)}
                    </div>
                    <div className="min-w-0">
                      <p className="font-bold text-slate-800 flex items-center gap-1 truncate">
                        {post.profiles?.full_name}
                        {post.profiles?.role === 'admin' && <CheckCircle className="w-4 h-4 text-blue-500 fill-blue-100 shrink-0" title="Verified Admin" />}
                      </p>
                      <p className="text-xs text-slate-500 flex items-center gap-2 truncate">
                        <span className="capitalize">{post.profiles?.role}</span>
                        <span>•</span>
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3 shrink-0" /> {new Date(post.created_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {post.category && <span className="bg-purple-100 text-purple-700 text-[10px] font-bold px-2 py-1 rounded-md uppercase hidden sm:block">{post.category}</span>}
                    <button onClick={() => reportPost(post.id)} className="text-slate-400 hover:text-red-500 p-1"><Flag className="w-4 h-4" /></button>
                    {(post.author_id === profile.id || role === 'admin') && (
                      <button onClick={() => deletePost(post.id)} className="text-slate-400 hover:text-red-500 p-1"><X className="w-4 h-4" /></button>
                    )}
                  </div>
                </div>

                <div className="px-5 pb-4">
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    <h2 className="text-xl font-bold text-slate-900 leading-tight">{post.title || 'Untitled Notice'}</h2>
                    {post.urgency && post.urgency !== 'Normal' && (
                      <span className={`border px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 ${getUrgencyColor(post.urgency)}`}>
                        <AlertTriangle className="w-3 h-3" /> {post.urgency}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{post.body}</p>

                  {post.expiry_date && (
                    <div className={`mt-3 inline-block text-xs font-bold p-2 rounded-lg border ${isPast ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}`}>
                      {isPast ? 'Expired on:' : 'Valid until:'} {new Date(post.expiry_date).toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' })}
                    </div>
                  )}
                </div>

                {post.media_url && (
                  <div className="border-y border-slate-100 bg-slate-50">
                    {post.media_type === 'video' ? (
                      <video src={post.media_url} controls className="w-full max-h-[400px] object-contain" />
                    ) : (
                      <img src={post.media_url} alt="Post" className="w-full max-h-[400px] object-contain bg-black/5" />
                    )}
                  </div>
                )}

                <div className="p-4 flex items-center justify-between text-sm font-medium text-slate-500 bg-slate-50/50">
                  <div className="flex items-center gap-4">
                    <button onClick={() => toggleLike(post.id)} className={`flex items-center gap-2 transition ${isLiked ? 'text-red-500' : 'hover:text-brand-600'}`}>
                      <Heart className={`w-5 h-5 ${isLiked ? 'fill-current' : ''}`} /> {postLikes > 0 ? postLikes : 'Like'}
                    </button>
                    <button onClick={() => setExpandedComments({...expandedComments, [post.id]: !isExpanded})} className="flex items-center gap-2 hover:text-brand-600 transition">
                      <MessageSquare className="w-5 h-5" /> {postComments.length} Comments
                    </button>
                  </div>
                  <button onClick={() => toggleBookmark(post.id)} className={`flex items-center gap-2 transition ${isBookmarked ? 'text-brand-600' : 'hover:text-brand-600'}`}>
                    <Bookmark className={`w-5 h-5 ${isBookmarked ? 'fill-current' : ''}`} /> Save
                  </button>
                </div>

                {isExpanded && (
                  <div className="p-5 border-t border-slate-100 space-y-3 bg-white">
                    {postComments.map(c => (
                      <div key={c.id} className="flex gap-2 text-sm">
                        <div className="w-8 h-8 rounded-full bg-slate-200 flex items-center justify-center shrink-0 font-bold text-slate-600 text-xs">{c.profiles?.full_name?.charAt(0)}</div>
                        <div className="bg-slate-50 p-2.5 rounded-xl rounded-tl-none flex-1 border border-slate-100">
                          <p className="font-bold text-slate-800 text-xs mb-1">{c.profiles?.full_name}</p>
                          <p className="text-slate-700">{c.content}</p>
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-2 mt-2">
                      <input type="text" placeholder="Write a comment..." value={commentText[post.id] || ''} onChange={e => setCommentText({...commentText, [post.id]: e.target.value})} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
                      <button onClick={() => handleComment(post.id)} className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm font-bold hover:bg-brand-700 transition">Post</button>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
          {filteredPosts.length === 0 && !loading && (
             <div className="bg-white rounded-2xl border border-dashed p-10 text-center text-slate-500">No {noticeFilter} notices found.</div>
          )}
        </div>

        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5">
            <h3 className="font-bold text-slate-800 flex items-center gap-2 mb-4"><TrendingUp className="w-5 h-5 text-orange-500" /> Trending Notices</h3>
            <div className="space-y-4">
              {trendingPosts.map(post => (
                <div key={post.id} className="flex gap-3 cursor-pointer group">
                  {post.media_url ? (
                    <img src={post.media_url} className="w-14 h-14 rounded-lg object-cover shrink-0 border" />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-lg flex items-center justify-center shrink-0 border"><Megaphone className="w-5 h-5 text-slate-300" /></div>
                  )}
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-slate-800 leading-tight group-hover:text-brand-600 transition line-clamp-2">{post.title || 'Untitled Notice'}</p>
                    <p className="text-xs text-slate-500 mt-1 flex items-center gap-2">
                      <Heart className="w-3 h-3" /> {likes.filter(l => l.post_id === post.id).length} • 
                      <MessageSquare className="w-3 h-3" /> {comments[post.id]?.length || 0}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-gradient-to-br from-brand-600 to-brand-800 rounded-2xl p-6 text-white shadow-lg text-center">
            <h3 className="font-bold text-lg mb-2">Have something to share?</h3>
            <p className="text-sm text-brand-100 mb-4">Post a notice and reach the UEAB community!</p>
            <button onClick={() => setShowCreateModal(true)} className="bg-white text-brand-700 px-6 py-2 rounded-xl font-bold w-full hover:bg-slate-50 transition">Create Post</button>
          </div>
        </div>
      </div>

      {showCreateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleCreatePost} className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="p-5 border-b flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">Create Notice</h2>
              <button type="button" onClick={() => setShowCreateModal(false)} className="p-1 hover:bg-slate-200 rounded-full"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-6 overflow-y-auto space-y-4">
              <div>
                <label className="block text-sm font-bold mb-1">Notice Title</label>
                <input required placeholder="e.g. University Closure Notice" value={newPost.title} onChange={e => setNewPost({...newPost, title: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold mb-1">Category</label>
                  <select value={newPost.category} onChange={e => setNewPost({...newPost, category: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                    {CATEGORIES.filter(c => c !== 'All').map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold mb-1">Urgency Level</label>
                  <select value={newPost.urgency} onChange={e => setNewPost({...newPost, urgency: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none">
                    <option value="Low">Low</option>
                    <option value="Normal">Normal</option>
                    <option value="High">High</option>
                    <option value="Urgent">Urgent</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Expiry Date (Optional - determines Past vs Present)</label>
                <input type="date" value={newPost.expiry_date} onChange={e => setNewPost({...newPost, expiry_date: e.target.value})} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none" />
              </div>

              <div>
                <label className="block text-sm font-bold mb-1">Message</label>
                <textarea required placeholder="Share the details here..." value={newPost.content} onChange={e => setNewPost({...newPost, content: e.target.value})} rows="4" className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none"></textarea>
              </div>
              <div>
                <label className="block text-sm font-bold mb-1">Attach Image/Video (Optional)</label>
                <input type="file" accept="image/*,video/*" onChange={e => setImageFile(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
              </div>
            </div>
            <div className="p-5 border-t bg-slate-50 flex justify-end gap-3">
              <button type="button" onClick={() => setShowCreateModal(false)} className="px-6 py-2 rounded-xl font-bold text-slate-600 hover:bg-slate-200 transition">Cancel</button>
              <button type="submit" disabled={posting} className="bg-brand-600 text-white px-8 py-2 rounded-xl font-bold hover:bg-brand-700 transition disabled:opacity-50">{posting ? 'Publishing...' : 'Publish Notice'}</button>
            </div>
          </form>
        </div>
      )}
    </div>
  )
}