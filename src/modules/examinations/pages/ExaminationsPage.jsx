import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { FileText, Calendar, MapPin } from 'lucide-react'

export default function ExaminationsPage() {
  const { profile, role } = useAuth()
  const [exams, setExams] = useState([])
  const [courses, setCourses] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ course_id: '', title: '', exam_date: '', location: '' })

  const loadData = async () => {
    const { data: e } = await supabase.from('exams').select('*, courses(code, title)').order('exam_date', { ascending: true })
    setExams(e || [])
    
    if (role === 'admin' || role === 'lecturer') {
      const { data: c } = await supabase.from('courses').select('id, code, title')
      setCourses(c || [])
    }
  }

  useEffect(() => { loadData() }, [role])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('exams').insert([form])
    setForm({ course_id: '', title: '', exam_date: '', location: '' })
    setShowForm(false)
    loadData()
  }

  const canPost = role === 'admin' || role === 'lecturer'

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Examination Schedule</h1>
            <p className="text-sm text-slate-500">Upcoming midterms and final exams.</p>
          </div>
        </div>
        {canPost && (
          <button onClick={() => setShowForm(!showForm)} className="bg-brand-600 text-white px-4 py-2 rounded-lg">
            {showForm ? 'Cancel' : '+ Post Exam'}
          </button>
        )}
      </div>

      {showForm && canPost && (
        <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select required value={form.course_id} onChange={e => setForm({...form, course_id: e.target.value})} className="w-full border p-2 rounded">
              <option value="">Select Course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
            </select>
            <input required placeholder="Exam Title (e.g. CAT 1, Final Exam)" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="datetime-local" value={form.exam_date} onChange={e => setForm({...form, exam_date: e.target.value})} className="w-full border p-2 rounded" />
            <input required placeholder="Location (e.g. Exam Hall A)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="w-full border p-2 rounded" />
          </div>
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Publish Exam</button>
        </form>
      )}

      <div className="space-y-4">
        {exams.map(exam => (
          <div key={exam.id} className="bg-white p-5 rounded-xl border shadow-sm flex items-start gap-4">
            <div className="bg-rose-50 text-rose-700 p-4 rounded-xl flex flex-col items-center justify-center min-w-[100px]">
              <span className="text-2xl font-bold">{new Date(exam.exam_date).getDate()}</span>
              <span className="text-sm font-medium uppercase">{new Date(exam.exam_date).toLocaleString('default', { month: 'short' })}</span>
            </div>
            <div className="flex-1">
              <h3 className="font-bold text-lg text-slate-800">{exam.courses?.code} - {exam.title}</h3>
              <p className="text-slate-600">{exam.courses?.title}</p>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-slate-500">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {new Date(exam.exam_date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {exam.location}</span>
              </div>
            </div>
          </div>
        ))}
        {exams.length === 0 && <p className="text-slate-500">No exams scheduled yet.</p>}
      </div>
    </div>
  )
}