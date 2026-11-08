import { Link } from 'react-router-dom'
import { APP_NAME, TAGLINE, INSTITUTION } from '../../../utils/constants.js'
import { Megaphone, Wrench, Search, Users, ArrowRight } from 'lucide-react'

export default function Landing() {
  return (
    <div className="min-h-screen bg-navy-900 text-white">
      <div className="max-w-6xl mx-auto px-6 py-8">
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

        <section className="mt-24 text-center max-w-3xl mx-auto">
          <p className="text-xs uppercase tracking-widest text-brand-400 font-bold">University of Eastern Africa, Baraton</p>
          <h1 className="text-5xl md:text-6xl font-extrabold mt-4 leading-tight">
            One Campus.<br /><span className="text-brand-400">One Connected Experience.</span>
          </h1>
          <p className="text-slate-300 mt-6 text-lg">
            The unified digital campus for students, lecturers, workers, and administrators at {INSTITUTION}.
          </p>
          <div className="mt-8 flex justify-center gap-3">
            <Link to="/register" className="px-6 py-3 rounded-lg bg-brand-600 hover:bg-brand-700 font-medium inline-flex items-center gap-2 transition">
              Get started <ArrowRight className="w-4 h-4" />
            </Link>
            <Link to="/login" className="px-6 py-3 rounded-lg bg-white/10 hover:bg-white/20 font-medium transition">Sign in</Link>
          </div>
        </section>

        <section className="mt-24 grid md:grid-cols-4 gap-4 pb-16">
          {[
            { icon: Megaphone, title: 'Announcements', text: 'Digital billboard for the whole campus.' },
            { icon: Wrench, title: 'Maintenance', text: 'Report and track campus issues.' },
            { icon: Search, title: 'Lost & Found', text: 'Reunite students with lost items.' },
            { icon: Users, title: 'Community', text: 'Groups, events, and social feed.' },
          ].map(({ icon: Icon, title, text }) => (
            <div key={title} className="p-5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition">
              <Icon className="w-6 h-6 text-brand-400" />
              <h3 className="mt-3 font-semibold">{title}</h3>
              <p className="text-sm text-slate-400 mt-1">{text}</p>
            </div>
          ))}
        </section>
      </div>
    </div>
  )
}