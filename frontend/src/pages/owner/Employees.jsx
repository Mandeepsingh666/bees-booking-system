import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { LoadingCenter, Spinner } from '../../components/LoadingSpinner'

const EMPTY_FORM = { username: '', email: '', password: '' }

export default function OwnerEmployees() {
  const [employees, setEmployees] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/api/employees').then(r => setEmployees(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      await api.post('/api/employees', { ...form, role: 'employee' })
      toast.success(`Employee ${form.username} created!`)
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create employee')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (emp) => {
    try {
      if (emp.is_active) {
        await api.put(`/api/employees/${emp.id}/deactivate`)
        toast.success(`${emp.username} deactivated`)
      } else {
        await api.put(`/api/employees/${emp.id}/activate`)
        toast.success(`${emp.username} activated`)
      }
      load()
    } catch {
      toast.error('Failed to update employee status')
    }
  }

  return (
    <div>
      <div className="page-header-row page-header">
        <div><h2>Employees</h2><p>Manage staff accounts</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ Add Employee'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20, maxWidth: 520 }}>
          <div className="card-header"><h3>New Employee Account</h3></div>
          <form onSubmit={handleCreate}>
            <div className="card-body">
              <div className="form-group">
                <label className="form-label required">Username</label>
                <input className="form-control" value={form.username} onChange={set('username')} placeholder="john_doe" required />
              </div>
              <div className="form-group">
                <label className="form-label required">Email</label>
                <input className="form-control" type="email" value={form.email} onChange={set('email')} placeholder="john@shellbysuits.com" required />
              </div>
              <div className="form-group">
                <label className="form-label required">Password</label>
                <input className="form-control" type="password" value={form.password} onChange={set('password')} placeholder="Strong password..." required minLength={8} />
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <Spinner /> : 'Create Account'}
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card">
        {loading ? <LoadingCenter /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Username</th><th>Email</th><th>Status</th><th>Created</th><th></th></tr>
              </thead>
              <tbody>
                {employees.length === 0 ? (
                  <tr><td colSpan={5}><div className="empty-state"><h3>No employees yet</h3></div></td></tr>
                ) : employees.map(emp => (
                  <tr key={emp.id}>
                    <td><strong>{emp.username}</strong></td>
                    <td>{emp.email}</td>
                    <td>{emp.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Inactive</span>}</td>
                    <td className="text-xs text-muted">{new Date(emp.created_at).toLocaleDateString()}</td>
                    <td>
                      <button className={`btn ${emp.is_active ? 'btn-danger' : 'btn-outline'} btn-xs`} onClick={() => toggleActive(emp)}>
                        {emp.is_active ? 'Deactivate' : 'Activate'}
                      </button>
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
