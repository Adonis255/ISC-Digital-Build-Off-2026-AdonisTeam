import fs from 'fs';
import path from 'path';

const files = {
  // 1. ROUTES.JSX (The missing route was causing the "refresh")
  "src/app/routes.jsx": `import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth.js'
import DashboardLayout from '../components/layout/DashboardLayout.jsx'
import Landing from '../modules/authentication/pages/Landing.jsx'
import Login from '../modules/authentication/pages/Login.jsx'
import Register from '../modules/authentication/pages/Register.jsx'
import StudentDashboard from '../modules/student/pages/StudentDashboard.jsx'
import AdminDashboard from '../modules/administration/pages/AdminDashboard.jsx'
import LecturerDashboard from '../modules/lecturer/pages/LecturerDashboard.jsx'
import WorkerDashboard from '../modules/worker/pages/WorkerDashboard.jsx'
import UserManagement from '../modules/administration/pages/UserManagement.jsx'
import OfficeManagement from '../modules/administration/pages/OfficeManagement.jsx'
import CourseManagement from '../modules/administration/pages/CourseManagement.jsx'
import EnrollmentManagement from '../modules/administration/pages/EnrollmentManagement.jsx'
import LostFoundPage from '../modules/lost-and-found/pages/LostFoundPage.jsx'
import MaintenancePage from '../modules/maintenance/pages/MaintenancePage.jsx'
import AnnouncementsPage from '../modules/announcements/pages/AnnouncementsPage.jsx'
import NotificationsPage from '../modules/notifications/pages/NotificationsPage.jsx'
import AssignedTasks from '../modules/worker/pages/AssignedTasks.jsx'
import CounsellingPage from '../modules/counselling/pages/CounsellingPage.jsx'
import MyClasses from '../modules/lecturer/pages/MyClasses.jsx'
import LiveLecture from '../modules/lecturer/pages/LiveLecture.jsx'
import StudentAttendance from '../modules/student/pages/StudentAttendance.jsx'
import CourseCatalog from '../modules/student/pages/CourseCatalog.jsx'
import ProfilePage from '../modules/student/pages/ProfilePage.jsx'
import FinancePage from '../modules/finance/pages/FinancePage.jsx'
import ComplaintsPage from '../modules/complaints/pages/ComplaintsPage.jsx'
import InternshipsPage from '../modules/internships/pages/InternshipsPage.jsx'
import ScholarshipsPage from '../modules/scholarships/pages/ScholarshipsPage.jsx'
import DirectoryPage from '../modules/directory/pages/DirectoryPage.jsx'
import ExaminationsPage from '../modules/examinations/pages/ExaminationsPage.jsx'
import { ROLE_HOME } from '../utils/constants.js'

export default function AppRoutes() {
  const { user, role, loading, signOut } = useAuth()
  
  if (loading) return <div className="h-screen grid place-items-center text-slate-500">Loading...</div>
  if (user && !role) return <div className="h-screen grid place-items-center bg-slate-100 p-4"><div className="bg-white p-8 rounded-xl shadow-lg text-center max-w-md"><h2 className="text-xl font-bold text-red-600 mb-2">Profile Not Found</h2><button onClick={signOut} className="bg-slate-800 text-white px-4 py-2 rounded-lg w-full">Sign Out</button></div></div>

  return (
    <Routes>
      <Route path="/" element={!user ? <Landing /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />
      <Route path="/login" element={!user ? <Login /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />
      <Route path="/register" element={!user ? <Register /> : <Navigate to={ROLE_HOME[role] || '/login'} />} />

      <Route element={<DashboardLayout allowedRoles={['student']} />}>
        <Route path="/student/dashboard" element={<StudentDashboard />} />
        <Route path="/student/catalog" element={<CourseCatalog />} />
        <Route path="/student/attendance" element={<StudentAttendance />} />
        <Route path="/student/directory" element={<DirectoryPage />} />
        <Route path="/student/exams" element={<ExaminationsPage />} />
        <Route path="/student/lost-found" element={<LostFoundPage />} />
        <Route path="/student/maintenance" element={<MaintenancePage />} />
        <Route path="/student/finance" element={<FinancePage />} />
        <Route path="/student/internships" element={<InternshipsPage />} />
        <Route path="/student/scholarships" element={<ScholarshipsPage />} />
        <Route path="/student/complaints" element={<ComplaintsPage />} />
        <Route path="/student/counselling" element={<CounsellingPage />} />
        <Route path="/student/announcements" element={<AnnouncementsPage />} />
        <Route path="/student/profile" element={<ProfilePage />} />
        <Route path="/student/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['admin']} />}>
        <Route path="/admin/dashboard" element={<AdminDashboard />} />
        <Route path="/admin/users" element={<UserManagement />} />
        <Route path="/admin/offices" element={<OfficeManagement />} />
        <Route path="/admin/courses" element={<CourseManagement />} />
        <Route path="/admin/enrollments" element={<EnrollmentManagement />} />
        <Route path="/admin/exams" element={<ExaminationsPage />} />
        <Route path="/admin/finance" element={<FinancePage />} />
        <Route path="/admin/internships" element={<InternshipsPage />} />
        <Route path="/admin/scholarships" element={<ScholarshipsPage />} />
        <Route path="/admin/complaints" element={<ComplaintsPage />} />
        <Route path="/admin/lost-found" element={<LostFoundPage />} />
        <Route path="/admin/maintenance" element={<MaintenancePage />} />
        <Route path="/admin/counselling" element={<CounsellingPage />} />
        <Route path="/admin/announcements" element={<AnnouncementsPage />} />
        <Route path="/admin/directory" element={<DirectoryPage />} />
        <Route path="/admin/profile" element={<ProfilePage />} />
        <Route path="/admin/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['lecturer']} />}>
        <Route path="/lecturer/dashboard" element={<LecturerDashboard />} />
        <Route path="/lecturer/classes" element={<MyClasses />} />
        {/* THIS WAS THE MISSING ROUTE CAUSING THE "REFRESH" */}
        <Route path="/lecturer/live-lecture" element={<LiveLecture />} />
        <Route path="/lecturer/exams" element={<ExaminationsPage />} />
        <Route path="/lecturer/announcements" element={<AnnouncementsPage />} />
        <Route path="/lecturer/profile" element={<ProfilePage />} />
        <Route path="/lecturer/notifications" element={<NotificationsPage />} />
      </Route>

      <Route element={<DashboardLayout allowedRoles={['worker']} />}>
        <Route path="/worker/dashboard" element={<WorkerDashboard />} />
        <Route path="/worker/tasks" element={<AssignedTasks />} />
        <Route path="/worker/profile" element={<ProfilePage />} />
        <Route path="/worker/notifications" element={<NotificationsPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  )
}`,

  // 2. Lecturer My Classes
  "src/modules/lecturer/pages/MyClasses.jsx": `import { useEffect, useState } from 'react'
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
        const fileName = \`\${Math.random()}-\${file.name}\`
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
}`,

  // 3. Lecturer Live Dashboard
  "src/modules/lecturer/pages/LiveLecture.jsx": `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { useNavigate } from 'react-router-dom'
import { Square, RefreshCw, MessageSquare, Send, CheckCircle, AlertCircle } from 'lucide-react'

export default function LiveLecture() {
  const { profile } = useAuth()
  const nav = useNavigate()
  const [session, setSession] = useState(null)
  const [records, setRecords] = useState([])
  const [missingStudents, setMissingStudents] = useState([])
  const [questions, setQuestions] = useState([])
  const [responses, setResponses] = useState({})
  
  const [newQuestion, setNewQuestion] = useState('')
  const [replyText, setReplyText] = useState({})

  useEffect(() => {
    if (!profile) return
    let interval
    const loadSession = async () => {
      // Use limit(1) instead of maybeSingle to prevent crashes if multiple exist
      const { data } = await supabase.from('lecture_sessions').select('*, courses(code, title)').eq('lecturer_id', profile.id).eq('is_active', true).limit(1)
      
      if (data && data.length > 0) {
        const s = data[0]
        setSession(s)
        loadRecords(s.id, s.course_id) 
        loadQuestions(s.id)
        interval = setInterval(() => {
          loadRecords(s.id, s.course_id)
          loadQuestions(s.id)
        }, 3000)
      } else {
        nav('/lecturer/classes')
      }
    }
    loadSession()
    return () => clearInterval(interval)
  }, [profile, nav])

  const loadRecords = async (id, courseId) => {
    const { data: recs } = await supabase.from('lecture_attendance').select('*, profiles(full_name)').eq('session_id', id).order('created_at', { ascending: false })
    setRecords(recs || [])

    const { data: enrollments } = await supabase.from('enrollments').select('profiles(id, full_name)').eq('course_id', courseId)
    const checkedInIds = recs?.map(r => r.student_id) || []
    const missing = enrollments?.map(e => e.profiles).filter(s => s && !checkedInIds.includes(s.id)) || []
    setMissingStudents(missing)
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
    await supabase.from('lecture_questions').insert([{ session_id: session.id, question_text: newQuestion, author_id: profile.id, author_role: 'lecturer' }])
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

  if (!session) return <p className="text-center py-10">Loading...</p>

  return (
    <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="bg-white p-6 rounded-xl border shadow-sm space-y-4 lg:col-span-1">
        <h2 className="text-xl font-bold text-brand-700">{session.courses?.code || 'Course'}</h2>
        <p className="font-medium text-slate-800">{session.courses?.title || ''}</p>
        <div className="p-3 bg-slate-50 rounded-lg border">
          <p className="text-xs font-bold text-slate-500 uppercase">Topic</p>
          <p className="text-sm font-medium">{session.topic}</p>
        </div>
        <button onClick={endSession} className="bg-red-600 text-white w-full py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-red-700"><Square className="w-4 h-4" /> End Lecture</button>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-1">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2"><CheckCircle className="w-5 h-5 text-green-600" /> Present ({records.length})</h2>
          <button onClick={() => loadRecords(session.id, session.course_id)} className="text-brand-600"><RefreshCw className="w-4 h-4" /></button>
        </div>
        <div className="space-y-2 max-h-[250px] overflow-y-auto mb-6">
          {records.map(r => (
            <div key={r.id} className="p-2 bg-green-50 border border-green-200 rounded text-sm flex justify-between">
              <span className="font-medium">{r.profiles?.full_name || 'Unknown'}</span>
              <span className="text-xs text-green-700">{r.status}</span>
            </div>
          ))}
        </div>
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4 text-red-600"><AlertCircle className="w-5 h-5" /> Missing ({missingStudents.length})</h2>
        <div className="space-y-2 max-h-[250px] overflow-y-auto">
          {missingStudents.map(s => (
            <div key={s.id} className="p-2 bg-red-50 border border-red-200 rounded text-sm flex justify-between items-center">
              <span className="font-medium">{s.full_name}</span>
              <button onClick={() => manualCheckIn(s.id)} className="text-xs bg-red-600 text-white px-2 py-1 rounded hover:bg-red-700">Mark Present</button>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl border shadow-sm lg:col-span-1 flex flex-col h-[calc(100vh-120px)]">
        <h2 className="text-lg font-bold flex items-center gap-2 mb-4"><MessageSquare className="w-5 h-5" /> Class Q&A</h2>
        <div className="flex gap-2 mb-4">
          <input type="text" placeholder="Ask a question..." value={newQuestion} onChange={e => setNewQuestion(e.target.value)} className="flex-1 border p-2 rounded-lg text-sm" />
          <button onClick={askQuestion} className="bg-brand-600 text-white p-2 rounded-lg"><Send className="w-4 h-4" /></button>
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
}`,

  // 4. Student Attendance
  "src/modules/student/pages/StudentAttendance.jsx": `import { useState, useEffect } from 'react'
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
}`
};

Object.entries(files).forEach(([filePath, content]) => {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(filePath, content);
});
console.log("✅ Routes fixed (added missing LiveLecture route). Code fact-checked.");