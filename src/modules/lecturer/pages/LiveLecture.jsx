import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { useNavigate } from 'react-router-dom'
import { Square, RefreshCw, MessageSquare, Send, CheckCircle, AlertCircle, MapPin, FileText, Clock } from 'lucide-react'

export default function LiveLecture() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const [session, setSession] = useState(null)
  const [records, setRecords] = useState([])
  const [missingStudents, setMissingStudents] = useState([])
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  const [studentHistory, setStudentHistory] = useState({})
  
  const [newQuestion, setNewQuestion] = useState('')
  const [replyText, setReplyText] = useState({})
  const [asking, setAsking] = useState(false)

  useEffect(() => {
    if (!profile) return
    let interval
    const loadSession = async () => {
      const { data } = await supabase.from('lecture_sessions').select('*, courses(code, title)').eq('lecturer_id', profile.id).eq('is_active', true).maybeSingle()
      if (data) {
        setSession(data)
        loadRecords(data.id, data.course_id) 
        loadQuestions(data.id)
        interval = setInterval(() => {
          loadRecords(data.id, data.course_id)
          loadQuestions(data.id)
        }, 3000)
      } else {
        nav('/lecturer/classes')
      }
    }
    loadSession()
    return () => clearInterval(interval)
  }, [profile, nav])

  const loadRecords = async (id, courseId) => {
    // 1. Fetch current attendance for this session
    const { data: recs } = await supabase.from('lecture_attendance').select('*, profiles(full_name)').eq('session_id', id).order('created_at', { ascending: false })
    setRecords(recs || [])

    // 2. Fetch enrolled students
    const { data: enrollments } = await supabase.from('enrollments').select('profiles(id, full_name)').eq('course_id', courseId)
    const checkedInIds = recs?.map(r => r.student_id) || []
    const missing = enrollments?.map(e => e.profiles).filter(s => s && !checkedInIds.includes(s.id)) || []
    setMissingStudents(missing)

    // 3. Fetch Past Sessions to calculate total stats
    const { data: pastSessions } = await supabase.from('lecture_sessions').select('id').eq('course_id', courseId).eq('is_active', false)
    const pastSessionIds = pastSessions?.map(s => s.id) || []
    
    if (pastSessionIds.length > 0) {
      const { data: allAtt } = await supabase.from('lecture_attendance').select('student_id, status').in('session_id', pastSessionIds)
      
      const stats = {}
      enrollments?.forEach(e => {
        if (!e.profiles) return
        const sId = e.profiles.id
        const studentAtts = allAtt?.filter(a => a.student_id === sId) || []
        const presentCount = studentAtts.filter(a => a.status === 'Present' || a.status === 'Manual').length
        const missedCount = pastSessionIds.length - presentCount
        
        stats[sId] = { present: presentCount, missed: missedCount }
      })
      setStudentHistory(stats)
    }
  }

  const loadQuestions = async (id) => {
    const { data } = await supabase.from('lecture_questions').select('*, profiles(full_name)').eq('session_id', id).order('created_at', { ascending: true })
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

  const manualCheckIn = async (studentId) => {
    await supabase.from('lecture_attendance').insert([{ session_id: session.id, student_id: studentId, status: 'Manual' }])
    loadRecords(session.id, session.course_id)
  }

  const endSession = async () => {
    if(!window.confirm('End this lecture?')) return
    await supabase.from('lecture_sessions').update({ is_active: false }).eq('id', session.id)
    nav('/lecturer/classes')
  }

  const askQuestion = async () => {
    if (!newQuestion.trim()) return
    setAsking(true)
    await supabase.from('lecture_questions').insert([{ session_id: session.id, question_text: newQuestion, author_id: profile.id, author_role: 'lecturer' }])
    setNewQuestion('')
    setAsking(false)
    loadQuestions(session.id)
  }

  const submitReply = async (qId) => {
    const text = replyText[qId]
    if (!text) return
    await supabase.from('question_responses').insert([{ question_id: qId, student_id: profile.id, response_text: text }])
    setReplyText({ ...replyText, [qId]: '' })
    loadQuestions(session.id)
  }

  if (!session) return <p className="text-center py-10">Loading live session...</p>

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      
      {/* LEFT COL: Notes & Materials */}
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 lg:col-span-1">
        <h2 className="text-xl font-bold text-brand-700">{session.courses?.code}</h2>
        <p className="font-medium text-slate-800">{session.courses?.title}</p>
        
        <div className="p-3 bg-slate-50 rounded-lg border">
          <p className="text-xs font-bold text-slate-500 uppercase">Topic</p>
          <p className="text-sm font-medium">{session.topic}</p>
        </div>

        {/* DISPLAY NOTES */}
        {session.notes && (
          <div className="p-3 bg-slate-50 rounded-lg border">
            <p className="text-xs font-bold text-slate-500 uppercase mb-1">Class Notes</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap">{session.notes}</p>
          </div>
        )}

        {/* DISPLAY RESOURCES */}
        {session.resources?.length > 0 && (
          <div className="p-3 bg-slate-50 rounded-lg border">
            <p className="text-xs font-bold text-slate-500 uppercase mb-2">Attached Materials</p>
            {session.resources.map((r, i) => (
              <a key={i} href={r.url} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm text-brand-600 hover:underline mb-1">
                <FileText className="w-4 h-4" /> {r.name}
              </a>
            ))}
          </div>
        )}

        <button onClick={endSession} className="mt-4 bg-red-600 text-white w-full py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700 transition">
          <Square className="w-4 h-4" /> End Lecture
        </button>
      </div>

      {/* MIDDLE COL: Live Check-ins with Stats */}
      <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Present ({records.filter(r => r.status === 'Present' || r.status === 'Manual').length})</h2>
          <button onClick={() => loadRecords(session.id, session.course_id)} className="text-brand-600"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2 max-h-[250px] overflow-y-auto mb-6">
          {records.filter(r => r.status === 'Present' || r.status === 'Manual').map(r => {
            const stats = studentHistory[r.student_id] || { present: 0, missed: 0 }
            return (
              <div key={r.id} className="p-2 bg-green-50 border border-green-200 rounded text-sm flex justify-between items-center">
                <div>
                  <p className="font-medium">{r.profiles?.full_name || 'Unknown'}</p>
                  <p className="text-[10px] text-slate-500 font-bold">P: {stats.present} | M: {stats.missed}</p>
                </div>
                <span className="text-xs font-bold text-green-700 uppercase">{r.status}</span>
              </div>
            )
          })}
        </div>

        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-600"><AlertCircle className="w-5 h-5" /> Missing ({missingStudents.length})</h2>
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {missingStudents.map(s => {
            const stats = studentHistory[s.id] || { present: 0, missed: 0 }
            return (
              <div key={s.id} className="p-2 bg-red-50 border border-red-200 rounded text-sm flex justify-between items-center">
                <div>
                  <p className="font-medium">{s.full_name}</p>
                  <p className="text-[10px] text-slate-500 font-bold">P: {stats.present} | M: {stats.missed}</p>
                </div>
                <button onClick={() => manualCheckIn(s.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Mark Present</button>
              </div>
            )
          })}
        </div>
      </div>

      {/* RIGHT COL: Q&A */}
      <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-1 flex flex-col h-[calc(100vh-120px)]">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5" /> Class Q&A</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Ask a question..." value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="flex-1 border p-2 rounded-lg text-sm" />
          <button onClick={askQuestion} disabled={asking} className="bg-brand-600 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
        </div>
        <div className="space-y-4 overflow-y-auto flex-1 pr-2">
          {questions.map(q => (
            <div key={q.id} className="p-3 bg-slate-50 rounded-lg border">
              <p className="font-medium text-sm mb-2">{q.question_text}</p>
              <div className="space-y-2 mb-3">
                {responses[q.id]?.map(r => (
                  <div key={r.id} className="text-xs bg-white p-2 rounded border">
                    <span className="font-bold text-slate-700">{r.profiles?.full_name || 'User'}: </span>
                    <span className="text-slate-600">{r.response_text}</span>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input type="text" placeholder="Reply..." onChange={e => setReplyText({...replyText, [q.id]: e.target.value})} className="flex-1 border p-1.5 rounded text-xs" />
                <button onClick={() => submitReply(q.id)} className="bg-navy-900 text-white px-3 py-1.5 rounded text-xs">Reply</button>
              </div>
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}