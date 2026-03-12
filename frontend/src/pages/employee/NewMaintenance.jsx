import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { Spinner } from '../../components/LoadingSpinner'

export default function NewMaintenance() {
  const navigate = useNavigate()
  const [form, setForm] = useState({ location: '', description: '', priority: 'medium' })
  const [image, setImage] = useState(null)
  const [submitting, setSubmitting] = useState(false)

  const set = (field) => (e) => setForm(f => ({ ...f, [field]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    try {
      const res = await api.post('/api/maintenance', form)
      if (image) {
        const fd = new FormData()
        fd.append('file', image)
        await api.post(`/api/maintenance/${res.data.id}/upload-image`, fd)
      }
      toast.success(`Issue #${res.data.id} reported${form.priority === 'urgent' ? ' — Owner notified!' : ''}`)
      navigate('/maintenance')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create issue')
    } finally {
      setSubmitting(false)
    }
  }

  const priorities = [
    { value: 'low', label: 'Low', color: '#15803d', desc: 'Non-urgent, can wait' },
    { value: 'medium', label: 'Medium', color: '#d97706', desc: 'Needs attention soon' },
    { value: 'urgent', label: 'Urgent', color: '#dc2626', desc: 'Immediate action required — owner notified' },
  ]

  return (
    <div>
      <div className="page-header">
        <h2>Report Maintenance Issue</h2>
        <p>Submit a new facility maintenance request</p>
      </div>

      <form onSubmit={handleSubmit} style={{ maxWidth: 600 }}>
        <div className="card">
          <div className="card-body">
            <div className="form-group">
              <label className="form-label required">Location / Suite</label>
              <input className="form-control" value={form.location} onChange={set('location')} placeholder="e.g. Suite 1A, Pool Area, General" required />
              <p className="form-hint">Enter the suite name or a general area description</p>
            </div>

            <div className="form-group">
              <label className="form-label required">Description</label>
              <textarea className="form-control" rows={4} value={form.description} onChange={set('description')} placeholder="Describe the issue in detail..." required />
            </div>

            <div className="form-group">
              <label className="form-label required">Priority</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 6 }}>
                {priorities.map(p => (
                  <label key={p.value} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 14px', border: `1.5px solid ${form.priority === p.value ? p.color : 'var(--gray-200)'}`, borderRadius: 'var(--radius)', cursor: 'pointer', background: form.priority === p.value ? `${p.color}11` : 'var(--white)', transition: 'all 0.15s' }}>
                    <input type="radio" name="priority" value={p.value} checked={form.priority === p.value} onChange={set('priority')} style={{ marginTop: 2 }} />
                    <div>
                      <div style={{ fontWeight: 600, color: p.color }}>{p.label}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--gray-500)' }}>{p.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
            <div className="form-group" style={{ marginTop: 8 }}>
              <label className="form-label">Photo (optional)</label>
              <label className="btn btn-outline btn-sm" style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                📎 {image ? image.name : 'Attach Image'}
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={e => setImage(e.target.files[0] || null)} />
              </label>
              {image && <button type="button" className="btn btn-ghost btn-xs" style={{ marginLeft: 8 }} onClick={() => setImage(null)}>✕ Remove</button>}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 16 }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/maintenance')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <Spinner /> : 'Submit Issue'}
          </button>
        </div>
      </form>
    </div>
  )
}
