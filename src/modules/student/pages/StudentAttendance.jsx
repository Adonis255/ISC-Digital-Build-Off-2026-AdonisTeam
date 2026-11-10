import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { CheckCircle, ShieldAlert, MapPin, PlayCircle, XCircle, Clock, Monitor, FileText } from 'lucide-react'

export default function StudentAttendance() {
  const { profile } = useAuth()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('idle') // idle, verifying, present, too_far, left
  const [distance, setDistance] = useState(null)
  const [liveDistance, setLiveDistance] = useState(null)
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  
  const [newQuestion, setNewQuestion] = useState('')
  const [replyText, setReplyText] = useState({})

  const getDeviceId = () => {
    let id = localStorage.getItem('bh_device_id')
    if (!id) {
      id = 'dev-' + Math.random().toString(36).substring(2, 15)
      localStorage.setItem('bh_device_id', id)
    }
    return id
  }

  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; const p1 = lat1 * Math.PI/180; const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180; const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1)*Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  }

  // 1. Poll for Active Session & Questions
  useEffect(() => {
    if (!profile) return
    let interval = setInterval(async () => {
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', profile.id)
      const courseIds = enrollments?.map(e => e.course_id) || []
      if (courseIds.length === 0) return

      const { data: s } = await supabase.from('lecture_sessions').select('*, courses(*)').in('course_id', courseIds).eq('is_active', true).maybeSingle()
      
      if (s) {
        setSession(s)
        const { data: rec } = await supabase.from('lecture_attendance').select('*').eq('session_id', s.id).eq('student_id', profile.id).maybeSingle()
        if (rec) setStatus(rec.status === 'Present' || rec.status === 'Manual' ? 'present' : 'too_far')
        loadQuestions(s.id)
      } else {
        setSession(null)
        setStatus('idle')
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [profile])

  // 2. LIVE Distance Checker (Only runs if session is active and student hasn't verified yet)
  useEffect(() => {
    if (!session || status === 'present') return

    const checkLiveDistance = () => {
      navigator.geolocation.getCurrentPosition((pos) => {
        const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, session.venue_lat, session.venue_lng)
        setLiveDistance(d)
      })
    }

    checkLiveDistance() // check immediately
    const trackInterval = setInterval(checkLiveDistance, 5000) // check every 5 seconds
    return () => clearInterval(trackInterval)
  }, [session, status])

  const loadQuestions = async (sessionId) => {
    const { data } = await supabase.from('lecture_questions').select('*, profiles(full_name)').eq('session_id', sessionId).order('created_at', { ascending: true })
    setQuestions(data || [])
    if (data && data.length > 0) {
      const qIds = data.map(q => q.id)
      const { data: res } = await supabase.from('question_responses').select('*, profiles(full_name)').in('question_id', qIds).order('created_at', { ascending: true })
      const grouped = {}
      res?.forEach(r => {
        if (!grouped[r.question_id]) grouped[r.question_id] = []
        grouped[r.question_id].push(r)
      })
      setResponses(grouped)
    }
  }

  const verifyAttendance = () => {
    setStatus('verifying')
    navigator.geolocation.getCurrentPosition(async (pos) => {
      const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, session.venue_lat, session.venue_lng)
      setDistance(d)
      const deviceId = getDeviceId()

      if (d > session.radius_meters) {
        setStatus('too_far')
        await supabase.from('lecture_attendance').insert([{ session_id: session.id, student_id: profile.id, distance: d, status: 'Rejected', device_id: deviceId }])
      } else {
        const { error } = await supabase.from('lecture_attendance').insert([{ session_id: session.id, student_id: profile.id, distance: d, status: 'Present', device_id: deviceId }])
        if (error) {
          alert(error.message) 
          setStatus('idle')
        } else {
          setStatus('present')
        }
      }
    }, () => setStatus('idle'))
  }

  const askQuestion = async () => {
    if (!newQuestion.trim()) return
    await supabase.from('lecture_questions').insert([{ session_id: session.id, question_text: newQuestion, author_id: profile.id, author_role: 'student' }])
    setNewQuestion('')
    loadQuestions(session.id)
  }

  const submitReply = async (qId) => {
    const text = replyText[qId]
    if (!text) return
    await supabase.from('question_responses').insert([{ question_id: qId, student_id: profile.id, response_text: text }])
    setReplyText({ ...replyText, [qId]: '' })
    loadQuestions(session.id)
  }

  if (!session) return <div className="text-center py-10"><p className="text-slate-500">No active classes right now.</p></div>

  // Determine UI state based on live distance
  const isFar = liveDistance !== null && liveDistance > session.radius_meters;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <div className="bg-white p-6 rounded-xl border-2 border-brand-500 shadow-md">
        <h2 className="text-xl font-bold mb-1">{session.courses?.code} - {session.courses?.title}</h2>
        <p className="text-sm text-slate-500 mb-6">Topic: {session.topic}</p>

        {status === 'idle' && (
          <div className="space-y-4">
            {liveDistance !== null ? (
              <div className={`p-4 rounded-lg text-center border ${isFar ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                {isFar ? (
                  <>
                    <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
                    <p className="text-red-700 font-bold">You are {Math.round(liveDistance)}m away.</p>
                    <p className="text-sm text-red-600">Please go near the lecture hall to verify.</p>
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <p className="text-green-700 font-bold">You are {Math.round(liveDistance)}m away.</p>
                    <p className="text-sm text-green-600">You are near the lecture hall. You can verify now.</p>
                  </>
                )}
              </div>
            ) : (
              <p className="text-center text-slate-500 animate-pulse">Locating your position...</p>
            )}
            
            <button 
              onClick={verifyAttendance} 
              disabled={isFar || liveDistance === null}
              className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-brand-700 disabled:opacity-50 transition"
            >
              {isFar ? 'Too far to verify' : 'Verify My Attendance'}
            </button>
          </div>
        )}

        {status === 'verifying' && <p className="text-brand-600 font-medium animate-pulse text-center">Confirming GPS location...</p>}
        
        {status === 'too_far' && (
          <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
            <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
            <p className="text-red-700 font-bold">Attendance Rejected.</p>
            <p className="text-sm text-red-600">You were too far ({Math.round(distance)}m away).</p>
            <button onClick={() => setStatus('idle')} className="mt-3 text-sm font-bold text-red-700 underline">Try Again</button>
          </div>
        )}

        {status === 'present' && (
          <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-green-700 font-bold">Present in class!</p>
            <p className="text-sm text-green-600">Your attendance has been recorded.</p>
          </div>
        )}

        {(session.notes || session.resources?.length > 0) && (
          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-bold mb-3">Class Notes & Materials</h3>
            {session.notes && <p className="text-sm text-slate-700 whitespace-pre-wrap mb-4">{session.notes}</p>}
            {session.resources?.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:underline mb-2">
                <FileText className="w-4 h-4" /> {r.name}
              </a>
            ))}
          </div>
        )}

        <div className="mt-6 pt-6 border-t border-slate-200">
          <h3 className="font-bold mb-3 flex items-center gap-2"><Monitor className="w-5 h-5" /> Class Discussion</h3>
          <div className="flex gap-2 mb-4">
            <input type="text" placeholder="Ask a question..." value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="flex-1 border p-2 rounded-lg text-sm" />
            <button onClick={askQuestion} className="bg-brand-600 text-white px-4 py-2 rounded-lg">Ask</button>
          </div>
          <div className="space-y-3">
            {questions.map(q => (
              <div key={q.id} className="p-3 bg-slate-50 rounded-lg border text-sm">
                <p className="font-medium mb-2">{q.question_text}</p>
                {responses[q.id]?.map(r => (
                  <p key={r.id} className="text-xs text-slate-600 mb-1"><strong className="text-slate-800">{r.profiles?.full_name}:</strong> {r.response_text}</p>
                ))}
                <div className="flex gap-2 mt-2">
                  <input type="text" placeholder="Reply..." onChange={e => setReplyText({...replyText, [q.id]: e.target.value})} className="flex-1 border p-1 rounded text-xs" />
                  <button onClick={() => submitReply(q.id)} className="bg-navy-900 text-white px-3 py-1 rounded text-xs">Send</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}