import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { UserCheck } from 'lucide-react'

export default function EnrollmentManagement() {
  const [courses, setCourses] = useState([])
  const [students, setStudents] = useState([])
  const [selectedCourse, setSelectedCourse] = useState('')
  const [selectedStudent, setSelectedStudent] = useState('')
  const [enrollments, setEnrollments] = useState([])

  const loadData = async () => {
    const { data: c } = await supabase.from('courses').select('id, code, title')
    setCourses(c || [])
    const { data: s } = await supabase.from('profiles').select('id, full_name').eq('role', 'student')
    setStudents(s || [])
    
    const { data: e } = await supabase.from('enrollments').select('*, courses(code, title), profiles(full_name)')
    setEnrollments(e || [])
  }

  useEffect(() => { loadData() }, [])

  const handleEnroll = async (e) => {
    e.preventDefault()
    if (!selectedCourse || !selectedStudent) return
    const { error } = await supabase.from('enrollments').insert([{ course_id: selectedCourse, student_id: selectedStudent }])
    if (error) alert(error.message)
    else {
      setSelectedStudent('')
      loadData()
    }
  }

  const removeEnrollment = async (id) => {
    await supabase.from('enrollments').delete().eq('id', id)
    loadData()
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-purple-100 text-purple-600 rounded-lg flex items-center justify-center"><UserCheck className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Course Enrollments</h1>
          <p className="text-sm text-slate-500">Assign students to specific course units.</p>
        </div>
      </div>

      <form onSubmit={handleEnroll} className="bg-white p-6 rounded-xl border flex gap-4 items-end shadow-sm">
        <div className="flex-1">
          <label className="block text-sm mb-1 font-medium">Select Course</label>
          <select required value={selectedCourse} onChange={e => setSelectedCourse(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Choose a course...</option>
            {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
          </select>
        </div>
        <div className="flex-1">
          <label className="block text-sm mb-1 font-medium">Select Student</label>
          <select required value={selectedStudent} onChange={e => setSelectedStudent(e.target.value)} className="w-full border p-2 rounded">
            <option value="">Choose a student...</option>
            {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg h-10 hover:bg-brand-700 transition">Enroll Student</button>
      </form>

      <div className="bg-white rounded-xl border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr><th className="p-3">Course</th><th className="p-3">Student</th><th className="p-3">Action</th></tr>
          </thead>
          <tbody>
            {enrollments.map(e => (
              <tr key={e.id} className="border-b">
                <td className="p-3 font-medium">{e.courses?.code} - {e.courses?.title}</td>
                <td className="p-3">{e.profiles?.full_name}</td>
                <td className="p-3"><button onClick={() => removeEnrollment(e.id)} className="text-red-500 text-xs font-bold hover:underline">Remove</button></td>
              </tr>
            ))}
            {enrollments.length === 0 && <tr><td colSpan="3" className="p-6 text-center text-slate-500">No enrollments yet.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}