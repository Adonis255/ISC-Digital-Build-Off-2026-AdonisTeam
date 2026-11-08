import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../../services/supabase/client.js'
import { ROLE_HOME } from '../../../utils/constants.js'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const nav = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return setError(error.message)
    
    // Use maybeSingle() to prevent crash if profile is missing
    const { data: profile, error: profileError } = await supabase.from('profiles').select('role, status').eq('id', data.user.id).maybeSingle()
    
    if (profileError || !profile) {
      return setError('Profile not found. Please contact the administrator.')
    }
    if (profile.status !== 'active') {
      return setError('Your account is suspended or inactive.')
    }
    
    nav(ROLE_HOME[profile.role] || '/')
  }

  return (
    <div className="min-h-screen grid place-items-center bg-slate-100 p-4">
      <form onSubmit={handleLogin} className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4">
        <div className="text-center mb-6">
          <h2 className="text-2xl font-bold text-navy-900">BaratonHub</h2>
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>
        {error && <p className="text-red-500 text-sm bg-red-50 p-2 rounded">{error}</p>}
        <input type="email" placeholder="Email" required className="w-full border p-3 rounded-lg" onChange={e => setEmail(e.target.value)} />
        <input type="password" placeholder="Password" required className="w-full border p-3 rounded-lg" onChange={e => setPassword(e.target.value)} />
        <button className="w-full bg-brand-600 hover:bg-brand-700 text-white p-3 rounded-lg font-medium transition">Sign In</button>
        <p className="text-center text-sm text-slate-600">New student? <Link to="/register" className="text-brand-600 font-medium">Register here</Link></p>
      </form>
    </div>
  )
}