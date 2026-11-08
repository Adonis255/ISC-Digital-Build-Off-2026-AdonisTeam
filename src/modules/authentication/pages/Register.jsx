import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { supabase } from '../../../services/supabase/client.js'

export default function Register() {
  const [form, setForm] = useState({ full_name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const handleRegister = async (e) => {
    e.preventDefault()
    if (!form.email.endsWith('@ueab.ac.ke')) return setError('Must use a @ueab.ac.ke email address.')
    const { error } = await supabase.auth.signUp({
      email: form.email, password: form.password,
      options: { data: { full_name: form.full_name } }
    })
    if (error) return setError(error.message)
    setSuccess(true)
  }

  return (
    <div className='min-h-screen grid place-items-center bg-slate-100 p-4'>
      <form onSubmit={handleRegister} className='bg-white p-8 rounded-2xl shadow-xl w-full max-w-md space-y-4'>
        <h2 className='text-2xl font-bold text-center'>Student Registration</h2>
        {error && <p className='text-red-500 text-sm bg-red-50 p-2 rounded'>{error}</p>}
        {success ? (
          <div className='text-center text-green-600 bg-green-50 p-4 rounded-lg'>
            <p className='font-bold'>Check your email!</p>
            <p className='text-sm'>Click the verification link to activate your account.</p>
            <Link to='/login' className='text-brand-600 block mt-4 text-sm font-medium'>Back to Login</Link>
          </div>
        ) : (
          <>
            <input type='text' placeholder='Full Name' required className='w-full border p-3 rounded-lg' onChange={e => setForm({...form, full_name: e.target.value})} />
            <input type='email' placeholder='Email (@ueab.ac.ke)' required className='w-full border p-3 rounded-lg' onChange={e => setForm({...form, email: e.target.value})} />
            <input type='password' placeholder='Password (min 8 chars)' required minLength={8} className='w-full border p-3 rounded-lg' onChange={e => setForm({...form, password: e.target.value})} />
            <button className='w-full bg-brand-600 text-white p-3 rounded-lg font-medium'>Create Account</button>
            <Link to='/login' className='block text-center text-sm text-brand-600'>Already have an account? Log in</Link>
          </>
        )}
      </form>
    </div>
  )
}
