import { useState, useEffect } from 'react'
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
}