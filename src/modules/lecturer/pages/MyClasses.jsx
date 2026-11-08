import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { useNavigate } from 'react-router-dom'
import { Play, AlertTriangle } from 'lucide-react'

export default function MyClasses() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const [courses, setCourses] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [step, setStep] = useState(1)
  
  const [topic, setTopic] = useState('')
  const [notes, setNotes] = useState('')
  const [files, setFiles] = useState([])
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (!profile) return
    (async () => {
      const { data } = await supabase.from('courses').select('*').eq('lecturer_id', profile.id)
      setCourses(data || [])
    })()
  }, [profile])

  const handleStart = async (e) => {
    if (e) e.preventDefault()
    setLoading(true)
    setErrorMsg('')
    
    try {
      const uploadedUrls = []
      for (const file of files) {
        const fileName = `${Math.random()}-${file.name}`
        const { error } = await supabase.storage.from('class-materials').upload(fileName, file)
        if (!error) {
          const { data: { publicUrl } } = supabase.storage.from('class-materials').getPublicUrl(fileName)
          uploadedUrls.push({ name: file.name, url: publicUrl })
        }
      }

      navigator.geolocation.getCurrentPosition(
        async (pos) => { await createSession(pos.coords.latitude, pos.coords.longitude, uploadedUrls) }, 
        async (err) => { await createSession(-0.2833, 35.2833, uploadedUrls) }
      )
    } catch (err) {
      setErrorMsg('Error: ' + err.message)
      setLoading(false)
    }
  }

  const createSession = async (lat, lng, uploadedUrls) => {
    try {
      // End any previous active sessions to prevent database conflicts
      await supabase.from('lecture_sessions').update({ is_active: false }).eq('lecturer_id', profile.id).eq('is_active', true)

      const { data, error } = await supabase.from('lecture_sessions').insert([{
        course_id: selectedCourse.id,
        lecturer_id: profile.id,
        current_token: 'ACTIVE',
        venue_lat: lat,
        venue_lng: lng,
        radius_meters: 100,
        is_online: false,
        topic: topic,
        notes: notes,
        resources: uploadedUrls,
        is_active: true
      }]).select()

      if (error) {
        setErrorMsg('Database Error: ' + error.message)
        setLoading(false)
        return
      }

      if (data && data[0]) {
        nav('/lecturer/live-lecture')
      }
    } catch (err) {
      setErrorMsg('Network Error: ' + err.message)
      setLoading(false)
    }
  }

  if (!profile) return <p className="p-8">Loading...</p>

  if (selectedCourse) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Prepare: {selectedCourse.code}</h1>
          <button type="button" onClick={() => {setSelectedCourse(null); setStep(1)}} className="text-slate-500 hover:underline">Cancel</button>
        </div>

        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" /><p className="text-sm">{errorMsg}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border shadow-sm">
          {step === 1 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Step 1: Topic</h2>
              <input required placeholder="Main Topic" value={topic} onChange={e => setTopic(e.target.value)} className="w-full border p-2 rounded" />
              <textarea required placeholder="Notes..." value={notes} onChange={e => setNotes(e.target.value)} rows="5" className="w-full border p-2 rounded"></textarea>
              <button type="button" onClick={() => setStep(2)} disabled={!topic || !notes} className="bg-brand-600 text-white px-6 py-2 rounded-lg disabled:opacity-50">Next</button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold border-b pb-2">Step 2: Materials</h2>
              <input type="file" multiple onChange={e => setFiles(Array.from(e.target.files))} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-brand-50 file:text-brand-700" />
              <div className="flex gap-2">
                <button type="button" onClick={() => setStep(1)} className="bg-slate-200 text-slate-800 px-6 py-2 rounded-lg">Back</button>
                <button type="button" onClick={handleStart} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2 disabled:opacity-50">
                  <Play className="w-4 h-4" /> {loading ? 'Starting...' : 'Start Lecture Now'}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">My Classes</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-xl border shadow-sm flex flex-col">
            <h3 className="font-bold text-lg text-brand-700">{c.code}</h3>
            <p className="text-slate-800 font-medium">{c.title}</p>
            <p className="text-sm text-slate-500 mt-1">{c.department} • {c.time_slot}</p>
            <button type="button" onClick={() => setSelectedCourse(c)} className="mt-6 w-full bg-navy-900 text-white py-2 rounded-lg font-medium hover:bg-navy-800">Start Lecture</button>
          </div>
        ))}
      </div>
    </div>
  )
}