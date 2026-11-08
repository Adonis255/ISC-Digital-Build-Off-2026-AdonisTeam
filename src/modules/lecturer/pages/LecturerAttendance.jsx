import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import QRCode from 'react-qr-code'
import { MapPin, Play, Square, AlertTriangle, Monitor, RefreshCw, FileText } from 'lucide-react'

export default function LecturerAttendance() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState([])
  const [activeSession, setActiveSession] = useState(null)
  const [records, setRecords] = useState([])
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [sessionType, setSessionType] = useState('physical')
  
  const [sessionTopic, setSessionTopic] = useState('')
  const [files, setFiles] = useState([])

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from('courses').select('*').eq('lecturer_id', profile.id)
      setCourses(data || [])
      checkActiveSession()
    })()
  }, [profile])

  useEffect(() => {
    let pollInterval;
    let tokenInterval;

    if (activeSession) {
      loadRecords(activeSession.id)
      
      pollInterval = setInterval(() => {
        loadRecords(activeSession.id)
      }, 3000)

      tokenInterval = setInterval(async () => {
        const newToken = Math.random().toString(36).substring(2, 10).toUpperCase()
        setToken(newToken)
        await supabase.from('attendance_sessions').update({ current_token: newToken }).eq('id', activeSession.id)
      }, 300000)
    }

    return () => {
      clearInterval(pollInterval);
      clearInterval(tokenInterval);
    }
  }, [activeSession])

  const checkActiveSession = async () => {
    const { data } = await supabase.from('attendance_sessions').select('*').eq('lecturer_id', profile.id).eq('is_active', true).maybeSingle()
    if (data) {
      setActiveSession(data)
      setToken(data.current_token)
    }
  }

  const loadRecords = async (sessionId) => {
    const { data } = await supabase.from('attendance_records').select('*, profiles(full_name)').eq('session_id', sessionId).order('created_at', { ascending: false })
    setRecords(data || [])
  }

  const startSession = (courseId) => {
    setLoading(true)
    setErrorMsg('')
    
    if (sessionType === 'online') {
      createSession(courseId, null, null)
      return
    }

    navigator.geolocation.getCurrentPosition(async (pos) => {
      createSession(courseId, pos.coords.latitude, pos.coords.longitude)
    }, (err) => {
      setErrorMsg('Location access denied. You must allow location to verify you are in the classroom.')
      setLoading(false)
    }, { enableHighAccuracy: true })
  }

  const createSession = async (courseId, lat, lng) => {
    const newToken = Math.random().toString(36).substring(2, 10).toUpperCase()
    
    const uploadedUrls = []
    for (const file of files) {
      const fileName = `${Math.random()}-${file.name}`
      const { data, error } = await supabase.storage.from('class-materials').upload(fileName, file)
      if (!error) {
        const { data: { publicUrl } } = supabase.storage.from('class-materials').getPublicUrl(fileName)
        uploadedUrls.push({ name: file.name, url: publicUrl })
      }
    }

    const { data, error } = await supabase.from('attendance_sessions').insert([{
      course_id: courseId,
      lecturer_id: profile.id,
      current_token: newToken,
      venue_lat: lat,
      venue_lng: lng,
      radius_meters: 100,
      is_online: sessionType === 'online',
      topic: sessionTopic,
      resources: uploadedUrls
    }]).select()
    
    if (data && data[0]) {
      setActiveSession(data[0])
      setToken(newToken)
      setSessionTopic('')
      setFiles([])
    }
    setLoading(false)
  }

  const endSession = async () => {
    await supabase.from('attendance_sessions').update({ is_active: false }).eq('id', activeSession.id)
    setActiveSession(null)
    setRecords([])
  }

  if (!activeSession) {
    return (
      <div className="max-w-2xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold">Start Class</h1>
        
        {errorMsg && (
          <div className="bg-red-50 border-l-4 border-red-500 p-4 flex gap-3 text-red-700">
            <AlertTriangle className="w-5 h-5 shrink-0" />
            <p className="text-sm">{errorMsg}</p>
          </div>
        )}

        <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="flex gap-4 p-1 bg-slate-100 rounded-lg w-fit mb-4">
            <button onClick={() => setSessionType('physical')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${sessionType === 'physical' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}><MapPin className="w-4 h-4 inline mr-2" /> Physical</button>
            <button onClick={() => setSessionType('online')} className={`px-4 py-2 rounded-md text-sm font-medium transition ${sessionType === 'online' ? 'bg-white shadow-sm text-brand-600' : 'text-slate-500'}`}><Monitor className="w-4 h-4 inline mr-2" /> Online</button>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">Today's Notes / Topic Paragraph</label>
            <textarea 
              placeholder="Write a detailed description of today's class..." 
              value={sessionTopic} 
              onChange={(e) => setSessionTopic(e.target.value)} 
              rows="4"
              className="w-full border p-2 rounded-lg focus:ring-2 focus:ring-brand-500 outline-none resize-none"
            ></textarea>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Upload Notes / PDFs (Optional)</label>
            <input type="file" multiple onChange={(e) => setFiles(Array.from(e.target.files))} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-slate-100 file:text-slate-700" />
          </div>

          <p className="text-sm text-slate-500 pt-2">{sessionType === 'physical' ? 'GPS is required for students.' : 'No GPS required.'}</p>
          
          {courses.map(c => (
            <button key={c.id} onClick={() => startSession(c.id)} disabled={loading} className="w-full flex justify-between items-center p-4 border rounded-lg hover:border-brand-500 transition disabled:opacity-50">
              <div className="text-left"><p className="font-bold">{c.code} - {c.title}</p></div>
              <Play className="w-5 h-5 text-brand-600" />
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm flex flex-col justify-center space-y-4 lg:col-span-1">
        
        <div className="flex justify-center bg-white p-2 border-2 border-brand-600 rounded-xl mb-2 mx-auto">
          <QRCode value={token} size={180} />
        </div>

        <div className="text-center">
          <p className="text-sm text-slate-500 font-bold uppercase tracking-widest mb-1">Live Class Code</p>
          <p className="text-4xl font-mono font-bold tracking-widest text-navy-900">{token}</p>
        </div>
        
        {activeSession.topic && (
          <div className="p-3 bg-brand-50 rounded-lg">
            <p className="text-xs text-brand-600 font-bold uppercase mb-1">Topic / Notes</p>
            <p className="text-sm font-medium text-slate-800 whitespace-pre-wrap">{activeSession.topic}</p>
          </div>
        )}

        {activeSession.resources?.length > 0 && (
          <div>
            <p className="text-xs text-slate-500 font-bold uppercase mb-2">Attached Materials</p>
            {activeSession.resources.map((res, i) => (
              <a key={i} href={res.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:underline mb-1">
                <FileText className="w-4 h-4" /> {res.name}
              </a>
            ))}
          </div>
        )}

        <button onClick={endSession} className="mt-4 bg-red-600 text-white px-6 py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 w-full">
          <Square className="w-4 h-4" /> End Session
        </button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-2">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Live Check-ins ({records.filter(r => r.status === 'Present').length})</h2>
          <button onClick={() => loadRecords(activeSession.id)} className="text-brand-600 p-1 hover:bg-brand-50 rounded"><RefreshCw className="w-5 h-5" /></button>
        </div>
        
        <div className="space-y-2 max-h-[500px] overflow-y-auto">
          {records.map(r => (
            <div key={r.id} className={`p-3 rounded-lg flex justify-between items-center border ${r.status === 'Present' ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div>
                <span className={`font-medium ${r.status === 'Present' ? 'text-green-900' : 'text-red-900'}`}>{r.profiles?.full_name}</span>
                {r.status === 'Rejected' && <p className="text-xs text-red-600 font-medium">Failed: {Math.round(r.distance)}m away</p>}
              </div>
              <span className={`text-xs font-bold ${r.status === 'Present' ? 'text-green-700' : 'text-red-700'}`}>{new Date(r.created_at).toLocaleTimeString()}</span>
            </div>
          ))}
          {records.length === 0 && <p className="text-slate-500 text-sm text-center py-10 animate-pulse">Waiting for students...</p>}
        </div>
      </div>
    </div>
  )
}