import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { FileText, Calendar, MapPin, Armchair, Upload, Search, Trash2, CheckCircle } from 'lucide-react'

export default function ExaminationsPage() {
  const { profile, role } = useAuth()
  const [exams, setExams] = useState([])
  const [courses, setCourses] = useState([])
  const [rooms, setRooms] = useState([])
  const [mySeats, setMySeats] = useState([])
  
  const [searchQuery, setSearchQuery] = useState('')
  const [showExamForm, setShowExamForm] = useState(false)
  const [showRoomForm, setShowRoomForm] = useState(false)
  const [examForm, setExamForm] = useState({ course_id: '', title: '', exam_date: '', location: '' })
  const [roomForm, setRoomForm] = useState({ name: '', capacity: 50 })
  
  const [generating, setGenerating] = useState(false)
  const [deduplicating, setDeduplicating] = useState(false)
  
  // CSV Upload State
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [statusMsg, setStatusMsg] = useState('')

  const loadData = async () => {
    const { data: e } = await supabase.from('exams').select('*, courses(code, title)').order('exam_date', { ascending: true })
    setExams(e || [])
    
    if (role === 'admin' || role === 'lecturer') {
      const { data: c } = await supabase.from('courses').select('id, code, title')
      setCourses(c || [])
      const { data: r } = await supabase.from('exam_rooms').select('*').order('name')
      setRooms(r || [])
    }

    if (role === 'student') {
      const { data: s } = await supabase.from('seat_allocations').select('*, exam_rooms(name), exams(title, exam_date)').eq('student_id', profile.id)
      setMySeats(s || [])
    }
  }

  useEffect(() => { loadData() }, [role, profile])

  const handleRemoveDuplicates = async () => {
    if (!window.confirm("This will scan for and remove duplicate exams (same course, title, date, and location). Proceed?")) return
    setDeduplicating(true)
    
    const seen = new Set()
    const toDelete = []
    
    // Sort by created_at so we keep the oldest one
    const sortedExams = [...exams].sort((a, b) => new Date(a.created_at) - new Date(b.created_at))
    
    sortedExams.forEach(exam => {
      const key = `${exam.course_id}-${exam.title}-${exam.exam_date}-${exam.location}`
      if (seen.has(key)) {
        toDelete.push(exam.id)
      } else {
        seen.add(key)
      }
    })

    if (toDelete.length === 0) {
      alert("No duplicates found! Your schedule is clean.")
      setDeduplicating(false)
      return
    }

    const { error } = await supabase.from('exams').delete().in('id', toDelete)
    if (error) alert('Error: ' + error.message)
    else alert(`✅ Successfully removed ${toDelete.length} duplicate exams!`)
    
    setDeduplicating(false)
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
        let success = 0
        let failed = 0
        let missingCourses = []

        setStatusMsg(`Preparing to upload ${total} exams...`)

        for (let i = 0; i < total; i += batchSize) {
          const batch = dataRows.slice(i, i + batchSize)
          const examsToInsert = []

          for (const row of batch) {
            const [code, title, dateStr, location] = row.split(',').map(s => s?.trim())
            if (!code || !title || !dateStr) { failed++; continue }

            const existingCourse = courses.find(c => c.code.toLowerCase() === code.toLowerCase())
            if (!existingCourse) {
              missingCourses.push(code)
              failed++
              continue
            }

            const examDate = new Date(dateStr).toISOString()
            examsToInsert.push({
              course_id: existingCourse.id,
              title,
              exam_date: examDate,
              location
            })
          }

          if (examsToInsert.length > 0) {
            const { error } = await supabase.from('exams').insert(examsToInsert)
            if (error) failed += examsToInsert.length
            else success += examsToInsert.length
          }

          const currentProgress = Math.min(Math.round(((i + batchSize) / total) * 100), 100)
          setProgress(currentProgress)
          setStatusMsg(`Uploading... ${success} of ${total} completed`)
        }

        let alertMsg = `✅ ${success} exams uploaded successfully!\n❌ ${failed} rows failed.\n\n`
        if (missingCourses.length > 0) {
          const uniqueMissing = [...new Set(missingCourses)]
          alertMsg += `⚠️ WARNING: The following Course Codes do not exist in your database:\n${uniqueMissing.join(', ')}\n\nPlease upload these courses first using 'Academic Mgmt'.`
        }
        setStatusMsg(`✅ Upload complete! ${success} exams added.`)
        alert(alertMsg)
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

  const handleCreateExam = async (e) => {
    e.preventDefault()
    await supabase.from('exams').insert([examForm])
    setExamForm({ course_id: '', title: '', exam_date: '', location: '' })
    setShowExamForm(false)
    loadData()
  }

  const handleCreateRoom = async (e) => {
    e.preventDefault()
    await supabase.from('exam_rooms').insert([{ ...roomForm, capacity: parseInt(roomForm.capacity) }])
    setRoomForm({ name: '', capacity: 50 })
    setShowRoomForm(false)
    loadData()
  }

  const generateSeats = async (examId) => {
    if (rooms.length === 0) return alert('Please create exam rooms first.')
    setGenerating(true)

    const { data: students } = await supabase.from('profiles').select('id').eq('role', 'student')
    if (!students || students.length === 0) {
      alert('No students found to allocate.')
      setGenerating(false)
      return
    }

    await supabase.from('seat_allocations').delete().eq('exam_id', examId)

    let currentRoomIndex = 0
    let currentSeat = 1
    const allocations = []

    for (const student of students) {
      if (currentSeat > rooms[currentRoomIndex].capacity) {
        currentRoomIndex++
        currentSeat = 1
      }
      if (currentRoomIndex >= rooms.length) {
        alert('Warning: Not enough room capacity to seat all students.')
        break
      }
      allocations.push({
        exam_id: examId, student_id: student.id, room_id: rooms[currentRoomIndex].id, seat_number: currentSeat
      })
      currentSeat++
    }

    if (allocations.length > 0) {
      await supabase.from('seat_allocations').insert(allocations)
      alert(`Successfully allocated seats for ${allocations.length} students!`)
    }
    setGenerating(false)
    loadData()
  }

  const canPost = role === 'admin' || role === 'lecturer'
  const isAdmin = role === 'admin'

  // Apply Search Filter
  const filteredExams = exams.filter(exam => 
    exam.courses?.code?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.location?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-rose-100 text-rose-600 rounded-lg flex items-center justify-center"><FileText className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Examination Schedule</h1>
            <p className="text-sm text-slate-500">Manage exams and seating arrangements.</p>
          </div>
        </div>
        <div className="flex gap-2">
          {isAdmin && (
            <>
              <button onClick={handleRemoveDuplicates} disabled={deduplicating} className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-orange-200 transition">
                <Trash2 className="w-4 h-4" /> {deduplicating ? 'Scanning...' : 'Remove Duplicates'}
              </button>
              <button onClick={() => setShowRoomForm(!showRoomForm)} className="bg-slate-800 text-white px-4 py-2 rounded-xl text-sm">
                {showRoomForm ? 'Cancel' : 'Manage Rooms'}
              </button>
            </>
          )}
          {canPost && (
            <button onClick={() => setShowExamForm(!showExamForm)} className="bg-brand-600 text-white px-4 py-2 rounded-xl text-sm">
              {showExamForm ? 'Cancel' : '+ Add Exam'}
            </button>
          )}
        </div>
      </div>

      {isAdmin && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-2xl flex items-center justify-between">
          <div>
            <h3 className="font-bold text-blue-900 mb-1">Bulk Upload Exams (CSV)</h3>
            <p className="text-sm text-blue-700">Format: <code>Code, Title, Date (YYYY-MM-DD HH:MM), Location</code></p>
          </div>
          
          {!uploading ? (
            <label className="bg-blue-600 text-white px-6 py-2 rounded-xl cursor-pointer hover:bg-blue-700 flex items-center gap-2 font-medium">
              <Upload className="w-4 h-4" /> Choose File
              <input type="file" accept=".csv" onChange={handleCSVUpload} className="hidden" />
            </label>
          ) : (
            <div className="w-1/3 space-y-1">
              <div className="flex justify-between text-xs font-bold text-blue-800">
                <span>{statusMsg}</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full bg-blue-200 rounded-full h-2">
                <div className="bg-blue-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }}></div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input type="text" placeholder="Search exams by course code, title, or location..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-2.5 border rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 outline-none" />
      </div>

      {showRoomForm && isAdmin && (
        <form onSubmit={handleCreateRoom} className="bg-white p-6 rounded-2xl border shadow-sm flex gap-4 items-end">
          <div className="flex-1">
            <label className="block text-sm font-medium mb-1">Room Name</label>
            <input required placeholder="e.g. Exam Hall A" value={roomForm.name} onChange={e => setRoomForm({...roomForm, name: e.target.value})} className="w-full border p-2 rounded-xl" />
          </div>
          <div className="w-32">
            <label className="block text-sm font-medium mb-1">Capacity</label>
            <input required type="number" min="1" value={roomForm.capacity} onChange={e => setRoomForm({...roomForm, capacity: e.target.value})} className="w-full border p-2 rounded-xl" />
          </div>
          <button type="submit" className="bg-navy-900 text-white px-6 py-2 rounded-xl h-10">Add Room</button>
        </form>
      )}

      {showExamForm && canPost && (
        <form onSubmit={handleCreateExam} className="bg-white p-6 rounded-2xl border shadow-sm space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select required value={examForm.course_id} onChange={e => setExamForm({...examForm, course_id: e.target.value})} className="w-full border p-2 rounded-xl">
              <option value="">Select Course...</option>
              {courses.map(c => <option key={c.id} value={c.id}>{c.code} - {c.title}</option>)}
            </select>
            <input required placeholder="Exam Title (e.g. Final Exam)" value={examForm.title} onChange={e => setExamForm({...examForm, title: e.target.value})} className="w-full border p-2 rounded-xl" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input required type="datetime-local" value={examForm.exam_date} onChange={e => setExamForm({...examForm, exam_date: e.target.value})} className="w-full border p-2 rounded-xl" />
            <input required placeholder="Location (e.g. Main Hall)" value={examForm.location} onChange={e => setExamForm({...examForm, location: e.target.value})} className="w-full border p-2 rounded-xl" />
          </div>
          <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-xl">Publish Exam</button>
        </form>
      )}

      <div className="space-y-4">
        {filteredExams.map(exam => {
          const mySeat = mySeats.find(s => s.exam_id === exam.id)
          
          return (
            <div key={exam.id} className="bg-white p-5 rounded-2xl border shadow-sm flex flex-col md:flex-row gap-6">
              <div className="bg-rose-50 text-rose-700 p-4 rounded-xl flex flex-col items-center justify-center min-w-[100px] h-fit">
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

                {mySeat && (
                  <div className="mt-4 bg-green-50 border border-green-200 p-3 rounded-lg flex items-center gap-3">
                    <Armchair className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="text-sm font-bold text-green-800">Your Seat Allocation</p>
                      <p className="text-xs text-green-700">Room: <strong>{mySeat.exam_rooms?.name}</strong> | Seat: <strong>{mySeat.seat_number}</strong></p>
                    </div>
                  </div>
                )}

                {isAdmin && (
                  <div className="mt-4 pt-3 border-t">
                    <button onClick={() => generateSeats(exam.id)} disabled={generating} className="bg-navy-900 text-white px-4 py-2 rounded-xl text-sm disabled:opacity-50">
                      {generating ? 'Generating...' : 'Generate Seat Allocations'}
                    </button>
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {filteredExams.length === 0 && <p className="text-center py-10 text-slate-500">No exams found matching your search.</p>}
      </div>
    </div>
  )
}