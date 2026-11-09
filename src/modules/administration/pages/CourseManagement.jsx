import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { BookOpen, Plus, Edit, Trash2, Upload, CheckCircle } from 'lucide-react'

export default function CourseManagement() {
  const [courses, setCourses] = useState([])
  const [lecturers, setLecturers] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [form, setForm] = useState({ code: '', title: '', lecturer_id: '', department: '', time_slot: '', location: '' })

  // CSV Upload State
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')

  const loadData = async () => {
    const { data: c } = await supabase.from('courses').select('*, profiles(full_name)').order('code')
    setCourses(c || [])
    const { data: l } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'lecturer')
    setLecturers(l || [])
  }

  useEffect(() => { loadData() }, [])

  const resetForm = () => {
    setForm({ code: '', title: '', lecturer_id: '', department: '', time_slot: '', location: '' })
    setEditingId(null)
    setShowForm(false)
  }

  const handleEditClick = (course) => {
    setForm({
      code: course.code,
      title: course.title,
      lecturer_id: course.lecturer_id || '',
      department: course.department || '',
      time_slot: course.time_slot || '',
      location: course.location || ''
    })
    setEditingId(course.id)
    setShowForm(true)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this course?')) return
    const { error } = await supabase.from('courses').delete().eq('id', id)
    if (error) alert('Error deleting course: ' + error.message)
    else loadData()
  }

  const handleManualSubmit = async (e) => {
    e.preventDefault()
    const payload = { ...form, lecturer_id: form.lecturer_id || null }

    if (editingId) {
      await supabase.from('courses').update(payload).eq('id', editingId)
    } else {
      await supabase.from('courses').insert([payload])
    }
    resetForm()
    loadData()
  }

  const handleCSVUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    setUploading(true)
    setProgress(0)
    setStatusMsg('Reading file...')

    const reader = new FileReader()
    reader.onload = async (event) => {
      try {
        const text = event.target.result
        const rows = text.split(/\r?\n/).map(row => row.trim()).filter(row => row)
        const dataRows = rows[0].toLowerCase().includes('code') ? rows.slice(1) : rows
        
        const total = dataRows.length
        const batchSize = 50
        let successCount = 0

        setStatusMsg(`Preparing to upload ${total} courses...`)

        // Process in batches of 50
        for (let i = 0; i < total; i += batchSize) {
          const batch = dataRows.slice(i, i + batchSize)
          
          const coursesToInsert = []
          for (const row of batch) {
            const [code, title, lecturer_email, department, time_slot, location] = row.split(',').map(s => s?.trim())
            if (!code || !title) continue

            let lecturer_id = null
            if (lecturer_email) {
              const lecturer = lecturers.find(l => l.email.toLowerCase() === lecturer_email.toLowerCase())
              if (lecturer) lecturer_id = lecturer.id
            }

            coursesToInsert.push({
              code, 
              title, 
              department: department || 'General', 
              time_slot, 
              location, 
              lecturer_id
            })
          }

          // Upsert the batch
          if (coursesToInsert.length > 0) {
            const { error } = await supabase.from('courses').upsert(coursesToInsert, { onConflict: 'code' })
            if (!error) successCount += coursesToInsert.length
          }

          // Update progress bar
          const currentProgress = Math.min(Math.round(((i + batchSize) / total) * 100), 100)
          setProgress(currentProgress)
          setStatusMsg(`Uploading... ${successCount} of ${total} completed`)
        }

        setStatusMsg(`✅ Upload complete! ${successCount} courses added/updated.`)
        loadData()
      } catch (err) {
        setStatusMsg('❌ Error: ' + err.message)
      } finally {
        setUploading(false)
        e.target.value = null 
      }
    }
    reader.readAsText(file)
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Course Management</h1>
            <p className="text-sm text-slate-500">Add, edit, or bulk import courses.</p>
          </div>
        </div>
        {!showForm && (
          <button onClick={() => { resetForm(); setShowForm(true) }} className="bg-brand-600 text-white px-4 py-2 rounded-xl flex items-center gap-2 shadow-sm hover:bg-brand-700 transition">
            <Plus className="w-4 h-4" /> Add Course Manually
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleManualSubmit} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="flex justify-between items-center border-b pb-2">
            <h2 className="font-semibold text-lg">{editingId ? 'Edit Course' : 'Add New Course'}</h2>
            <button type="button" onClick={resetForm} className="text-sm text-slate-500 hover:underline">Cancel</button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required placeholder="Course Code (e.g. CS101)" value={form.code} onChange={e => setForm({...form, code: e.target.value})} className="border p-3 rounded-xl" />
            <input required placeholder="Course Title" value={form.title} onChange={e => setForm({...form, title: e.target.value})} className="border p-3 rounded-xl" />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <input placeholder="Department (e.g. Nursing)" value={form.department} onChange={e => setForm({...form, department: e.target.value})} className="border p-3 rounded-xl" />
            <input placeholder="Time Slot (e.g. Mon 8AM)" value={form.time_slot} onChange={e => setForm({...form, time_slot: e.target.value})} className="border p-3 rounded-xl" />
            <input placeholder="Location (e.g. Main Hall)" value={form.location} onChange={e => setForm({...form, location: e.target.value})} className="border p-3 rounded-xl" />
          </div>

          <select value={form.lecturer_id} onChange={e => setForm({...form, lecturer_id: e.target.value})} className="w-full border p-3 rounded-xl">
            <option value="">Assign Lecturer (Optional)</option>
            {lecturers.map(l => <option key={l.id} value={l.id}>{l.full_name}</option>)}
          </select>

          <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-xl font-medium">
            {editingId ? 'Update Course' : 'Save Course'}
          </button>
        </form>
      )}

      <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl">
        <h3 className="font-bold text-blue-900 mb-2 flex items-center gap-2"><Upload className="w-5 h-5" /> Bulk Import Courses (CSV)</h3>
        <p className="text-sm text-blue-700 mb-4">Format required: <code>Course Code, Course Title, Lecturer Email, Department, Time, Location</code></p>
        
        {!uploading ? (
          <input type="file" accept=".csv" onChange={handleCSVUpload} className="block w-full text-sm file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-sm file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700 cursor-pointer" />
        ) : (
          <div className="space-y-2">
            <div className="flex justify-between text-sm font-bold text-blue-800">
              <span>{statusMsg}</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-3">
              <div className="bg-blue-600 h-3 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
            </div>
          </div>
        )}
        
        {statusMsg && !uploading && (
          <p className={`mt-3 text-sm font-bold flex items-center gap-2 ${statusMsg.includes('❌') ? 'text-red-600' : 'text-green-600'}`}>
            {statusMsg.includes('❌') ? null : <CheckCircle className="w-4 h-4" />} {statusMsg}
          </p>
        )}
      </div>

      <div className="bg-white rounded-2xl border overflow-hidden shadow-sm">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 border-b">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Title</th>
              <th className="p-4">Department</th>
              <th className="p-4">Lecturer</th>
              <th className="p-4">Time</th>
              <th className="p-4">Location</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {courses.map(c => (
              <tr key={c.id} className="border-b hover:bg-slate-50">
                <td className="p-4 font-bold">{c.code}</td>
                <td className="p-4">{c.title}</td>
                <td className="p-4 text-slate-500">{c.department || '-'}</td>
                <td className="p-4 text-slate-500">{c.profiles?.full_name || 'Unassigned'}</td>
                <td className="p-4 text-slate-500">{c.time_slot || '-'}</td>
                <td className="p-4 text-slate-500">{c.location || '-'}</td>
                <td className="p-4 text-right space-x-2">
                  <button onClick={() => handleEditClick(c)} className="text-blue-600 hover:bg-blue-50 p-2 rounded-lg" title="Edit"><Edit className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(c.id)} className="text-red-600 hover:bg-red-50 p-2 rounded-lg" title="Delete"><Trash2 className="w-4 h-4" /></button>
                </td>
              </tr>
            ))}
            {courses.length === 0 && <tr><td colSpan="7" className="p-6 text-center text-slate-500">No courses found. Add one manually or upload a CSV.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}