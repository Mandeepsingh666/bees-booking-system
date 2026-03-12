import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { LoadingCenter, Spinner } from '../../components/LoadingSpinner'

const EMPTY_FORM = { code: '', discount_type: 'percentage', discount_value: '', expiry_date: '', usage_limit: '' }

export default function OwnerPromoCodes() {
  const [promos, setPromos] = useState([])
  const [loading, setLoading] = useState(true)
  const [form, setForm] = useState(EMPTY_FORM)
  const [saving, setSaving] = useState(false)
  const [showForm, setShowForm] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/api/promo-codes').then(r => setPromos(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const set = (f) => (e) => setForm(p => ({ ...p, [f]: e.target.value }))

  const handleCreate = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = {
        ...form,
        discount_value: parseFloat(form.discount_value),
        usage_limit: form.usage_limit ? parseInt(form.usage_limit) : null,
      }
      await api.post('/api/promo-codes', payload)
      toast.success('Promo code created!')
      setForm(EMPTY_FORM)
      setShowForm(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create promo code')
    } finally {
      setSaving(false)
    }
  }

  const handleDeactivate = async (id, code) => {
    try {
      await api.put(`/api/promo-codes/${id}/deactivate`)
      toast.success(`${code} deactivated`)
      load()
    } catch {
      toast.error('Failed to deactivate')
    }
  }

  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div className="page-header-row page-header">
        <div><h2>Promo Codes</h2><p>Manage discount codes for guests</p></div>
        <button className="btn btn-primary" onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Cancel' : '+ Add Promo Code'}
        </button>
      </div>

      {showForm && (
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>New Promo Code</h3></div>
          <form onSubmit={handleCreate}>
            <div className="card-body">
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">Code</label>
                  <input className="form-control" value={form.code} onChange={set('code')} placeholder="SUMMER25" required style={{ textTransform: 'uppercase' }} />
                </div>
                <div className="form-group">
                  <label className="form-label required">Discount Type</label>
                  <select className="form-control" value={form.discount_type} onChange={set('discount_type')}>
                    <option value="percentage">Percentage (%)</option>
                    <option value="fixed">Fixed Amount (GYD $)</option>
                  </select>
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label className="form-label required">
                    {form.discount_type === 'percentage' ? 'Discount %' : 'Discount Amount (GYD)'}
                  </label>
                  <input className="form-control" type="number" min={0} step="0.01" value={form.discount_value} onChange={set('discount_value')} placeholder={form.discount_type === 'percentage' ? '10' : '5000'} required />
                </div>
                <div className="form-group">
                  <label className="form-label required">Expiry Date</label>
                  <input className="form-control" type="date" min={today} value={form.expiry_date} onChange={set('expiry_date')} required />
                </div>
              </div>
              <div className="form-group" style={{ maxWidth: 200 }}>
                <label className="form-label">Usage Limit</label>
                <input className="form-control" type="number" min={1} value={form.usage_limit} onChange={set('usage_limit')} placeholder="Unlimited" />
                <p className="form-hint">Leave empty for unlimited uses</p>
              </div>
            </div>
            <div className="modal-footer">
              <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
                {saving ? <Spinner /> : 'Create Code'}
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
                <tr><th>Code</th><th>Type</th><th>Value</th><th>Expiry</th><th>Uses</th><th>Status</th><th></th></tr>
              </thead>
              <tbody>
                {promos.length === 0 ? (
                  <tr><td colSpan={7}><div className="empty-state"><h3>No promo codes yet</h3></div></td></tr>
                ) : promos.map(p => (
                  <tr key={p.id}>
                    <td><strong style={{ fontFamily: 'monospace', fontSize: '0.9rem' }}>{p.code}</strong></td>
                    <td><span className="badge badge-blue">{p.discount_type}</span></td>
                    <td>{p.discount_type === 'percentage' ? `${p.discount_value}%` : `GYD $${Number(p.discount_value).toLocaleString()}`}</td>
                    <td>{p.expiry_date}</td>
                    <td>{p.times_used}{p.usage_limit ? ` / ${p.usage_limit}` : ' / ∞'}</td>
                    <td>{p.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Inactive</span>}</td>
                    <td>{p.is_active && <button className="btn btn-outline btn-xs" onClick={() => handleDeactivate(p.id, p.code)}>Deactivate</button>}</td>
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
