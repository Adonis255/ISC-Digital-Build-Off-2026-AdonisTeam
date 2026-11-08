import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { Bell, Mail } from 'lucide-react'

export default function PreferencesPage() {
  const { profile } = useAuth()
  const [inApp, setInApp] = useState(true)
  const [email, setEmail] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  useEffect(() => {
    if (profile) {
      setInApp(profile.pref_in_app ?? true)
      setEmail(profile.pref_email ?? false)
    }
  }, [profile])

  const savePrefs = async () => {
    setSaving(true)
    setMsg('')
    const { error } = await supabase.from('profiles').update({ pref_in_app: inApp, pref_email: email }).eq('id', profile.id)
    setSaving(false)
    if (error) setMsg('Error saving: ' + error.message)
    else setMsg('Preferences saved successfully!')
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold">Notification Preferences</h1>
        <p className="text-sm text-slate-500">Manage how you want to be alerted.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bell className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-bold text-slate-800">In-App Notifications</h3>
              <p className="text-sm text-slate-500">Receive alerts inside BaratonHub (Bell icon).</p>
            </div>
          </div>
          <input type="checkbox" checked={inApp} onChange={e => setInApp(e.target.checked)} className="w-5 h-5 accent-brand-600 cursor-pointer" />
        </div>

        <div className="flex items-center justify-between border-t pt-6">
          <div className="flex items-center gap-3">
            <Mail className="w-5 h-5 text-brand-600" />
            <div>
              <h3 className="font-bold text-slate-800">Email Notifications</h3>
              <p className="text-sm text-slate-500">Receive important updates via your university email.</p>
            </div>
          </div>
          <input type="checkbox" checked={email} onChange={e => setEmail(e.target.checked)} className="w-5 h-5 accent-brand-600 cursor-pointer" />
        </div>

        {msg && <p className="text-sm text-brand-600 font-medium">{msg}</p>}
        <button onClick={savePrefs} disabled={saving} className="bg-navy-900 text-white px-6 py-2 rounded-lg font-medium disabled:opacity-50">
          {saving ? 'Saving...' : 'Save Preferences'}
        </button>
      </div>
    </div>
  )
}