import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { BookOpen, CheckCircle, Search } from 'lucide-react'

export default function CourseCatalog() {
  const { profile } = useAuth()
  const [courses, setCourses] = useState([])
  const [enrolledIds, setEnrolledIds] = useState([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('enrolled')

  const loadData = async () => {
    setLoading(true)
    const { data: c } = await supabase.from('courses').select('*, profiles(full_name)').order('code')
    setCourses(c || [])

    const { data: e } = await supabase.from('enrollments').select('course_id').eq('student_id', profile.id)
    setEnrolledIds(e?.map(x => x.course_id) || [])
    setLoading(false)
  }

  useEffect(() => { loadData() }, [profile])

  const handleEnroll = async (courseId) => {
    const { error } = await supabase.from('enrollments').insert([{ 
      course_id: courseId, 
      student_id: profile.id 
    }])
    
    if (error) alert(error.message)
    else loadData() 
  }

  const handleUnenroll = async (courseId) => {
    if (!window.confirm('Are you sure you want to drop this course? You will no longer be able to see its attendance sessions.')) return
    const { error } = await supabase.from('enrollments').delete().eq('course_id', courseId).eq('student_id', profile.id)
    if (error) alert(error.message)
    else loadData()
  }

  const filteredCourses = courses.filter(c => 
    c.code.toLowerCase().includes(search.toLowerCase()) || 
    c.title.toLowerCase().includes(search.toLowerCase()) ||
    (c.department && c.department.toLowerCase().includes(search.toLowerCase()))
  )

  const myCourses = filteredCourses.filter(c => enrolledIds.includes(c.id))
  const availableCourses = filteredCourses.filter(c => !enrolledIds.includes(c.id))

  const CourseCard = ({ course, isEnrolled }) => (
    <div className="bg-white p-5 rounded-xl border shadow-sm flex flex-col">
      <div className="flex justify-between items-start mb-2">
        <span className="font-bold text-lg text-brand-700">{course.code}</span>
        {course.department && <span className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs font-bold uppercase">{course.department}</span>}
      </div>
      <h3 className="font-semibold text-slate-800 mb-1">{course.title}</h3>
      <p className="text-sm text-slate-500 flex-1">
        Lecturer: {course.profiles?.full_name || 'TBA'}
      </p>
      <p className="text-xs text-slate-400 mt-2 mb-4">
        {course.time_slot || 'Schedule TBA'} • {course.location || 'Location TBA'}
      </p>
      
      {isEnrolled ? (
        <button onClick={() => handleUnenroll(course.id)} className="w-full py-2 bg-green-50 hover:bg-red-50 text-green-700 hover:text-red-700 font-medium rounded-lg text-center flex items-center justify-center gap-2 border border-green-200 hover:border-red-200 transition group">
          <CheckCircle className="w-4 h-4 group-hover:hidden" /> 
          <span className="group-hover:hidden">Enrolled</span>
          <span className="hidden group-hover:block">Drop Course</span>
        </button>
      ) : (
        <button onClick={() => handleEnroll(course.id)} className="w-full py-2 bg-navy-900 hover:bg-navy-800 text-white font-medium rounded-lg transition">
          Enroll Now
        </button>
      )}
    </div>
  )

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-brand-100 text-brand-600 rounded-lg flex items-center justify-center"><BookOpen className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">Course Catalog</h1>
          <p className="text-sm text-slate-500">Manage your enrolled units and discover new ones.</p>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input type="text" placeholder="Search by course code, title, or department..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm" />
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-slate-200">
        <button 
          onClick={() => setActiveTab('enrolled')}
          className={`px-2 py-3 font-medium border-b-2 transition ${activeTab === 'enrolled' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          My Enrolled Courses ({myCourses.length})
        </button>
        <button 
          onClick={() => setActiveTab('available')}
          className={`px-2 py-3 font-medium border-b-2 transition ${activeTab === 'available' ? 'border-brand-600 text-brand-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}
        >
          Available Courses ({availableCourses.length})
        </button>
      </div>

      {loading ? <p className="text-center text-slate-500 py-10">Loading catalog...</p> : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeTab === 'enrolled' && myCourses.map(course => <CourseCard key={course.id} course={course} isEnrolled={true} />)}
          {activeTab === 'available' && availableCourses.map(course => <CourseCard key={course.id} course={course} isEnrolled={false} />)}
          
          {activeTab === 'enrolled' && myCourses.length === 0 && (
            <div className="bg-slate-50 border border-dashed p-8 rounded-xl text-center col-span-full">
              <p className="text-slate-500">You are not enrolled in any courses yet.</p>
              <button onClick={() => setActiveTab('available')} className="text-brand-600 font-medium mt-2 hover:underline">Go to Available Courses</button>
            </div>
          )}

          {activeTab === 'available' && availableCourses.length === 0 && (
            <p className="text-slate-500 col-span-full text-center py-10">No other courses available right now.</p>
          )}
        </div>
      )}
    </div>
  )
}