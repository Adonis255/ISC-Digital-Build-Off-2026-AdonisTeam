import { useState, useEffect } from 'react'
import { supabase } from '../../services/supabase/client.js'
import { Search, X, Megaphone, Briefcase, SearchIcon, Award } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth.js'

export default function GlobalSearch({ onClose }) {
  const { role } = useAuth()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState({ announcements: [], internships: [], lostFound: [], scholarships: [] })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const searchAll = async () => {
      if (query.length < 2) {
        setResults({ announcements: [], internships: [], lostFound: [], scholarships: [] })
        return
      }
      setLoading(true)
      
      const term = `%${query}%`
      
      const [ann, intern, lf, sch] = await Promise.all([
        supabase.from('announcements').select('id, title, body').ilike('title', term).limit(3),
        supabase.from('internships').select('id, title, company').ilike('title', term).limit(3),
        supabase.from('items').select('id, title, kind').ilike('title', term).limit(3),
        supabase.from('scholarships').select('id, title, amount').ilike('title', term).limit(3)
      ])

      setResults({
        announcements: ann.data || [],
        internships: intern.data || [],
        lostFound: lf.data || [],
        scholarships: sch.data || []
      })
      setLoading(false)
    }

    const debounce = setTimeout(searchAll, 300)
    return () => clearTimeout(debounce)
  }, [query])

  const hasResults = results.announcements.length > 0 || results.internships.length > 0 || results.lostFound.length > 0 || results.scholarships.length > 0

  return (
    <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-sm z-50 flex items-start justify-center pt-20 px-4" onClick={onClose}>
      <div className="bg-white w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()}>
        <div className="flex items-center border-b px-4 py-3">
          <Search className="w-5 h-5 text-slate-400 mr-3" />
          <input 
            autoFocus 
            type="text" 
            placeholder="Search announcements, internships, lost items..." 
            value={query} 
            onChange={e => setQuery(e.target.value)} 
            className="flex-1 outline-none text-lg bg-transparent" 
          />
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5 text-slate-500" /></button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {query.length < 2 ? (
            <p className="text-center text-slate-500 py-10 text-sm">Type at least 2 characters to search across the platform.</p>
          ) : loading ? (
            <p className="text-center text-brand-600 py-10 text-sm font-medium animate-pulse">Searching...</p>
          ) : !hasResults ? (
            <p className="text-center text-slate-500 py-10 text-sm">No results found for "{query}".</p>
          ) : (
            <div className="space-y-4">
              {results.announcements.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase px-3 mb-1">Announcements</p>
                  {results.announcements.map(a => (
                    <Link key={a.id} to={`/${role}/announcements`} onClick={onClose} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg">
                      <Megaphone className="w-5 h-5 text-purple-500" />
                      <div><p className="font-medium text-slate-800 text-sm">{a.title}</p><p className="text-xs text-slate-500 truncate">{a.body}</p></div>
                    </Link>
                  ))}
                </div>
              )}

              {results.internships.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase px-3 mb-1">Internships</p>
                  {results.internships.map(i => (
                    <Link key={i.id} to={`/${role}/internships`} onClick={onClose} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg">
                      <Briefcase className="w-5 h-5 text-indigo-500" />
                      <div><p className="font-medium text-slate-800 text-sm">{i.title}</p><p className="text-xs text-slate-500">{i.company}</p></div>
                    </Link>
                  ))}
                </div>
              )}

              {results.lostFound.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase px-3 mb-1">Lost & Found</p>
                  {results.lostFound.map(l => (
                    <Link key={l.id} to={`/${role}/lost-found`} onClick={onClose} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg">
                      <SearchIcon className="w-5 h-5 text-emerald-500" />
                      <div><p className="font-medium text-slate-800 text-sm">{l.title}</p><p className="text-xs text-slate-500 capitalize">{l.kind} item</p></div>
                    </Link>
                  ))}
                </div>
              )}

              {results.scholarships.length > 0 && (
                <div>
                  <p className="text-xs font-bold text-slate-400 uppercase px-3 mb-1">Scholarships</p>
                  {results.scholarships.map(s => (
                    <Link key={s.id} to={`/${role}/scholarships`} onClick={onClose} className="flex items-center gap-3 p-3 hover:bg-slate-50 rounded-lg">
                      <Award className="w-5 h-5 text-yellow-500" />
                      <div><p className="font-medium text-slate-800 text-sm">{s.title}</p><p className="text-xs text-slate-500">{s.amount || 'Financial Aid'}</p></div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}