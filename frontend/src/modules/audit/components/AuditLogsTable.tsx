import type { AuditLogEntry } from '@/types'

interface AuditLogsTableProps {
  logs: AuditLogEntry[]
  loading?: boolean
}

function formatValue(val: any): string {
  if (val === null || val === undefined || val === '') return '—'
  if (typeof val === 'object') {
    if (Array.isArray(val)) {
      if (val.length > 0 && typeof val[0] === 'object') {
        return val.map((item: any) => {
          const name = item.product_name || item.name || 'Unknown'
          const qty = item.ordered_quantity || item.quantity || 0
          return `${name} (${qty})`
        }).join(', ')
      }
      return val.map(item => String(item)).join(', ')
    }
    if (val.name) return val.name
    return JSON.stringify(val)
  }
  return String(val)
}

export default function AuditLogsTable({ logs, loading }: AuditLogsTableProps) {
  return (
    <div className="w-full overflow-hidden border border-slate-300 bg-white rounded-lg">
      <table className="w-full text-left text-sm text-slate-800">
        <thead className="border-b border-slate-300 bg-slate-50">
          <tr>
            <th className="px-4 py-3 font-semibold text-slate-600">Date & Time</th>
            <th className="px-4 py-3 font-semibold text-slate-600 text-center">User</th>
            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Module</th>
            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Record Ref</th>
            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Action</th>
            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Field Changed</th>
            <th className="px-4 py-3 font-semibold text-slate-600 text-center">Old Value</th>
            <th className="px-4 py-3 font-semibold text-slate-600 text-center">New Value</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {loading ? (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">
                Loading audit logs...
              </td>
            </tr>
          ) : logs.length === 0 ? (
            <tr>
              <td colSpan={8} className="px-4 py-10 text-center text-slate-400 text-sm">
                No audit log entries found. Actions like creating or updating Sales Orders, Purchase Orders, and Manufacturing Orders will appear here.
              </td>
            </tr>
          ) : (
            logs.map((log) => (
              <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-4 py-3 whitespace-nowrap">{log.dateTime}</td>
                <td className="px-4 py-3 text-center">{log.user}</td>
                <td className="px-4 py-3 text-center">
                  <span className="inline-block px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-50 text-indigo-700">
                    {log.module}
                  </span>
                </td>
                <td className="px-4 py-3 text-center font-mono text-xs">{log.recordId}</td>
                <td className="px-4 py-3 text-center">
                  <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${
                    log.action === 'Created' ? 'bg-green-100 text-green-700' :
                    log.action === 'Deleted' ? 'bg-red-100 text-red-700' :
                    log.action === 'Updated' ? 'bg-blue-100 text-blue-700' :
                    'bg-amber-100 text-amber-700'
                  }`}>
                    {log.action}
                  </span>
                </td>
                <td className="px-4 py-3 text-center text-slate-500">{log.fieldChanged}</td>
                <td 
                  className="px-4 py-3 text-center text-red-500 max-w-[120px] truncate"
                  title={formatValue(log.oldValue)}
                >
                  {formatValue(log.oldValue)}
                </td>
                <td 
                  className="px-4 py-3 text-center text-green-600 max-w-[120px] truncate"
                  title={formatValue(log.newValue)}
                >
                  {formatValue(log.newValue)}
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}
