import React, { useEffect, useState } from 'react'
import api from '../../api/client'
import { LoadingCenter } from '../../components/LoadingSpinner'

function PriorityBadge({ priority }) {
  const map = { low: 'badge-green', medium: 'badge-orange', urgent: 'badge-red' }
  return <span className={`badge ${map[priority] || 'badge-gray'}`}>{priority}</span>
}

function StatusBadge({ status }) {
  const map = { open: 'badge-blue', in_progress: 'badge-orange', resolved: 'badge-green' }
  const labels = { open: 'Open', in_progress: 'In Progress', resolved: 'Resolved' }
  return <span className={`badge ${map[status] || 'badge-gray'}`}>{labels[status] || status}</span>
}

export default function OwnerMaintenance() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')

  useEffect(() => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.append('status_filter', statusFilter)
    if (priorityFilter) params.append('priority_filter', priorityFilter)
    api.get(`/api/maintenance?${params}`).then(r => setIssues(r.data)).finally(() => setLoading(false))
  }, [statusFilter, priorityFilter])

  return (
    <div>
      <div className="page-header">
        <h2>Maintenance Issues</h2>
        <p>Read-only overview of all facility issues</p>
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <div className="filter-bar">
            <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="open">Open</option>
              <option value="in_progress">In Progress</option>
              <option value="resolved">Resolved</option>
            </select>
            <select className="form-control" style={{ width: 'auto' }} value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}>
              <option value="">All Priority</option>
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="urgent">Urgent</option>
            </select>
          </div>
        </div>
        {loading ? <LoadingCenter /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Location</th><th>Description</th><th>Priority</th><th>Status</th><th>Reported By</th><th>Date</th></tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><h3>No issues found</h3></div></td></tr>
                ) : issues.map(issue => (
                  <tr key={issue.id}>
                    <td className="text-xs text-muted">#{issue.id}</td>
                    <td><strong>{issue.location}</strong></td>
                    <td style={{ maxWidth: 260, fontSize: '0.8rem' }}>{issue.description}</td>
                    <td><PriorityBadge priority={issue.priority} /></td>
                    <td><StatusBadge status={issue.status} /></td>
                    <td className="text-sm">{issue.reporter_name}</td>
                    <td className="text-xs text-muted">{new Date(issue.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
