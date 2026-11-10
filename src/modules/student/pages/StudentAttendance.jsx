import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { CheckCircle, ShieldAlert, MapPin, Monitor, FileText, RefreshCw, XCircle, Clock } from 'lucide-react'

export default function StudentAttendance() {
  const { profile } = useAuth()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('idle')
  const [distance, setDistance] = useState(null)
  const [liveDistance, setLiveDistance] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [gpsError, setGpsError] = useState('')
  
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [newQuestion, setNewQuestion] = useState('')
  const [replyText, setReplyText] = useState({})
  
  // History State (Grouped by Unit)
  const [courseStats, setCourseStats] = useState([])

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

  const checkLocation = useCallback(() => {
    if (!session) return
    setIsLocating(true)
    setGpsError('')

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, session.venue_lat, session.venue_lng)
        setLiveDistance(d)
        setIsLocating(false)
      },
      (err) => {
        setGpsError('Could not get location. Please ensure GPS is on.')
        setIsLocating(false)
      },
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10000 }
    )
  }, [session])

  const loadAttendanceData = useCallback(async () => {
    if (!profile) return
    
    // 1. Get enrolled courses
    const { data: enrollments } = await supabase.from('enrollments').select('course_id, courses(code, title)').eq('student_id', profile.id)
    const courseIds = enrollments?.map(e => e.course_id) || []
    if (courseIds.length === 0) return

    // 2. Get active session
    const { data: s } = await supabase.from('lecture_sessions').select('*, courses(*)').in('course_id', courseIds).eq('is_active', true).maybeSingle()
    setSession(s || null)

    if (s) {
      const { data: rec } = await supabase.from('lecture_attendance').select('*').eq('session_id', s.id).eq('student_id', profile.id).maybeSingle()
      if (rec) setStatus(rec.status === 'Present' || rec.status === 'Manual' ? 'present' : 'too_far')
      
      const { data: q } = await supabase.from('lecture_questions').select('*, profiles(full_name)').eq('session_id', s.id).order('created_at', { ascending: true })
      setQuestions(q || [])
      if (q && q.length > 0) {
        const qIds = q.map(x => x.id)
        const { data: res } = await supabase.from('question_responses').select('*, profiles(full_name)').in('question_id', qIds).order('created_at', { ascending: true })
        const grouped = {}
        res?.forEach(r => {
          if (!grouped[r.question_id]) grouped[r.question_id] = []
          grouped[r.question_id].push(r)
        })
        setResponses(grouped)
      }
    }

    // 3. Calculate Grouped Stats (Per Course)
    const { data: pastSessions } = await supabase.from('lecture_sessions').select('id, course_id').in('course_id', courseIds).eq('is_active', false)
    const { data: myRecords } = await supabase.from('lecture_attendance').select('session_id, status').eq('student_id', profile.id)

    if (enrollments && pastSessions && myRecords) {
      const statsMap = {}
      
      // Initialize map for all enrolled courses
      enrollments.forEach(e => {
        statsMap[e.course_id] = { code: e.courses.code, title: e.courses.title, present: 0, missed: 0 }
      })

      // Tally up sessions
      pastSessions.forEach(ps => {
        const record = myRecords.find(r => r.session_id === ps.id)
        if (statsMap[ps.course_id]) {
          if (record && (record.status === 'Present' || record.status === 'Manual')) {
            statsMap[ps.course_id].present += 1
          } else {
            statsMap[ps.course_id].missed += 1
          }
        }
      })

      setCourseStats(Object.values(statsMap))
    }
  }, [profile])

  useEffect(() => {
    loadAttendanceData()

    if (!profile) return
    const channel = supabase.channel('attendance-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'lecture_sessions' }, () => {
        loadAttendanceData()
      })
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [profile, loadAttendanceData])

  useEffect(() => {
    if (!session || status === 'present') return
    checkLocation()
    const trackInterval = setInterval(checkLocation, 10000)
    return () => clearInterval(trackInterval)
  }, [session?.id, status, checkLocation])

  const verifyAttendance = () => {
    setStatus('verifying')
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const d = calculateDistance(pos.coords.latitude, pos.coords.longitude, session.venue_lat, session.venue_lng)
        setDistance(d)
        const deviceId = getDeviceId()

        if (d > session.radius_meters) {
          setStatus('too_far')
          await supabase.from('lecture_attendance').insert([{ session_id: session.id, student_id: profile.id, distance: d, status: 'Rejected', device_id: deviceId }])
        } else {
          const { error } = await supabase.from('lecture_attendance').insert([{ session_id: session.id, student_id: profile.id, distance: d, status: 'Present', device_id: deviceId }])
          if (error) { alert(error.message); setStatus('idle') } 
          else { setStatus('present'); loadAttendanceData(); }
        }
      }, 
      () => setStatus('idle'),
      { enableHighAccuracy: true, maximumAge: 0 }
    )
  }

  const askQuestion = async () => {
    if (!newQuestion.trim()) return
    await supabase.from('lecture_questions').insert([{ session_id: session.id, question_text: newQuestion, author_id: profile.id, author_role: 'student' }])
    setNewQuestion('')
  }

  const submitReply = async (qId) => {
    const text = replyText[qId]
    if (!text) return
    await supabase.from('question_responses').insert([{ question_id: qId, student_id: profile.id, response_text: text }])
    setReplyText({ ...replyText, [qId]: '' })
  }

  const isFar = liveDistance !== null && liveDistance > session?.radius_meters;

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      
      {/* ACTIVE CLASS UI */}
      {session ? (
        <div className="bg-white p-6 rounded-xl border-2 border-brand-500 shadow-md">
          <div className="flex items-center gap-2 mb-4">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            <h2 className="text-xl font-bold text-slate-800">Active Class: {session.courses?.code}</h2>
          </div>
          <p className="text-sm text-slate-500 mb-6">Topic: {session.topic}</p>

          {status === 'idle' && (
            <div className="space-y-4">
              {isLocating && !liveDistance ? (
                <p className="text-center text-brand-600 font-medium animate-pulse">Acquiring GPS satellite signal...</p>
              ) : gpsError ? (
                <div className="p-4 rounded-lg text-center bg-red-50 border border-red-200">
                  <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
                  <p className="text-red-700 font-bold">{gpsError}</p>
                  <button onClick={checkLocation} className="mt-3 text-sm font-bold text-red-700 underline">Try Again</button>
                </div>
              ) : liveDistance !== null ? (
                <div className={`p-4 rounded-lg text-center border ${isFar ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                  {isFar ? (
                    <>
                      <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
                      <p className="text-red-700 font-bold">You are {Math.round(liveDistance)}m away.</p>
                      <p className="text-sm text-red-600">Please go near the lecture hall to verify.</p>
                      <button onClick={checkLocation} className="mt-3 flex items-center justify-center gap-1 text-sm font-bold text-red-700 bg-red-100 px-3 py-1.5 rounded-lg w-full hover:bg-red-200">
                        <RefreshCw className="w-4 h-4" /> Refresh Location
                      </button>
                    </>
                  ) : (
                    <>
                      <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
                      <p className="text-green-700 font-bold">You are {Math.round(liveDistance)}m away.</p>
                      <p className="text-sm text-green-600">You are near the lecture hall. You can verify now.</p>
                    </>
                  )}
                </div>
              ) : null}
              
              <button 
                onClick={verifyAttendance} 
                disabled={isFar || liveDistance === null || isLocating}
                className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-brand-700 disabled:opacity-50 transition"
              >
                {isLocating ? 'Locating...' : isFar ? 'Too far to verify' : 'Verify My Attendance'}
              </button>
            </div>
          )}

          {status === 'verifying' && <p className="text-brand-600 font-medium animate-pulse text-center">Confirming GPS location...</p>}
          
          {status === 'too_far' && (
            <div className="bg-red-50 p-4 rounded-lg text-center border border-red-200">
              <ShieldAlert className="w-8 h-8 text-red-500 mx-auto mb-2" />
              <p className="text-red-700 font-bold">Attendance Rejected.</p>
              <p className="text-sm text-red-600">You were too far ({Math.round(distance)}m away).</p>
              <button onClick={() => { setStatus('idle'); checkLocation(); }} className="mt-3 text-sm font-bold text-red-700 underline">Try Again</button>
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
      ) : (
        <div className="bg-white p-6 rounded-xl border text-center py-10">
          <Clock className="w-10 h-10 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">No active classes right now.</p>
          <p className="text-sm text-slate-400 mt-1">This page will update automatically when a lecturer starts a class.</p>
        </div>
      )}

      {/* GROUPED COURSE STATS */}
      <div className="mt-8">
        <h2 className="text-xl font-bold text-slate-800 mb-4 flex items-center gap-2"><Clock className="w-5 h-5" /> My Attendance History</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courseStats.map(stat => (
            <div key={stat.code} className="bg-white rounded-2xl border shadow-sm p-5 flex flex-col justify-between">
              <div>
                <h3 className="font-bold text-lg text-slate-800">{stat.code}</h3>
                <p className="text-sm text-slate-500 truncate">{stat.title}</p>
              </div>
              <div className="flex gap-4 mt-4 pt-4 border-t">
                <div className="flex-1 bg-green-50 rounded-xl p-3 text-center border border-green-100">
                  <p className="text-2xl font-bold text-green-600">{stat.present}</p>
                  <p className="text-xs font-bold text-green-700 uppercase">Present</p>
                </div>
                <div className="flex-1 bg-red-50 rounded-xl p-3 text-center border border-red-100">
                  <p className="text-2xl font-bold text-red-600">{stat.missed}</p>
                  <p className="text-xs font-bold text-red-700 uppercase">Missed</p>
                </div>
              </div>
            </div>
          ))}
          {courseStats.length === 0 && <p className="text-slate-500 col-span-2 text-center py-6">No attendance history found.</p>}
        </div>
      </div>

    </div>
  )
}