import { useState, useEffect } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { CheckCircle, FileText, MessageSquare, ShieldAlert, Send, XCircle } from 'lucide-react'

export default function StudentAttendance() {
  const { profile } = useAuth()
  const [session, setSession] = useState(null)
  const [status, setStatus] = useState('idle')
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [pastSessions, setPastSessions] = useState([])
  
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

  useEffect(() => {
    if (!profile) return
    let interval = setInterval(async () => {
      const { data: enrollments } = await supabase.from('enrollments').select('course_id').eq('student_id', profile.id)
      const courseIds = enrollments?.map(e => e.course_id) || []
      if (courseIds.length === 0) return

      const { data: s } = await supabase.from('lecture_sessions').select('*, courses(*)').in('course_id', courseIds).eq('is_active', true).limit(1)
      
      if (s && s.length > 0) {
        const sessionData = s[0]
        setSession(sessionData)
        const { data: rec } = await supabase.from('lecture_attendance').select('*').eq('session_id', sessionData.id).eq('student_id', profile.id).maybeSingle()
        if (rec) setStatus('present')
        loadQuestions(sessionData.id)
      } else {
        setSession(null)
        setStatus('idle')
      }

      const { data: past } = await supabase.from('lecture_sessions').select('*, courses(code, title)').in('course_id', courseIds).eq('is_active', false).order('created_at', { ascending: false })
      const { data: myRecords } = await supabase.from('lecture_attendance').select('*').eq('student_id', profile.id)
      
      if (past) {
        setPastSessions(past.map(p => ({ ...p, record: myRecords?.find(r => r.session_id === p.id) })))
      }
    }, 3000)
    return () => clearInterval(interval)
  }, [profile])

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
      const deviceId = getDeviceId()
      const { error } = await supabase.from('lecture_attendance').insert([{ session_id: session.id, student_id: profile.id, status: 'Present', device_id: deviceId }])
      if (error) {
        alert(error.message) 
        setStatus('idle')
      } else {
        setStatus('present')
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

  return (
    <div className="max-w-2xl mx-auto space-y-6 pb-20">
      <h1 className="text-2xl font-bold">My Attendance</h1>

      {session ? (
        <div className="bg-white p-6 rounded-xl border-2 border-brand-500 shadow-md">
          <h2 className="text-xl font-bold mb-1">{session.courses?.code} - {session.courses?.title}</h2>
          <p className="text-sm text-slate-500 mb-6">Topic: {session.topic}</p>

          {status === 'idle' && <button onClick={verifyAttendance} className="w-full bg-brand-600 text-white py-3 rounded-lg font-bold text-lg hover:bg-brand-700">Verify My Attendance</button>}
          {status === 'verifying' && <p className="text-brand-600 font-medium animate-pulse text-center">Checking GPS...</p>}
          {status === 'present' && (
            <div className="bg-green-50 p-4 rounded-lg text-center border border-green-200">
              <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <p className="text-green-700 font-bold">Present in class!</p>
            </div>
          )}

          <div className="mt-6 pt-6 border-t border-slate-200">
            <h3 className="font-bold mb-3 flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Class Discussion</h3>
            <div className="flex gap-2 mb-4">
              <input type="text" placeholder="Ask a question..." value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="flex-1 border p-2 rounded-lg text-sm" />
              <button onClick={askQuestion} className="bg-brand-600 text-white px-4 py-2 rounded-lg"><Send className="w-4 h-4" /></button>
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
          <p className="text-slate-500">No active classes right now.</p>
        </div>
      )}

      <div className="pt-6">
        <h2 className="text-lg font-bold mb-4">Lecture History</h2>
        <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">Course</th><th className="p-3">Status</th></tr>
            </thead>
            <tbody>
              {pastSessions.map(s => (
                <tr key={s.id} className="border-b">
                  <td className="p-3 font-medium">{s.courses?.code}</td>
                  <td className="p-3">
                    {s.record?.status === 'Present' || s.record?.status === 'Manual' ? (
                      <span className="text-green-600 font-bold text-xs flex items-center gap-1"><CheckCircle className="w-3 h-3" /> {s.record.status}</span>
                    ) : (
                      <span className="text-red-600 font-bold text-xs flex items-center gap-1"><XCircle className="w-3 h-3" /> Missed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}