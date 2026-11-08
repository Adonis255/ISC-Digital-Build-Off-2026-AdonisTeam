import fs from 'fs';

const content = `import { useEffect, useState } from 'react'
import { supabase } from '../../../services/supabase/client.js'
import { ShieldAlert } from 'lucide-react'

export default function AuditLogsPage() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      // The explicit alias "actor:profiles!actor_id" fixes the join issue
      const { data, error } = await supabase
        .from('audit_logs')
        .select('*, actor:profiles!actor_id(full_name)')
        .order('created_at', { ascending: false })
      
      if (error) {
        console.error("Audit Log Error:", error)
      } else {
        setLogs(data || [])
      }
      setLoading(false)
    })()
  }, [])

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 bg-slate-800 text-white rounded-lg flex items-center justify-center"><ShieldAlert className="w-6 h-6" /></div>
        <div>
          <h1 className="text-2xl font-bold">System Audit Logs</h1>
          <p className="text-sm text-slate-500">Track important administrative actions.</p>
        </div>
      </div>

      {loading ? <p>Loading logs...</p> : (
        <div className="bg-white rounded-xl border overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b">
              <tr><th className="p-3">Date</th><th className="p-3">Admin</th><th className="p-3">Action</th><th className="p-3">Details</th></tr>
            </thead>
            <tbody>
              {logs.map(log => (
                <tr key={log.id} className="border-b">
                  <td className="p-3 text-slate-500">{new Date(log.created_at).toLocaleString()}</td>
                  <td className="p-3 font-medium">{log.actor?.full_name || 'System'}</td>
                  <td className="p-3"><span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">{log.action}</span></td>
                  <td className="p-3 text-slate-600">{log.details}</td>
                </tr>
              ))}
              {logs.length === 0 && <tr><td colSpan="4" className="p-6 text-center text-slate-500">No audit logs recorded yet.</td></tr>}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}`;

fs.writeFileSync('src/modules/administration/pages/AuditLogsPage.jsx', content);
console.log("✅ Audit Logs fixed!");