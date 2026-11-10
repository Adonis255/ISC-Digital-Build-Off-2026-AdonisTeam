import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { DollarSign, CheckCircle, CreditCard, Users, Search } from 'lucide-react'

export default function FinancePage() {
  const { profile, role } = useAuth()
  const isAdmin = role === 'admin'
  
  // Student State
  const [records, setRecords] = useState([])
  const [enrollmentsCount, setEnrollmentsCount] = useState(0)
  const [payAmount, setPayAmount] = useState('')
  const [processing, setProcessing] = useState(false)
  const [msg, setMsg] = useState('')

  // Admin State
  const [studentsData, setStudentsData] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [loadingAdmin, setLoadingAdmin] = useState(false)

  const COURSE_FEE = 20000
  const ACADEMIC_FEE = 5000

  const loadStudentData = async () => {
    if (!profile) return
    const { count } = await supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('student_id', profile.id)
    setEnrollmentsCount(count || 0)
    const { data: r } = await supabase.from('finance_records').select('*').eq('student_id', profile.id).eq('status', 'paid')
    setRecords(r || [])
  }

  const loadAdminData = async () => {
    setLoadingAdmin(true)
    // 1. Get all students
    const { data: students } = await supabase.from('profiles').select('id, full_name, email').eq('role', 'student').order('full_name')
    // 2. Get all enrollments
    const { data: enrollments } = await supabase.from('enrollments').select('student_id')
    // 3. Get all payments
    const { data: payments } = await supabase.from('finance_records').select('student_id, amount').eq('status', 'paid')

    if (students) {
      const calculated = students.map(student => {
        const courseCount = enrollments?.filter(e => e.student_id === student.id).length || 0
        const totalPaid = payments?.filter(p => p.student_id === student.id).reduce((sum, p) => sum + Number(p.amount), 0) || 0
        const totalRequired = (courseCount * COURSE_FEE) + ACADEMIC_FEE
        const remaining = Math.max(0, totalRequired - totalPaid)
        const progress = totalRequired > 0 ? Math.min(100, Math.round((totalPaid / totalRequired) * 100)) : 0

        return { ...student, courseCount, totalPaid, totalRequired, remaining, progress }
      })
      setStudentsData(calculated)
    }
    setLoadingAdmin(false)
  }

  useEffect(() => {
    if (isAdmin) loadAdminData()
    else loadStudentData()
  }, [profile, role])

  const handlePayment = async (e) => {
    e.preventDefault()
    const amountToPay = Number(payAmount)
    const remaining = ((enrollmentsCount * COURSE_FEE) + ACADEMIC_FEE) - records.reduce((sum, r) => sum + Number(r.amount), 0)
    
    if (amountToPay <= 0) return
    if (amountToPay > remaining) return alert("You cannot pay more than your remaining balance.")

    setProcessing(true)
    setMsg('')
    
    setTimeout(async () => {
      const { error } = await supabase.from('finance_records').insert([{
        student_id: profile.id,
        description: 'Fee Payment',
        amount: amountToPay,
        status: 'paid'
      }])

      if (error) setMsg('Payment failed: ' + error.message)
      else {
        setMsg(`Successfully paid Ksh ${amountToPay.toLocaleString()}!`)
        setPayAmount('')
        loadStudentData()
      }
      setProcessing(false)
    }, 1500)
  }

  // --- STUDENT VIEW ---
  if (!isAdmin) {
    const totalRequired = (enrollmentsCount * COURSE_FEE) + ACADEMIC_FEE
    const totalPaid = records.reduce((sum, record) => sum + Number(record.amount), 0)
    const remaining = Math.max(0, totalRequired - totalPaid)
    const progressPercent = totalRequired > 0 ? Math.min(100, Math.round((totalPaid / totalRequired) * 100)) : 0

    return (
      <div className="space-y-6 max-w-4xl mx-auto pb-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">School Fees</h1>
            <p className="text-sm text-slate-500">Manage your fee balance for examination clearance.</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden mb-6">
          <div className="bg-[#1a0b2e] p-6 text-white flex flex-col md:flex-row justify-between items-center gap-6">
            <div>
              <p className="text-purple-300 font-medium mb-1">Total Fee Balance</p>
              <h2 className="text-4xl font-extrabold">Ksh {remaining.toLocaleString()}</h2>
            </div>
            <div className="flex gap-8 text-center border-t md:border-t-0 md:border-l border-purple-700/50 pt-4 md:pt-0 md:pl-8">
              <div><p className="text-purple-300 text-xs font-bold uppercase mb-1">Total Required</p><p className="text-xl font-bold">Ksh {totalRequired.toLocaleString()}</p></div>
              <div><p className="text-purple-300 text-xs font-bold uppercase mb-1">Amount Paid</p><p className="text-xl font-bold text-green-400">Ksh {totalPaid.toLocaleString()}</p></div>
            </div>
          </div>
          <div className="p-6 bg-white">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-bold text-slate-700">Fee Clearance Progress</span>
              <span className="text-sm font-bold text-brand-600">{progressPercent}%</span>
            </div>
            <div className="w-full bg-slate-100 rounded-full h-4 overflow-hidden border">
              <div className="bg-green-500 h-4 rounded-full transition-all duration-1000" style={{ width: `${progressPercent}%` }}></div>
            </div>
            <p className="text-xs text-slate-500 mt-2 text-center">{progressPercent === 100 ? "You are fully cleared for exams!" : `You need Ksh ${remaining.toLocaleString()} more to be cleared for exams.`}</p>
          </div>
        </div>

        {remaining > 0 && (
          <div className="bg-white p-6 rounded-2xl border shadow-sm mb-8">
            <h3 className="font-bold text-lg mb-4 text-slate-800">Make a Payment</h3>
            {msg && <p className={`p-3 mb-4 rounded-lg text-sm font-bold ${msg.includes('failed') ? 'bg-red-50 text-red-600' : 'bg-green-50 text-green-600'}`}>{msg}</p>}
            <form onSubmit={handlePayment} className="flex flex-col md:flex-row gap-4 items-end">
              <div className="flex-1 w-full">
                <label className="block text-sm font-medium mb-1">Enter Amount (Ksh)</label>
                <input required type="number" min="1" max={remaining} placeholder={`e.g. ${remaining}`} value={payAmount} onChange={e => setPayAmount(e.target.value)} className="w-full border p-3 rounded-xl focus:ring-2 focus:ring-brand-500 outline-none text-lg font-mono" />
              </div>
              <button type="submit" disabled={processing} className="bg-brand-600 hover:bg-brand-700 text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 transition w-full md:w-auto justify-center disabled:opacity-50">
                <CreditCard className="w-5 h-5" /> {processing ? 'Processing...' : 'Pay School Fees'}
              </button>
            </form>
          </div>
        )}

        {remaining === 0 && (
          <div className="bg-green-50 border border-green-200 p-6 rounded-2xl text-center mb-8">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-2" />
            <h3 className="text-xl font-bold text-green-800">Fees Fully Cleared</h3>
            <p className="text-green-600 mt-1">You are eligible to take your examinations.</p>
          </div>
        )}

        <div className="mt-8">
          <h3 className="font-bold text-slate-800 mb-3">Payment History</h3>
          <div className="bg-white rounded-xl border overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b"><tr><th className="p-3">Date</th><th className="p-3">Description</th><th className="p-3">Amount</th><th className="p-3">Status</th></tr></thead>
              <tbody>
                {records.map(r => (
                  <tr key={r.id} className="border-b">
                    <td className="p-3 text-slate-500">{new Date(r.created_at).toLocaleDateString()}</td>
                    <td className="p-3 font-medium">{r.description}</td>
                    <td className="p-3 font-bold text-slate-800">Ksh {Number(r.amount).toLocaleString()}</td>
                    <td className="p-3"><span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold uppercase">Paid</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )
  }

  // --- ADMIN VIEW ---
  const filteredStudents = studentsData.filter(s => s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) || s.email?.toLowerCase().includes(searchQuery.toLowerCase()))

  return (
    <div className="space-y-6 max-w-6xl mx-auto pb-10">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold text-slate-800">Student Fee Clearance</h1>
            <p className="text-sm text-slate-500">Monitor fee balances and exam eligibility for all students.</p>
          </div>
        </div>
      </div>

      <div className="relative">
        <Search className="w-5 h-5 absolute left-3 top-3 text-slate-400" />
        <input type="text" placeholder="Search student by name or email..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} className="w-full pl-10 pr-4 py-3 border rounded-xl shadow-sm focus:ring-2 focus:ring-brand-500 outline-none" />
      </div>

      {loadingAdmin ? <p className="text-center py-10">Loading student fee data...</p> : (
        <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>
                <th className="p-4">Student</th>
                <th className="p-4">Courses</th>
                <th className="p-4">Total Required</th>
                <th className="p-4 text-green-600">Total Paid</th>
                <th className="p-4 text-red-600">Remaining</th>
                <th className="p-4">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredStudents.map(s => (
                <tr key={s.id} className="border-b hover:bg-slate-50">
                  <td className="p-4">
                    <p className="font-bold text-slate-800">{s.full_name}</p>
                    <p className="text-xs text-slate-500">{s.email}</p>
                  </td>
                  <td className="p-4 font-medium">{s.courseCount}</td>
                  <td className="p-4">Ksh {s.totalRequired.toLocaleString()}</td>
                  <td className="p-4 font-bold text-green-600">Ksh {s.totalPaid.toLocaleString()}</td>
                  <td className="p-4 font-bold text-red-600">Ksh {s.remaining.toLocaleString()}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-24 bg-slate-100 rounded-full h-2 overflow-hidden">
                        <div className={`h-full ${s.progress === 100 ? 'bg-green-500' : 'bg-orange-400'}`} style={{ width: `${s.progress}%` }}></div>
                      </div>
                      <span className={`text-xs font-bold ${s.progress === 100 ? 'text-green-600' : 'text-orange-500'}`}>
                        {s.progress === 100 ? 'Cleared' : `${s.progress}%`}
                      </span>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredStudents.length === 0 && <tr><td colSpan="6" className="p-8 text-center text-slate-500">No students found.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}