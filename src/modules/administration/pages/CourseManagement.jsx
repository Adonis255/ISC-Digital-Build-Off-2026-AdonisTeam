import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'

export default function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [form, setForm] = useState({ code: '', title: '', lecturer_id: '' })

  const loadData = async () => {
    const { data: c } = await supabase.from('courses').select('*, profiles(full_name)')
    setCourses(c || [])
    const { data: l } = await supabase.from('profiles').select('id, full_name').eq('role', 'lecturer')
    setLecturers(l || [])
  }

  useEffect(() => { loadData() }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    await supabase.from('courses').insert([form])
    setForm({ code: '', title: '', lecturer_id: '' })
    loadData()
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Course Management</h1>
      
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-xl border flex gap-4 items-end">
        <div className="flex-1"><label className="block text-sm mb-1">Course Code</label><input required value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="w-full border p-2 rounded" placeholder="CS 101" /></div>
        <div className="flex-1"><label className="block text-sm mb-1">Course Title</label><input required value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="w-full border p-2 rounded" placeholder="Intro to Programming" /></div>
        <div className="flex-1"><label className="block text-sm mb-1">Assign Lecturer</label>
          <select required value={form.lecturer_id} onChange={e => setForm({...form, lecturer_id: e.target.value})} className="w-full border p-2 rounded">
            <option value="">Select Lecturer...</option>
            {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
          </select>
        </div>
        <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg h-10">Add Course</button>
      </form>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {courses.map(c => (
          <div key={c.id} className="bg-white p-5 rounded-xl border">
            <h3 className="font-bold text-lg">{c.code} - {c.title}</h3>
            <p className="text-sm text-slate-500 mt-1">Lecturer: {c.profiles?.full_name || 'Unassigned'}</p>
          </div>
        ))}
      </div>
    </div>
  )
}