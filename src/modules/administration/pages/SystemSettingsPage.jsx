import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { Settings, Upload, Image as ImageIcon, CheckCircle } from 'lucide-react'

export default function SystemSettingsPage() {
  const [allowReg, setAllowReg] = useState(true)
  const [bannerUrl, setBannerUrl] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [msg, setMsg] = useState('')

  const loadSettings = async () => {
    const { data } = await supabase.from('system_settings').select('allow_registration, banner_url').eq('id', 1).single()
    if (data) {
      setAllowReg(data.allow_registration)
      setBannerUrl(data.banner_url || '')
    }
  }

  useEffect(() => { loadSettings() }, [])

  const toggleRegistration = async () => {
    setSaving(true)
    const newVal = !allowReg
    await supabase.from('system_settings').update({ allow_registration: newVal }).eq('id', 1)
    setAllowReg(newVal)
    setSaving(false)
    setMsg('Settings saved!')
    setTimeout(() => setMsg(''), 3000)
  }

  const handleBannerUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    setMsg('')

    const fileName = `banner-${Math.random()}.${file.name.split('.').pop()}`
    const { error: uploadErr } = await supabase.storage.from('community-media').upload(fileName, file)
    
    if (uploadErr) {
      setMsg('Error uploading: ' + uploadErr.message)
      setUploading(false)
      return
    }

    const { data } = supabase.storage.from('community-media').getPublicUrl(fileName)
    const newUrl = data.publicUrl

    const { error: dbErr } = await supabase.from('system_settings').update({ banner_url: newUrl }).eq('id', 1)
    
    if (dbErr) {
      setMsg('Error saving URL: ' + dbErr.message)
    } else {
      setBannerUrl(newUrl)
      setMsg('Banner updated successfully!')
    }
    setUploading(false)
  }

  return (
    <div className="space-y-6 max-w-3xl mx-auto pb-10">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-200 text-slate-700 rounded-lg flex items-center justify-center"><Settings className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">System Settings</h1>
          <p className="text-sm text-slate-500">Global platform configurations.</p>
        </div>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-bold flex items-center gap-2 ${msg.includes('Error') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>
          {!msg.includes('Error') && <CheckCircle className="w-4 h-4" />} {msg}
        </div>
      )}

      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2"><ImageIcon className="w-5 h-5 text-brand-600" /> Platform Banner</h3>
        <p className="text-sm text-slate-500 mb-4">Upload an image to display across all dashboards (Admin, Student, Lecturer).</p>
        
        {bannerUrl && (
          <div className="mb-4 rounded-xl overflow-hidden border h-32 relative">
            <img src={bannerUrl} alt="Banner Preview" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white font-bold text-sm">Current Banner</div>
          </div>
        )}

        <label className="bg-brand-600 text-white px-6 py-2 rounded-xl cursor-pointer hover:bg-brand-700 flex items-center gap-2 font-medium w-fit">
          <Upload className="w-4 h-4" /> {uploading ? 'Uploading...' : 'Upload New Banner'}
          <input type="file" accept="image/*" onChange={handleBannerUpload} disabled={uploading} className="hidden" />
        </label>
      </div>

      <div className="bg-white p-6 rounded-2xl border shadow-sm flex items-center justify-between">
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