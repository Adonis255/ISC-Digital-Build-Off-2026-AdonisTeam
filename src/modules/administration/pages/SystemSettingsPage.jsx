import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Settings } from 'lucide-react'

export default function SystemSettingsPage() {
  const [allowReg, setAllowReg] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('system_settings').select('allow_registration').eq('id', 1).single()
      if (data) setAllowReg(data.allow_registration)
    })()
  }, [])

  const toggleRegistration = async () => {
    setSaving(true)
    const newVal = !allowReg
    await supabase.from('system_settings').update({ allow_registration: newVal }).eq('id', 1)
    setAllowReg(newVal)
    setSaving(false)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center"><Settings className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-slate-500">Global platform configurations.</p>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800">Allow Student Registration</h3>
          <p className="text-sm text-slate-500">If disabled, new students cannot create accounts via the registration page.</p>
        </div>
        <button 
          onClick={toggleRegistration} 
          disabled={saving}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${allowReg ? 'bg-brand-600' : 'bg-slate-300'}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${allowReg ? 'translate-x-6' : 'translate-x-1'}`} />
        </button>
      </div>
    </div>
  )
}