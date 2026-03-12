import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import toast from 'react-hot-toast'
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

export default function Maintenance() {
  const [issues, setIssues] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('')
  const [updatingId, setUpdatingId] = useState(null)

  const load = () => {
    setLoading(true)
    const params = statusFilter ? `?status_filter=${statusFilter}` : ''
    api.get(`/api/maintenance${params}`).then(r => setIssues(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [statusFilter])

  const updateStatus = async (issue, newStatus) => {
    setUpdatingId(issue.id)
    try {
      await api.put(`/api/maintenance/${issue.id}`, { status: newStatus })
      toast.success('Status updated')
      load()
    } catch {
      toast.error('Failed to update status')
    } finally {
      setUpdatingId(null)
    }
  }

  return (
    <div>
      <div className="page-header-row page-header">
        <div>
          <h2>Maintenance Issues</h2>
          <p>Track and manage facility issues</p>
        </div>
        <Link to="/maintenance/new" className="btn btn-primary">+ New Issue</Link>
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
          </div>
        </div>
        {loading ? <LoadingCenter /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Location</th>
                  <th>Description</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Reported By</th>
                  <th>Date</th>
                  <th>Update</th>
                </tr>
              </thead>
              <tbody>
                {issues.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><h3>No issues found</h3></div></td></tr>
                ) : issues.map(issue => (
                  <tr key={issue.id}>
                    <td className="text-xs text-muted">#{issue.id}</td>
                    <td><strong>{issue.location}</strong></td>
                    <td style={{ maxWidth: 240 }}><span style={{ fontSize: '0.8rem' }}>{issue.description}</span></td>
                    <td><PriorityBadge priority={issue.priority} /></td>
                    <td><StatusBadge status={issue.status} /></td>
                    <td className="text-sm">{issue.reporter_name}</td>
                    <td className="text-xs text-muted">{new Date(issue.created_at).toLocaleDateString()}</td>
                    <td>
                      {issue.status !== 'resolved' && (
                        <select
                          className="form-control"
                          style={{ width: 'auto', fontSize: '0.75rem', padding: '4px 8px' }}
                          value={issue.status}
                          disabled={updatingId === issue.id}
                          onChange={e => updateStatus(issue, e.target.value)}
                        >
                          <option value="open">Open</option>
                          <option value="in_progress">In Progress</option>
                          <option value="resolved">Resolved</option>
                        </select>
                      )}
                    </td>
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
