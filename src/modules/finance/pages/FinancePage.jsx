import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { useAuth } from '../../../hooks/useAuth.js'
import { DollarSign, MessageSquare } from 'lucide-react'

export default function FinancePage() {
  const { profile, role } = useAuth()
  const [records, setRecords] = useState([])
  const [queries, setQueries] = useState([])
  const [students, setStudents] = useState([])
  
  const [form, setForm] = useState({ student_id: '', description: '', amount: '' })
  const [queryForm, setQueryForm] = useState({ transaction_reference: '', issue_description: '' })

  const loadData = async () => {
    const { data: r } = await supabase.from('finance_records').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setRecords(r || [])

    const { data: q } = await supabase.from('finance_queries').select('*, profiles(full_name)').order('created_at', { ascending: false })
    setQueries(q || [])

    if (role === 'admin') {
      const { data: s } = await supabase.from('profiles').select('id, full_name').eq('role', 'student')
      setStudents(s || [])
    }
  }

  useEffect(() => { loadData() }, [role])

  const handleCreateRecord = async (e) => {
    e.preventDefault()
    await supabase.from('finance_records').insert([form])
    setForm({ student_id: '', description: '', amount: '' })
    loadData()
  }

  const handleSubmitQuery = async (e) => {
    e.preventDefault()
    await supabase.from('finance_queries').insert([{ ...queryForm, student_id: profile.id }])
    setQueryForm({ transaction_reference: '', issue_description: '' })
    loadData()
  }

  const markPaid = async (id) => {
    await supabase.from('finance_records').update({ status: 'paid' }).eq('id', id)
    loadData()
  }

  const resolveQuery = async (id, reply) => {
    await supabase.from('finance_queries').update({ status: 'resolved', admin_reply: reply }).eq('id', id)
    loadData()
  }

  const isAdmin = role === 'admin'

  return (
    <div className="space-y-8 max-w-5xl mx-auto">
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-green-100 text-green-600 rounded-lg flex items-center justify-center"><DollarSign className="w-6 h-6" /></div>
          <div>
            <h1 className="text-2xl font-bold">Finance & Fee Reconciliation</h1>
            <p className="text-sm text-slate-500">{isAdmin ? 'Manage student fee balances and resolve payment queries.' : 'View your fee statement and report payment issues.'}</p>
          </div>
        </div>

        {isAdmin && (
          <form onSubmit={handleCreateRecord} className="bg-white p-6 rounded-xl border flex gap-4 items-end">
            <div className="flex-1"><label className="block text-sm mb-1">Student</label>
              <select required value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})} className="w-full border p-2 rounded">
                <option value="">Select Student...</option>
                {students.map(s => <option key={s.id} value={s.id}>{s.full_name}</option>)}
              </select>
            </div>
            <div className="flex-1"><label className="block text-sm mb-1">Description</label><input required value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="w-full border p-2 rounded" placeholder="Tuition Fee" /></div>
            <div className="w-32"><label className="block text-sm mb-1">Amount (Ksh)</label><input required type="number" value={form.amount} onChange={e => setForm({...form, amount: e.target.value})} className="w-full border p-2 rounded" placeholder="50000" /></div>
            <button type="submit" className="bg-brand-600 text-white px-6 py-2 rounded-lg">Add Record</button>
          </form>
        )}

        <div className="bg-white rounded-xl border overflow-hidden mt-4">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>{isAdmin && <th className="p-3">Student</th>}<th className="p-3">Description</th><th className="p-3">Amount</th><th className="p-3">Status</th>{isAdmin && <th className="p-3">Action</th>}</tr>
            </thead>
            <tbody>
              {records.map(r => (
                <tr key={r.id} className="border-b">
                  {isAdmin && <td className="p-3 font-medium">{r.profiles?.full_name}</td>}
                  <td className="p-3">{r.description}</td>
                  <td className="p-3 font-bold">Ksh {r.amount}</td>
                  <td className="p-3"><span className={`px-2 py-1 rounded text-xs font-bold uppercase ${r.status === 'paid' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>{r.status}</span></td>
                  {isAdmin && <td className="p-3">{r.status !== 'paid' && <button onClick={() => markPaid(r.id)} className="text-sm text-brand-600 font-medium">Mark Paid</button>}</td>}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="pt-8 border-t border-slate-200">
        <div className="flex items-center gap-3 mb-4">
          <MessageSquare className="w-6 h-6 text-slate-500" />
          <h2 className="text-xl font-bold">Payment Queries & Reconciliation</h2>
        </div>

        {!isAdmin && (
          <form onSubmit={handleSubmitQuery} className="bg-white p-6 rounded-xl border shadow-sm space-y-4 mb-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <input required placeholder="Transaction Reference (e.g. MPESA Code)" value={queryForm.transaction_reference} onChange={e => setQueryForm({...queryForm, transaction_reference: e.target.value})} className="w-full border p-2 rounded" />
              <input required placeholder="Describe the issue..." value={queryForm.issue_description} onChange={e => setQueryForm({...queryForm, issue_description: e.target.value})} className="w-full border p-2 rounded" />
            </div>
            <button type="submit" className="bg-navy-900 text-white px-4 py-2 rounded-lg text-sm">Submit Payment Query</button>
          </form>
        )}

        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr>{isAdmin && <th className="p-3">Student</th>}<th className="p-3">Ref Code</th><th className="p-3">Issue</th><th className="p-3">Status / Reply</th>{isAdmin && <th className="p-3">Action</th>}</tr>
            </thead>
            <tbody>
              {queries.map(q => (
                <tr key={q.id} className="border-b">
                  {isAdmin && <td className="p-3 font-medium">{q.profiles?.full_name}</td>}
                  <td className="p-3 font-mono text-xs">{q.transaction_reference}</td>
                  <td className="p-3 text-slate-600">{q.issue_description}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded text-xs font-bold uppercase ${q.status === 'resolved' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>{q.status}</span>
                    {q.admin_reply && <p className="text-xs text-slate-500 mt-1">Reply: {q.admin_reply}</p>}
                  </td>
                  {isAdmin && <td className="p-3">
                    {q.status === 'pending' && (
                      <button onClick={() => {
                        const reply = prompt("Enter resolution reply:");
                        if(reply) resolveQuery(q.id, reply);
                      }} className="text-sm text-brand-600 font-medium">Resolve</button>
                    )}
                  </td>}
                </tr>
              ))}
              {queries.length === 0 && <tr><td colSpan={isAdmin ? 5 : 4} className="p-6 text-center text-slate-500">No payment queries found.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}