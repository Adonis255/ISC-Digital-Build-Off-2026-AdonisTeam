import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { BookOpen, CheckCircle } from 'lucide-react'

export default function MyClasses() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourse, setSelectedCourse] = useState(null)
  const [attendance, setAttendance] = useState({})

  const loadData = async () => {
    if (!profile) return
    const { data: c } = await supabase.from('courses').select('*').eq('lecturer_id', profile.id)
    setCourses(c || [])
    const { data: s } = await supabase.from('profiles').select('id, full_name').eq('role', 'student')
    setStudents(s || [])
  }

  useEffect(() => { loadData() }, [profile])

  const submitAttendance = async () => {
    const date = new Date().toISOString().split('T')[0]
    const records = Object.keys(attendance).map(studentId => ({
      course_id: selectedCourse.id,
      student_id: studentId,
      date,
      status: attendance[studentId]
    }))
    
    if (records.length === 0) return alert('Mark at least one student.')
    
    const { error } = await supabase.from('attendance').upsert(records, { onConflict: 'course_id,student_id,date' })
    if (error) alert(error.message)
    else {
      alert('Attendance saved!')
      setSelectedCourse(null)
      setAttendance({})
    }
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">My Classes & Attendance</h1>
      
      {!selectedCourse ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {courses.map(c => (
            <div key={c.id} className="bg-white p-5 rounded-xl border shadow-sm cursor-pointer hover:border-brand-500" onClick={() => setSelectedCourse(c)}>
              <h3 className="font-bold text-lg flex items-center gap-2"><BookOpen className="w-5 h-5 text-brand-600" /> {c.code} - {c.title}</h3>
              <p className="text-sm text-brand-600 mt-2 font-medium">Click to take attendance &rarr;</p>
            </div>
          ))}
          {courses.length === 0 && <p className="text-slate-500">No classes assigned to you yet.</p>}
        </div>
      ) : (
        <div className="bg-white p-6 rounded-xl border shadow-sm">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{selectedCourse.code} Attendance ({new Date().toLocaleDateString()})</h2>
            <button onClick={() => setSelectedCourse(null)} className="text-sm text-slate-500 hover:underline">Back to classes</button>
          </div>
          
          <div className="space-y-2 mb-6">
            {students.map(s => (
              <div key={s.id} className="flex justify-between items-center p-3 bg-slate-50 rounded-lg border">
                <span className="font-medium">{s.full_name}</span>
                <div className="flex gap-2">
                  <button onClick={() => setAttendance({...attendance, [s.id]: 'present'})} className={`px-3 py-1 rounded text-sm ${attendance[s.id] === 'present' ? 'bg-green-600 text-white' : 'bg-white border'}`}>Present</button>
                  <button onClick={() => setAttendance({...attendance, [s.id]: 'absent'})} className={`px-3 py-1 rounded text-sm ${attendance[s.id] === 'absent' ? 'bg-red-600 text-white' : 'bg-white border'}`}>Absent</button>
                </div>
              </div>
            ))}
          </div>
          
          <button onClick={submitAttendance} className="bg-brand-600 text-white px-6 py-2 rounded-lg w-full flex items-center justify-center gap-2"><CheckCircle className="w-5 h-5" /> Save Attendance</button>
        </div>
      )}
    </div>
  )
}