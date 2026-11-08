import { useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Camera } from 'lucide-react'

export default function ProfilePage() {
  const { profile, refreshProfile } = useAuth()
  const [fullName, setFullName] = useState(profile?.full_name || '')
  const [phone, setPhone] = useState(profile?.phone || '')
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const handleUpdate = async (e) => {
    e.preventDefault()
    setMsg('Saving...')
    const { error } = await supabase.from('profiles').update({ full_name: fullName, phone }).eq('id', profile.id)
    if (error) setMsg(error.message)
    else {
      setMsg('Profile updated!')
      if (refreshProfile) refreshProfile()
    }
  }

  const uploadAvatar = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fileName = `${profile.id}-${Math.random()}.${file.name.split('.').pop()}`
    await supabase.storage.from('avatars').upload(fileName, file)
    const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName)
    await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', profile.id)
    setUploading(false)
    if (refreshProfile) refreshProfile()
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">My Profile</h1>
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
        <div className="flex items-center gap-6">
          <div className="relative">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="Avatar" className="w-24 h-24 rounded-full object-cover border-4 border-slate-100" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-brand-600 text-white flex items-center justify-center text-3xl font-bold border-4 border-slate-100">
                {profile?.full_name?.charAt(0) || 'U'}
              </div>
            )}
            <label className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow border cursor-pointer hover:bg-slate-50">
              <Camera className="w-4 h-4 text-slate-600" />
              <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} disabled={uploading} />
            </label>
          </div>
          <div>
            <h2 className="text-xl font-bold">{profile?.full_name}</h2>
            <p className="text-slate-500">{profile?.email}</p>
            <span className="inline-block mt-2 px-2 py-1 bg-slate-100 rounded text-xs uppercase font-bold">{profile?.role}</span>
          </div>
        </div>

        <form onSubmit={handleUpdate} className="space-y-4 border-t pt-6">
          <div>
            <label className="block text-sm font-medium mb-1">Full Name</label>
            <input value={fullName} onChange={e => setFullName(e.target.value)} className="w-full border p-2 rounded" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Phone Number</label>
            <input value={phone} onChange={e => setPhone(e.target.value)} className="w-full border p-2 rounded" placeholder="+254..." />
          </div>
          {msg && <p className="text-sm text-brand-600 font-medium">{msg}</p>}
          <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-lg">Save Changes</button>
        </form>
      </div>
    </div>
  )
}