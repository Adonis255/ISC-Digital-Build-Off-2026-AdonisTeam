import fs from 'fs';
import path from 'path';

const files = {
  // 1. Landing Page (Add Cross-Platform Banner)
  "src/modules/authentication/pages/Landing.jsx": `import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { APP_NAME, TAGLINE, INSTITUTION } from '../../../utils/constants.js'
import { Megaphone, Wrench, Search, Users, ArrowRight } from 'lucide-react'
import { supabase } from '../../../services/supabase/client.js'

export default function Landing() {
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')

  useEffect(() => {
    const fetchBanner = async () => {
      const { data } = await supabase.from('system_settings').select('banner_url').eq('id', 1).maybeSingle()
      if (data?.banner_url) setBannerUrl(data.banner_url)
    }
    fetchBanner()
  }, [])

  return (
    <div className="min-h-screen bg-navy-900 text-white relative overflow-hidden">
      
      {/* Background Image with Overlay */}
      <div className="absolute inset-0 z-0">
        <img src={bannerUrl} alt="Campus" className="w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-b from-navy-900/80 via-navy-900/90 to-navy-900"></div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 py-8">
        <nav className="flex items-center justify-between">
          <div>
            <p className="text-xl font-bold">{APP_NAME}</p>
            <p className="text-xs text-slate-400">{TAGLINE}</p>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-sm font-medium transition">Sign in</Link>
            <Link to="/register" className="px-4 py-2 rounded-lg bg-brand-600 hover:bg-brand-700 text-sm font-medium transition">Register</Link>
          </div>
        </nav>

        <section className="mt-32 text-center max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-brand-400 font-bold">{INSTITUTION}</p>
          <h1 className="text-5xl md:text-7xl font-extrabold mt-4 leading-tight">
            One Campus.<br /><span className="text-brand-400">One Experience.</span>
          </h1>
          <p className="text-slate-300 mt-6 text-xl">
            The unified digital campus for students, lecturers, workers, and administrators.
          </p>
          <div className="mt-10 flex justify-center gap-4">
            <Link to="/register" className="px-8 py-4 rounded-xl bg-brand-600 hover:bg-brand-700 font-bold text-lg inline-flex items-center gap-2 transition shadow-lg shadow-brand-900/50">
              Get Started <ArrowRight className="w-5 h-5" />
            </Link>
            <Link to="/login" className="px-8 py-4 rounded-xl bg-white/10 hover:bg-white/20 font-bold text-lg transition border border-white/10">Sign in</Link>
          </div>
        </section>

        <section className="mt-32 grid md:grid-cols-4 gap-6 pb-16">
          {[
            { icon: Megaphone, title: 'Notice Board', text: 'The digital billboard for the whole campus.' },
            { icon: Wrench, title: 'Maintenance', text: 'Report and track campus issues.' },
            { icon: Search, title: 'Lost & Found', text: 'Reunite students with lost items.' },
            { icon: Users, title: 'Community', text: 'Groups, events, and social feeds.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition backdrop-blur-sm">
              <Icon className="w-8 h-8 text-brand-400" />
              <h3 className="mt-4 font-bold text-lg">{title}</h3>
              <p className="text-sm text-slate-400 mt-2">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}`,

  // 2. Notice Board (Add Banner)
  "src/modules/community/pages/NoticeBoardPage.jsx": `import { useEffect, useState } from 'react'
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
      const fileName = \`notice-\${Math.random()}.\${imageFile.name.split('.').pop()}\`
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
              <button onClick={() => setNoticeFilter('current')} className={\`px-6 py-2 rounded-lg text-sm font-bold transition \${noticeFilter === 'current' ? 'bg-brand-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}\`}>Current</button>
              <button onClick={() => setNoticeFilter('past')} className={\`px-6 py-2 rounded-lg text-sm font-bold transition \${noticeFilter === 'past' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}\`}>Past</button>
            </div>
            <div className="relative w-full md:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input type="text" placeholder="Search notices..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-9 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-brand-500 outline-none" />
            </div>
          </div>

          <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
            {CATEGORIES.map(cat => (
              <button key={cat} onClick={() => setActiveTab(cat)} className={\`px-4 py-2 rounded-xl text-sm font-bold whitespace-nowrap transition \${activeTab === cat ? 'bg-brand-100 text-brand-700 border border-brand-200' : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'}\`}>
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
              <div key={post.id} className={\`bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col \${isPast ? 'opacity-70 border-slate-300' : 'border-slate-200'}\`}>
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
                      <span className={\`border px-2 py-0.5 rounded-md text-[10px] font-bold uppercase flex items-center gap-1 \${getUrgencyColor(post.urgency)}\`}>
                        <AlertTriangle className="w-3 h-3" /> {post.urgency}
                      </span>
                    )}
                  </div>

                  <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">{post.body}</p>

                  {post.expiry_date && (
                    <div className={\`mt-3 inline-block text-xs font-bold p-2 rounded-lg border \${isPast ? 'bg-red-50 text-red-600 border-red-100' : 'bg-slate-50 text-slate-600 border-slate-200'}\`}>
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
                    <button onClick={() => toggleLike(post.id)} className={\`flex items-center gap-2 transition \${isLiked ? 'text-red-500' : 'hover:text-brand-600'}\`}>
                      <Heart className={\`w-5 h-5 \${isLiked ? 'fill-current' : ''}\`} /> {postLikes > 0 ? postLikes : 'Like'}
                    </button>
                    <button onClick={() => setExpandedComments({...expandedComments, [post.id]: !isExpanded})} className="flex items-center gap-2 hover:text-brand-600 transition">
                      <MessageSquare className="w-5 h-5" /> {postComments.length} Comments
                    </button>
                  </div>
                  <button onClick={() => toggleBookmark(post.id)} className={\`flex items-center gap-2 transition \${isBookmarked ? 'text-brand-600' : 'hover:text-brand-600'}\`}>
                    <Bookmark className={\`w-5 h-5 \${isBookmarked ? 'fill-current' : ''}\`} /> Save
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
}`,

  // 3. Worker Dashboard (Add Banner)
  "src/modules/worker/pages/WorkerDashboard.jsx": `import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../../hooks/useAuth.js'
import { supabase } from '../../../services/supabase/client.js'
import { ClipboardList, CheckCircle2, Clock } from 'lucide-react'

export default function WorkerDashboard() {
  const { profile } = useAuth()
  const [tasks, setTasks] = useState([])
  const [bannerUrl, setBannerUrl] = useState('https://upload.wikimedia.org/wikipedia/commons/thumb/8/8c/University_of_Eastern_Africa_Baraton_Main_Building.jpg/1200px-University_of_Eastern_Africa_Baraton_Main_Building.jpg')

  useEffect(() => {
    if (!profile) return
    (async () => {
      // Fetch Banner
      const { data: settings } = await supabase.from('system_settings').select('banner_url').eq('id', 1).maybeSingle()
      if (settings?.banner_url) setBannerUrl(settings.banner_url)

      const { data } = await supabase.from('maintenance_assignments')
        .select('id,request_id,accepted_at,completed_at,maintenance_requests(id,title,status,urgency)')
        .eq('worker_id', profile.id).order('assigned_at', { ascending: false })
      setTasks(data || [])
    })()
  }, [profile?.id])

  const pending = tasks.filter(t => !t.completed_at).length
  const done = tasks.filter(t => t.completed_at).length

  return (
    <div className="space-y-6 pb-10">
      
      {/* HERO BANNER */}
      <div className="relative bg-[#1a0b2e] rounded-2xl overflow-hidden flex flex-col md:flex-row items-center justify-between p-8 md:p-12 shadow-2xl">
        <div className="absolute inset-0 opacity-40">
          <img src={bannerUrl} alt="Campus Banner" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-[#1a0b2e]/70"></div>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-2">Worker Dashboard</h1>
          <p className="text-purple-200 text-lg">Welcome back, {profile?.full_name}. Here are your task stats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Link to="/worker/tasks" className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-blue-100 text-blue-600 grid place-items-center mb-4"><ClipboardList className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Total Tasks</h3>
          <p className="text-3xl font-bold mt-1">{tasks.length}</p>
        </Link>
        <Link to="/worker/tasks" className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 grid place-items-center mb-4"><Clock className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Pending Tasks</h3>
          <p className="text-3xl font-bold mt-1">{pending}</p>
        </Link>
        <Link to="/worker/tasks" className="bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition">
          <div className="w-10 h-10 rounded-lg bg-emerald-100 text-emerald-600 grid place-items-center mb-4"><CheckCircle2 className="w-5 h-5" /></div>
          <h3 className="font-semibold text-slate-800">Completed Tasks</h3>
          <p className="text-3xl font-bold mt-1">{done}</p>
        </Link>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm p-6">
        <h2 className="font-semibold text-lg mb-4">Recent assignments</h2>
        {tasks.length === 0 ? <p className="text-sm text-slate-500">No assignments yet.</p> : (
          <ul className="divide-y">
            {tasks.slice(0, 5).map(t => (
              <li key={t.id} className="py-3">
                <p className="font-medium">{t.maintenance_requests?.title}</p>
                <p className="text-xs text-slate-500">
                  Status: {t.maintenance_requests?.status} • Priority: {t.maintenance_requests?.urgency}
                  {t.completed_at ? ' • Completed' : ''}
                </p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}`,

  // 4. Study Groups (Add Image & Admin Delete)
  "src/modules/student/pages/GroupsPage.jsx": `import { useEffect, useState } from 'react'
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
      const fileName = \`grp-\${Math.random()}.\${imageFile.name.split('.').pop()}\`
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
          <button key={cat} onClick={() => setActiveTab(cat)} className={\`px-4 py-2 font-medium text-sm border-b-2 transition whitespace-nowrap \${activeTab === cat ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-800'}\`}>
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
}`,

  // 5. Events (Admin Delete)
  "src/modules/student/pages/EventsPage.jsx": `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Calendar, MapPin, Heart, Image as ImageIcon, Video, X, Play, Plus, Trash2 } from 'lucide-react'

export default function EventsPage() {
  const { profile, role } = useAuth()
  const [events, setEvents] = useState([])
  const [selectedEvent, setSelectedEvent] = useState(null)
  const [media, setMedia] = useState([])
  const [likes, setLikes] = useState([])
  const [showForm, setShowForm] = useState(false)
  
  const [form, setForm] = useState({ title: '', description: '', event_date: '', location: '', is_recurring: false, recurrence_pattern: '' })
  const [coverImage, setCoverImage] = useState(null)
  const [loading, setLoading] = useState(false)

  const [mediaFile, setMediaFile] = useState(null)

  const loadEvents = async () => {
    const { data } = await supabase.from('campus_events').select('*, profiles(full_name)').order('event_date', { ascending: false })
    setEvents(data || [])
    const { data: l } = await supabase.from('event_likes').select('*')
    setLikes(l || [])
  }

  useEffect(() => { loadEvents() }, [])

  const loadEventDetails = async (event) => {
    setSelectedEvent(event)
    const { data: m } = await supabase.from('event_media').select('*, profiles(full_name)').eq('event_id', event.id).order('created_at', { ascending: false })
    setMedia(m || [])
  }

  const handleCreateEvent = async (e) => {
    e.preventDefault()
    setLoading(true)
    let imageUrl = null

    if (coverImage) {
      const fileName = \`event-\${Math.random()}.\${coverImage.name.split('.').pop()}\`
      await supabase.storage.from('community-media').upload(fileName, coverImage)
      const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }

    await supabase.from('campus_events').insert([{ ...form, created_by: profile.id, image_url: imageUrl }])
    setForm({ title: '', description: '', event_date: '', location: '', is_recurring: false, recurrence_pattern: '' })
    setCoverImage(null); setShowForm(false); setLoading(false); loadEvents()
  }

  const handleDeleteEvent = async (e, id) => {
    e.stopPropagation()
    if (!window.confirm('Admin: Delete this event permanently?')) return
    await supabase.from('campus_events').delete().eq('id', id)
    loadEvents()
  }

  const handleUploadMedia = async (e) => {
    e.preventDefault()
    if (!mediaFile) return
    setLoading(true)
    const isVideo = mediaFile.type.startsWith('video')
    const fileName = \`evt-\${Math.random()}.\${mediaFile.name.split('.').pop()}\`
    await supabase.storage.from('community-media').upload(fileName, mediaFile)
    const { data } = await supabase.storage.from('community-media').getPublicUrl(fileName)

    await supabase.from('event_media').insert([{ event_id: selectedEvent.id, user_id: profile.id, media_url: data.publicUrl, media_type: isVideo ? 'video' : 'image' }])
    setMediaFile(null); setLoading(false); loadEventDetails(selectedEvent)
  }

  const toggleLike = async (eventId) => {
    const existing = likes.find(l => l.event_id === eventId && l.user_id === profile.id)
    if (existing) await supabase.from('event_likes').delete().eq('id', existing.id)
    else await supabase.from('event_likes').insert([{ event_id: eventId, user_id: profile.id }])
    loadEvents()
  }

  const canCreate = role === 'admin' || role === 'student'

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Campus Events</h1>
        {canCreate && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="w-4 h-4" /> {showForm ? 'Cancel' : 'Create Event'}
          </button>
        )}
      </div>

      {showForm && canCreate && (
        <form onSubmit={handleCreateEvent} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <input required placeholder="Event Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          <textarea required placeholder="Full description of the event..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" rows="3"></textarea>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="datetime-local" value={form.event_date} onChange={e => setForm({...form, event_date: e.target.value})} className="border p-2 rounded" />
            <input required placeholder="Location" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="border p-2 rounded" />
          </div>
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" checked={form.is_recurring} onChange={e => setForm({...form, is_recurring: e.target.checked})} className="w-4 h-4" /> Recurring Event?
            </label>
            {form.is_recurring && <input placeholder="e.g. Every Monday" value={form.recurrence_pattern} onChange={e => setForm({...form, recurrence_pattern: e.target.value})} className="border p-1 text-sm rounded" />}
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setCoverImage(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
          </div>
          <button type="submit" disabled={loading} className="bg-navy-900 text-white px-6 py-2 rounded-lg">{loading ? 'Creating...' : 'Publish Event'}</button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {events.map(ev => {
          const likeCount = likes.filter(l => l.event_id === ev.id).length
          const isLiked = likes.some(l => l.event_id === ev.id && l.user_id === profile.id)
          
          return (
            <div key={ev.id} onClick={() => loadEventDetails(ev)} className="bg-white rounded-xl border shadow-sm overflow-hidden hover:shadow-md cursor-pointer transition flex flex-col group relative">
              {role === 'admin' && (
                <button onClick={(e) => handleDeleteEvent(e, ev.id)} className="absolute top-2 right-2 z-10 bg-red-600 text-white p-2 rounded-full shadow-lg hover:bg-red-700 transition" title="Admin Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
              {ev.image_url ? (
                <img src={ev.image_url} alt={ev.title} className="w-full h-48 object-cover group-hover:scale-105 transition duration-500" />
              ) : (
                <div className="w-full h-48 bg-brand-50 flex items-center justify-center"><Calendar className="w-10 h-10 text-brand-300" /></div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-800">{ev.title}</h3>
                <p className="text-sm text-slate-500 mt-1 flex-1 line-clamp-2">{ev.description}</p>
                <div className="flex items-center gap-4 mt-4 text-xs text-slate-500">
                  <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> {new Date(ev.event_date).toLocaleDateString()}</span>
                  <span className="flex items-center gap-1"><MapPin className="w-3 h-3" /> {ev.location}</span>
                </div>
                <div className="mt-4 pt-3 border-t flex justify-between items-center">
                  <span className="text-xs text-slate-400">By {ev.profiles?.full_name}</span>
                  <button onClick={(e) => { e.stopPropagation(); toggleLike(ev.id) }} className={\`flex items-center gap-1 text-sm \${isLiked ? 'text-red-500' : 'text-slate-400 hover:text-red-500'}\`}>
                    <Heart className={\`w-4 h-4 \${isLiked ? 'fill-current' : ''}\`} /> {likeCount}
                  </button>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-4xl rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="relative h-64">
              {selectedEvent.image_url ? (
                <img src={selectedEvent.image_url} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-navy-900 flex items-center justify-center"><Calendar className="w-16 h-16 text-white/20" /></div>
              )}
              <button onClick={() => setSelectedEvent(null)} className="absolute top-4 right-4 bg-black/50 hover:bg-black/80 text-white p-2 rounded-full transition"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h2 className="text-3xl font-bold text-slate-900">{selectedEvent.title}</h2>
                  <div className="flex flex-wrap gap-4 mt-2 text-sm text-slate-600">
                    <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(selectedEvent.event_date).toLocaleString()}</span>
                    <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {selectedEvent.location}</span>
                  </div>
                  {selectedEvent.is_recurring && <p className="mt-1 text-sm font-medium text-brand-600">🔄 Recurring: {selectedEvent.recurrence_pattern}</p>}
                </div>
                <button onClick={() => toggleLike(selectedEvent.id)} className="bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 px-4 py-2 rounded-lg flex items-center gap-2 transition">
                  <Heart className="w-5 h-5" /> {likes.filter(l => l.event_id === selectedEvent.id).length} Likes
                </button>
              </div>
              
              <p className="text-slate-700 whitespace-pre-wrap leading-relaxed mb-8">{selectedEvent.description}</p>

              <div className="border-t pt-6">
                <h3 className="font-bold text-lg mb-4 flex items-center gap-2"><ImageIcon className="w-5 h-5" /> Event Gallery</h3>
                
                <form onSubmit={handleUploadMedia} className="flex gap-2 mb-6">
                  <input type="file" accept="image/*,video/*" onChange={e => setMediaFile(e.target.files[0])} className="flex-1 text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700" />
                  <button type="submit" disabled={loading || !mediaFile} className="bg-brand-600 text-white px-4 py-2 rounded-lg text-sm disabled:opacity-50">Upload Media</button>
                </form>

                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {media.map(m => (
                    <div key={m.id} className="relative rounded-xl overflow-hidden border bg-black group">
                      {m.media_type === 'video' ? (
                        <video src={m.media_url} controls className="w-full h-40 object-cover" />
                      ) : (
                        <img src={m.media_url} alt="Media" className="w-full h-40 object-cover hover:opacity-80 transition cursor-pointer" />
                      )}
                      <span className="absolute bottom-2 left-2 text-[10px] font-bold text-white bg-black/50 px-2 py-1 rounded">{m.profiles?.full_name}</span>
                    </div>
                  ))}
                  {media.length === 0 && <p className="text-sm text-slate-500 col-span-3 text-center py-4">No media uploaded yet. Be the first!</p>}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}`,

  // 6. Internships (Images and extra fields)
  "src/modules/internships/pages/InternshipsPage.jsx": `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Briefcase, Calendar, Building, Clock, CheckCircle, FileText, Image as ImageIcon } from 'lucide-react'

export default function InternshipsPage() {
  const { profile, role } = useAuth()
  const [internships, setInternships] = useState([])
  const [myApps, setMyApps] = useState([])
  const [allApps, setAllApps] = useState([])
  
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ title: '', company: '', description: '', deadline: '', duration: '', requirements: '' })
  const [imageFile, setImageFile] = useState(null)
  const [loading, setLoading] = useState(false)
  
  const [applyingTo, setApplyingTo] = useState(null)
  const [cvFile, setCvFile] = useState(null)
  const [uploading, setUploading] = useState(false)

  const loadData = async () => {
    const { data: i } = await supabase.from('internships').select('*').order('created_at', { ascending: false })
    setInternships(i || [])

    if (role === 'student') {
      const { data: a } = await supabase.from('internship_applications').select('*').eq('student_id', profile.id)
      setMyApps(a || [])
    }
    if (role === 'admin') {
      const { data: aa } = await supabase.from('internship_applications').select('*, profiles(full_name, email), internships(title, company)').order('created_at', { ascending: false })
      setAllApps(aa || [])
    }
  }

  useEffect(() => { loadData() }, [role, profile])

  const handleCreate = async (e) => {
    e.preventDefault()
    setLoading(true)
    let imageUrl = null
    if (imageFile) {
      const fileName = \`intern-\${Math.random()}.\${imageFile.name.split('.').pop()}\`
      await supabase.storage.from('community-media').upload(fileName, imageFile)
      const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
      imageUrl = data.publicUrl
    }
    await supabase.from('internships').insert([{ ...form, created_by: profile.id, image_url: imageUrl }])
    setForm({ title: '', company: '', description: '', deadline: '', duration: '', requirements: '' })
    setImageFile(null); setShowForm(false); setLoading(false); loadData()
  }

  const handleApply = async (e) => {
    e.preventDefault()
    if (!cvFile) return alert('Please upload your CV (PDF).')
    setUploading(true)
    const fileName = \`cv-\${profile.id}-\${Date.now()}.pdf\`
    const { error: uploadErr } = await supabase.storage.from('cvs').upload(fileName, cvFile)
    if (uploadErr) { alert(uploadErr.message); setUploading(false); return }

    const { data: { publicUrl } } = supabase.storage.from('cvs').getPublicUrl(fileName)
    const { error: dbErr } = await supabase.from('internship_applications').insert([{
      internship_id: applyingTo.id, student_id: profile.id, cv_url: publicUrl
    }])

    setUploading(false)
    if (dbErr) alert(dbErr.message)
    else { alert('Application submitted successfully!'); setApplyingTo(null); setCvFile(null); loadData() }
  }

  const updateAppStatus = async (appId, status) => {
    await supabase.from('internship_applications').update({ status }).eq('id', appId)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-10">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-indigo-100 text-indigo-600 rounded-lg flex items-center justify-center"><Briefcase className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Internships</h1>
            <p className="text-sm text-slate-500">Find and apply for opportunities to grow your career.</p>
          </div>
        </div>
        {isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-xl">
            {showForm ? 'Cancel' : '+ Post Internship'}
          </button>
        )}
      </div>

      {showForm && isAdmin && (
        <form onSubmit={handleCreate} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Job Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded-xl" />
            <input required placeholder="Company Name" value={form.company} onChange={e => setForm({...form, company: e.target.value})} className="w-full border p-2 rounded-xl" />
          </div>
          <textarea required placeholder="Description and responsibilities..." value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded-xl" rows="3"></textarea>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Duration (e.g. 3 Months)" value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="border p-2 rounded-xl" />
            <input placeholder="Requirements (e.g. CGPA > 3.0)" value={form.requirements} onChange={e => setForm({...form, requirements: e.target.value})} className="border p-2 rounded-xl" />
            <input type="date" value={form.deadline} onChange={e => setForm({...form, deadline: e.target.value})} className="border p-2 rounded-xl" />
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Company Logo / Cover Image</label>
            <input type="file" accept="image/*" onChange={e => setImageFile(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
          </div>

          <button type="submit" disabled={loading} className="bg-brand-600 text-white px-6 py-2 rounded-xl">Publish</button>
        </form>
      )}

      {applyingTo && (
        <form onSubmit={handleApply} className="bg-indigo-50 border border-indigo-200 p-6 rounded-xl space-y-4">
          <h3 className="font-bold text-lg">Apply for: {applyingTo.title} at {applyingTo.company}</h3>
          <div>
            <label className="block text-sm font-medium mb-1">Upload CV (PDF only)</label>
            <input required type="file" accept=".pdf" onChange={e => setCvFile(e.target.files[0])} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-indigo-100 file:text-indigo-700" />
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={uploading} className="bg-indigo-600 text-white px-6 py-2 rounded-lg disabled:opacity-50">{uploading ? 'Uploading...' : 'Submit Application'}</button>
            <button type="button" onClick={() => setApplyingTo(null)} className="bg-slate-200 px-4 py-2 rounded-lg">Cancel</button>
          </div>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {internships.map(item => {
          const hasApplied = myApps.find(a => a.internship_id === item.id)
          
          return (
            <div key={item.id} className="bg-white rounded-2xl border shadow-sm overflow-hidden flex flex-col hover:shadow-md transition">
              {item.image_url ? (
                <img src={item.image_url} alt={item.title} className="w-full h-40 object-cover" />
              ) : (
                <div className="w-full h-40 bg-indigo-50 flex items-center justify-center"><ImageIcon className="w-10 h-10 text-indigo-300" /></div>
              )}
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-800">{item.title}</h3>
                <div className="flex items-center gap-1 text-slate-600 text-sm mt-1 mb-2"><Building className="w-4 h-4" /> {item.company}</div>
                <p className="text-slate-600 text-sm flex-1 whitespace-pre-wrap">{item.description}</p>
                
                <div className="mt-3 space-y-1 text-xs text-slate-500">
                  {item.duration && <p className="flex items-center gap-1"><Clock className="w-3 h-3" /> {item.duration}</p>}
                  {item.requirements && <p className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {item.requirements}</p>}
                  {item.deadline && <p className="flex items-center gap-1 text-red-500 font-bold"><Calendar className="w-3 h-3" /> Apply before: {new Date(item.deadline).toLocaleDateString()}</p>}
                </div>

                {role === 'student' && (
                  <div className="mt-4 pt-3 border-t">
                    {hasApplied ? (
                      <div className="flex items-center justify-between bg-green-50 p-3 rounded-lg border border-green-200">
                        <span className="text-sm font-bold text-green-800 flex items-center gap-2"><CheckCircle className="w-4 h-4" /> Applied</span>
                        <span className="text-xs font-bold uppercase bg-green-200 text-green-900 px-2 py-1 rounded">{hasApplied.status}</span>
                      </div>
                    ) : (
                      <button onClick={() => setApplyingTo(item)} className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition">Apply Now</button>
                    )}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {isAdmin && allApps.length > 0 && (
        <div className="mt-10">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2"><FileText className="w-5 h-5" /> Student Applications</h2>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b">
                <tr><th className="p-3">Student</th><th className="p-3">Role Applied For</th><th className="p-3">CV</th><th className="p-3">Status</th><th className="p-3">Action</th></tr>
              </thead>
              <tbody>
                {allApps.map(app => (
                  <tr key={app.id} className="border-b">
                    <td className="p-3 font-medium">{app.profiles?.full_name}</td>
                    <td className="p-3">{app.internships?.title} <span className="text-slate-400">({app.internships?.company})</span></td>
                    <td className="p-3"><a href={app.cv_url} target="_blank" rel="noreferrer" className="text-brand-600 hover:underline">View CV</a></td>
                    <td className="p-3"><span className="px-2 py-1 bg-slate-100 rounded text-xs font-bold">{app.status}</span></td>
                    <td className="p-3">
                      <select value={app.status} onChange={(e) => updateAppStatus(app.id, e.target.value)} className="border rounded p-1 text-sm">
                        <option value="Applied">Applied</option>
                        <option value="Shortlisted">Shortlisted</option>
                        <option value="Accepted">Accepted</option>
                        <option value="Rejected">Rejected</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}`,

  // 7. Counselling Services (Admin creates, Student views)
  "src/modules/counselling/pages/CounsellingPage.jsx": `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { ShieldCheck, AlertTriangle, Building, Phone, Plus, Trash2 } from 'lucide-react'

export default function CounsellingPage() {
  const { profile, role } = useAuth()
  const [requests, setRequests] = useState([])
  const [services, setServices] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [showServiceForm, setShowServiceForm] = useState(false)
  
  const [form, setForm] = useState({ issue_summary: '', preferred_date: '' })
  const [serviceForm, setServiceForm] = useState({ name: '', office_number: '', contact: '', description: '' })

  const loadData = async () => {
    const { data: r } = await supabase.from('counselling_requests').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setRequests(r || [])
    
    const { data: s } = await supabase.from('counselling_services').select('*').order('name')
    setServices(s || [])
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('counselling_requests').insert([{ ...form, student_id: profile.id }])
    setForm({ issue_summary: '', preferred_date: '' })
    setShowForm(false); loadData()
  }

  const handleCreateService = async (e) => {
    e.preventDefault()
    await supabase.from('counselling_services').insert([serviceForm])
    setServiceForm({ name: '', office_number: '', contact: '', description: '' })
    setShowServiceForm(false); loadData()
  }

  const handleDeleteService = async (id) => {
    if (!window.confirm('Delete this service?')) return
    await supabase.from('counselling_services').delete().eq('id', id)
    loadData()
  }

  const updateStatus = async (id, status) => {
    await supabase.from('counselling_requests').update({ status }).eq('id', id)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-6 max-w-4xl mx-auto pb-10">
      <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex gap-3">
        <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
        <div>
          <h3 className="font-bold text-red-800">Emergency Notice</h3>
          <p className="text-sm text-red-700 mt-1">BaratonHub is not an emergency service. If you are in immediate danger, contact Campus Security immediately.</p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">Counselling Services</h1>
          <p className="text-sm text-slate-500">Your privacy is strictly protected.</p>
        </div>
        {!isAdmin && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2">
            <ShieldCheck className="w-4 h-4" /> {showForm ? 'Cancel' : 'Request Session'}
          </button>
        )}
      </div>

      {/* ADMIN: MANAGE SERVICES */}
      {isAdmin && (
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <div className="flex justify-between items-center mb-4 border-b pb-2">
            <h2 className="font-bold text-lg flex items-center gap-2"><Building className="w-5 h-5" /> Counselling Offices & Services</h2>
            <button onClick={() => setShowServiceForm(!showServiceForm)} className="text-sm bg-brand-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-1">
              <Plus className="w-4 h-4" /> Add Service
            </button>
          </div>
          
          {showServiceForm && (
            <form onSubmit={handleCreateService} className="bg-slate-50 p-4 rounded-xl mb-4 space-y-3">
              <input required placeholder="Service Name (e.g. Mental Health Clinic)" value={serviceForm.name} onChange={e => setServiceForm({...serviceForm, name: e.target.value})} className="w-full border p-2 rounded-lg" />
              <div className="grid grid-cols-2 gap-3">
                <input required placeholder="Office Number (e.g. Admin Block, Rm 4)" value={serviceForm.office_number} onChange={e => setServiceForm({...serviceForm, office_number: e.target.value})} className="w-full border p-2 rounded-lg" />
                <input required placeholder="Contact Phone (e.g. ext 102)" value={serviceForm.contact} onChange={e => setServiceForm({...serviceForm, contact: e.target.value})} className="w-full border p-2 rounded-lg" />
              </div>
              <textarea placeholder="Description of services provided..." value={serviceForm.description} onChange={e => setServiceForm({...serviceForm, description: e.target.value})} className="w-full border p-2 rounded-lg" rows="2"></textarea>
              <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-lg text-sm">Save Service</button>
            </form>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {services.map(s => (
              <div key={s.id} className="p-4 border rounded-xl relative group">
                <h3 className="font-bold text-slate-800">{s.name}</h3>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Building className="w-3 h-3" /> {s.office_number}</p>
                <p className="text-xs text-slate-500 mt-1 flex items-center gap-1"><Phone className="w-3 h-3" /> {s.contact}</p>
                <p className="text-sm text-slate-600 mt-2">{s.description}</p>
                <button onClick={() => handleDeleteService(s.id)} className="absolute top-2 right-2 text-red-400 hover:text-red-600 opacity-0 group-hover:opacity-100 transition"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
            {services.length === 0 && <p className="text-sm text-slate-500 italic">No services added yet.</p>}
          </div>
        </div>
      )}

      {/* STUDENT: VIEW SERVICES */}
      {!isAdmin && services.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {services.map(s => (
            <div key={s.id} className="bg-white p-5 rounded-2xl border shadow-sm border-l-4 border-l-brand-500">
              <h3 className="font-bold text-slate-800">{s.name}</h3>
              <div className="mt-2 space-y-1 text-sm text-slate-600">
                <p className="flex items-center gap-2"><Building className="w-4 h-4 text-slate-400" /> {s.office_number}</p>
                <p className="flex items-center gap-2"><Phone className="w-4 h-4 text-slate-400" /> {s.contact}</p>
              </div>
              <p className="text-sm text-slate-500 mt-3 bg-slate-50 p-2 rounded-lg">{s.description}</p>
            </div>
          ))}
        </div>
      )}

      {showForm && !isAdmin && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <textarea required placeholder="Briefly describe the issue (kept strictly confidential)..." value={form.issue_summary} onChange={e => setForm({...form, issue_summary: e.target.value})} className="w-full border p-2 rounded-xl" rows="3"></textarea>
          <input type="date" value={form.preferred_date} onChange={e => setForm({...form, preferred_date: e.target.value})} className="border p-2 rounded-xl" />
          <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-xl">Submit Confidential Request</button>
        </form>
      )}

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>{isAdmin && <th className="p-3">Student</th>}<th className="p-3">Issue Summary</th><th className="p-3">Date</th><th className="p-3">Status</th>{isAdmin && <th className="p-3">Action</th>}</tr>
          </thead>
          <tbody>
            {requests.map(req => (
              <tr key={req.id} className="border-b">
                {isAdmin && <td className="p-3 font-medium">{req.profiles?.full_name}</td>}
                <td className="p-3 text-slate-600 truncate max-w-xs">{req.issue_summary}</td>
                <td className="p-3">{req.preferred_date || '-'}</td>
                <td className="p-3"><span className={\`px-2 py-1 rounded text-xs font-bold uppercase \${req.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-green-100 text-green-700'}\`}>{req.status}</span></td>
                {isAdmin && (
                  <td className="p-3">
                    <select value={req.status} onChange={(e) => updateStatus(req.id, e.target.value)} className="border rounded p-1 text-sm">
                      <option value="pending">Pending</option>
                      <option value="scheduled">Scheduled</option>
                      <option value="completed">Completed</option>
                    </select>
                  </td>
                )}
              </tr>
            ))}
            {requests.length === 0 && <tr><td colSpan={isAdmin ? 5 : 3} className="p-6 text-center text-slate-500">No requests found.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}`,

  // 8. Sidebar (Remove Announcements to avoid confusion with Notice Board)
  "src/components/layout/Sidebar.jsx": `import { NavLink } from 'react-router-dom'
import { LogOut, Home, Users, Wrench, Megaphone, Bell, Search, MessageSquare, Calendar, ShieldCheck, BookOpen, User, Shield, DollarSign, AlertCircle, Briefcase, Award, Contact, FileText, Settings, ShieldAlert, Building, CheckSquare, UserCheck, Library, HelpCircle, Trophy, Play, History, FolderOpen, CalendarDays } from 'lucide-react'
import { useAuth } from '../../hooks/useAuth.js'

export default function Sidebar({ isOpen, closeMenu }) {
  const { profile, role, signOut } = useAuth()
  
  const nav = {
    student: [
      { to: '/student/dashboard', label: 'Dashboard', icon: Home },
      { to: '/student/notice-board', label: 'Notice Board', icon: Megaphone },
      { to: '/student/catalog', label: 'My Courses', icon: BookOpen },
      { to: '/student/attendance', label: 'My Attendance', icon: Calendar },
      { to: '/student/exams', label: 'Exams', icon: FileText },
      { to: '/student/community', label: 'Community Feed', icon: MessageSquare },
      { to: '/student/groups', label: 'Study Groups', icon: Users },
      { to: '/student/events', label: 'Campus Events', icon: CalendarDays },
      { to: '/student/lost-found', label: 'Lost & Found', icon: Search },
      { to: '/student/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/student/finance', label: 'My Fees', icon: DollarSign },
      { to: '/student/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/student/directory', label: 'Academic Offices', icon: Contact },
      { to: '/student/internships', label: 'Internships', icon: Briefcase },
      { to: '/student/scholarships', label: 'Scholarships', icon: Award },
      { to: '/student/complaints', label: 'Complaints', icon: AlertCircle },
      { to: '/student/profile', label: 'Settings', icon: Settings },
      { to: '/student/notifications', label: 'Notifications', icon: Bell }
    ],
    admin: [
      { to: '/admin/dashboard', label: 'Dashboard', icon: Home },
      { to: '/admin/notice-board', label: 'Notice Board', icon: Megaphone },
      { to: '/admin/users', label: 'User Management', icon: Users },
      { to: '/admin/departments', label: 'Departments', icon: Building },
      { to: '/admin/offices', label: 'Manage Offices', icon: Contact },
      { to: '/admin/courses', label: 'Academic Mgmt', icon: BookOpen },
      { to: '/admin/enrollments', label: 'Enrollments', icon: UserCheck },
      { to: '/admin/exams', label: 'Exams', icon: FileText },
      { to: '/admin/community', label: 'Community Feed', icon: MessageSquare },
      { to: '/admin/groups', label: 'Study Groups', icon: Users },
      { to: '/admin/events', label: 'Campus Events', icon: CalendarDays },
      { to: '/admin/internships', label: 'Internships', icon: Briefcase },
      { to: '/admin/scholarships', label: 'Scholarships', icon: Award },
      { to: '/admin/finance', label: 'Finance', icon: DollarSign },
      { to: '/admin/complaints', label: 'Complaints', icon: AlertCircle },
      { to: '/admin/maintenance', label: 'Maintenance', icon: Wrench },
      { to: '/admin/lost-found', label: 'Lost & Found', icon: Search },
      { to: '/admin/counselling', label: 'Counselling', icon: ShieldCheck },
      { to: '/admin/settings', label: 'System Settings', icon: Settings },
      { to: '/admin/profile', label: 'My Profile', icon: User },
      { to: '/admin/notifications', label: 'Notifications', icon: Bell }
    ],
    lecturer: [
      { to: '/lecturer/dashboard', label: 'Dashboard', icon: Home },
      { to: '/lecturer/notice-board', label: 'Notice Board', icon: Megaphone },
      { to: '/lecturer/classes', label: 'My Classes', icon: BookOpen },
      { to: '/lecturer/live-lecture', label: 'Live Attendance', icon: Play },
      { to: '/lecturer/exams', label: 'Exams', icon: FileText },
      { to: '/lecturer/profile', label: 'Settings', icon: Settings },
      { to: '/lecturer/notifications', label: 'Notifications', icon: Bell }
    ],
    worker: [
      { to: '/worker/dashboard', label: 'Dashboard', icon: Home },
      { to: '/worker/notice-board', label: 'Notice Board', icon: Megaphone },
      { to: '/worker/tasks', label: 'My Tasks', icon: Wrench },
      { to: '/worker/profile', label: 'Settings', icon: Settings },
      { to: '/worker/notifications', label: 'Notifications', icon: Bell }
    ]
  }

  return (
    <aside className={\`fixed left-0 top-0 z-40 w-64 flex flex-col h-screen transition-transform duration-300 ease-in-out bg-[#1a0b2e] text-slate-300 border-r border-purple-900 \${isOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0\`}>
      <div className="p-6 flex flex-col items-center justify-center border-b border-purple-900/50 shrink-0">
        <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-3 shadow-lg">
          <img src="/logo.svg" alt="Baraton" className="w-12 h-12" onError={(e) => { e.target.style.display = 'none'; e.target.nextSibling.style.display = 'block' }} />
          <span className="text-brand-600 font-bold text-2xl hidden">B</span>
        </div>
        <h1 className="text-xl font-bold text-white tracking-wide">BaratonHub</h1>
        <p className="text-[10px] text-purple-300 font-medium uppercase tracking-widest mt-1">Baraton University</p>
      </div>
      
      <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto custom-scrollbar">
        {(nav[role] || []).map((item) => (
          <NavLink key={item.label} to={item.to} onClick={closeMenu} 
            className={({isActive}) => \`flex items-center justify-between px-4 py-3 rounded-lg transition font-medium text-sm \${isActive ? 'bg-brand-600 text-white shadow-lg shadow-brand-900/50' : 'hover:bg-purple-900/50 hover:text-white text-purple-200'}\`}>
            <div className="flex items-center gap-3">
              <item.icon className="w-5 h-5" /> {item.label}
            </div>
          </NavLink>
        ))}
      </nav>
      
      <div className="p-4 border-t border-purple-900/50 shrink-0">
        <button onClick={signOut} className="flex items-center justify-center gap-2 text-purple-300 hover:text-white text-sm w-full py-2 transition font-medium"><LogOut className="w-4 h-4" /> Sign Out</button>
      </div>
    </aside>
  )
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
});
console.log("✅ Master Cross-Platform Update applied! Banner everywhere, Counselling Services, Admin deletes, and Internship images.");