import React, { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { LoadingCenter, Spinner } from '../../components/LoadingSpinner'
import ConfirmDialog from '../../components/ConfirmDialog'

const EMPTY_FORM = { name: '', type: 'Standard', description: '', price_per_night: '', capacity: 2, amenities: '', is_active: true }

function RoomModal({ room, onClose, onSaved }) {
  const [form, setForm] = useState(room ? { ...room, price_per_night: String(room.price_per_night) } : EMPTY_FORM)
  const [saving, setSaving] = useState(false)

  const set = (f) => (e) => setForm(r => ({ ...r, [f]: e.target.value }))

  const handleSave = async (e) => {
    e.preventDefault()
    setSaving(true)
    try {
      const payload = { ...form, price_per_night: parseFloat(form.price_per_night), capacity: parseInt(form.capacity) }
      if (room) await api.put(`/api/rooms/${room.id}`, payload)
      else await api.post('/api/rooms', payload)
      toast.success(room ? 'Room updated' : 'Room created')
      onSaved()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to save room')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{room ? 'Edit Room' : 'Add New Room'}</h3>
          <button className="btn btn-ghost btn-icon" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSave}>
          <div className="modal-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Room Name</label>
                <input className="form-control" value={form.name} onChange={set('name')} placeholder="Suite 1A" required />
              </div>
              <div className="form-group">
                <label className="form-label required">Type</label>
                <select className="form-control" value={form.type} onChange={set('type')}>
                  <option>Standard</option>
                  <option>Deluxe</option>
                  <option>Penthouse</option>
                  <option>Suite</option>
                </select>
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Description</label>
              <textarea className="form-control" rows={2} value={form.description} onChange={set('description')} placeholder="Room description..." />
            </div>
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Price / Night (GYD)</label>
                <input className="form-control" type="number" min={0} step="0.01" value={form.price_per_night} onChange={set('price_per_night')} placeholder="15000" required />
              </div>
              <div className="form-group">
                <label className="form-label required">Capacity (guests)</label>
                <input className="form-control" type="number" min={1} max={20} value={form.capacity} onChange={set('capacity')} required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label">Amenities</label>
              <textarea className="form-control" rows={3} value={form.amenities} onChange={set('amenities')} placeholder="One amenity per line, e.g.&#10;WiFi&#10;Air Conditioning&#10;Mini Bar" />
              <p className="form-hint">Enter one amenity per line</p>
            </div>
          </div>
          <div className="modal-footer">
            <button type="button" className="btn btn-outline btn-sm" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary btn-sm" disabled={saving}>
              {saving ? <Spinner /> : (room ? 'Save Changes' : 'Create Room')}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default function OwnerRooms() {
  const [rooms, setRooms] = useState([])
  const [loading, setLoading] = useState(true)
  const [modal, setModal] = useState(null) // null | 'new' | room object
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [deleting, setDeleting] = useState(false)

  const load = () => {
    setLoading(true)
    api.get('/api/rooms?include_inactive=true').then(r => setRooms(r.data)).finally(() => setLoading(false))
  }
  useEffect(() => { load() }, [])

  const handleDelete = async () => {
    setDeleting(true)
    try {
      await api.delete(`/api/rooms/${deleteTarget.id}`)
      toast.success(`${deleteTarget.name} deactivated`)
      setDeleteTarget(null)
      load()
    } catch {
      toast.error('Failed to deactivate room')
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <div className="page-header-row page-header">
        <div><h2>Rooms</h2><p>Manage available suites and rooms</p></div>
        <button className="btn btn-primary" onClick={() => setModal('new')}>+ Add Room</button>
      </div>

      <div className="card">
        {loading ? <LoadingCenter /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>Name</th><th>Type</th><th>Price / Night</th><th>Capacity</th><th>Status</th><th>Actions</th></tr>
              </thead>
              <tbody>
                {rooms.map(room => (
                  <tr key={room.id}>
                    <td><strong>{room.name}</strong><br /><span className="text-xs text-muted">{room.description?.substring(0, 50)}{room.description?.length > 50 ? '…' : ''}</span></td>
                    <td>{room.type}</td>
                    <td>GYD ${Number(room.price_per_night).toLocaleString()}</td>
                    <td>{room.capacity} guests</td>
                    <td>{room.is_active ? <span className="badge badge-green">Active</span> : <span className="badge badge-gray">Inactive</span>}</td>
                    <td>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button className="btn btn-outline btn-xs" onClick={() => setModal(room)}>Edit</button>
                        {room.is_active
                          ? <button className="btn btn-danger btn-xs" onClick={() => setDeleteTarget(room)}>Deactivate</button>
                          : <button className="btn btn-outline btn-xs" onClick={async () => { await api.put(`/api/rooms/${room.id}`, { ...room, price_per_night: parseFloat(room.price_per_night), is_active: true }); toast.success(`${room.name} activated`); load() }}>Activate</button>
                        }
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal && <RoomModal room={modal === 'new' ? null : modal} onClose={() => setModal(null)} onSaved={() => { setModal(null); load() }} />}

      <ConfirmDialog
        isOpen={!!deleteTarget}
        title="Deactivate Room?"
        message={`${deleteTarget?.name} will be hidden from new bookings but existing bookings won't be affected.`}
        confirmLabel={deleting ? 'Deactivating...' : 'Deactivate'}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
      />
    </div>
  )
}
