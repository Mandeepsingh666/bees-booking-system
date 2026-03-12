import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { Spinner } from '../../components/LoadingSpinner'

export default function NewBooking() {
  const navigate = useNavigate()
  const [rooms, setRooms] = useState([])
  const [form, setForm] = useState({
    guest_name: '', guest_email: '', guest_phone: '',
    room_id: '', check_in: '', check_out: '',
    num_guests: 1, payment_method: 'cash', promo_code: '',
  })
  const [idFile, setIdFile] = useState(null)
  const [promo, setPromo] = useState(null)
  const [promoMsg, setPromoMsg] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [price, setPrice] = useState(null)

  useEffect(() => {
    api.get('/api/rooms').then(r => setRooms(r.data))
  }, [])

  const set = (field) => (e) => {
    setForm(f => ({ ...f, [field]: e.target.value }))
    if (field === 'room_id' || field === 'check_in' || field === 'check_out') setPrice(null)
  }

  useEffect(() => {
    if (form.room_id && form.check_in && form.check_out && form.check_out > form.check_in) {
      const room = rooms.find(r => r.id === parseInt(form.room_id))
      if (room) {
        const nights = Math.ceil((new Date(form.check_out) - new Date(form.check_in)) / 86400000)
        const subtotal = nights * Number(room.price_per_night)
        const discount = promo
          ? (promo.discount_type === 'percentage'
            ? subtotal * Number(promo.discount_value) / 100
            : Number(promo.discount_value))
          : 0
        setPrice({ nights, subtotal, discount: Math.min(discount, subtotal), total: subtotal - Math.min(discount, subtotal), pricePer: Number(room.price_per_night) })
      }
    } else {
      setPrice(null)
    }
  }, [form.room_id, form.check_in, form.check_out, promo, rooms])

  const validatePromo = async () => {
    if (!form.promo_code) return
    if (!form.room_id || !form.check_in || !form.check_out) {
      toast.error('Select a room and dates first')
      return
    }
    setPromoLoading(true)
    setPromoMsg('')
    try {
      const res = await api.post('/api/promo-codes/validate', {
        code: form.promo_code,
        room_id: parseInt(form.room_id),
        check_in: form.check_in,
        check_out: form.check_out,
      })
      if (res.data.valid) {
        setPromo(res.data)
        setPromoMsg(res.data.message)
      } else {
        setPromo(null)
        setPromoMsg(res.data.message)
      }
    } catch {
      setPromo(null)
      setPromoMsg('Error validating promo code')
    } finally {
      setPromoLoading(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (form.check_out <= form.check_in) { toast.error('Check-out must be after check-in'); return }
    setSubmitting(true)
    try {
      const payload = {
        ...form,
        room_id: parseInt(form.room_id),
        num_guests: parseInt(form.num_guests),
        promo_code: form.promo_code || null,
      }
      const res = await api.post('/api/bookings', payload)
      const bookingId = res.data.id

      if (idFile) {
        const fd = new FormData()
        fd.append('file', idFile)
        await api.post(`/api/bookings/${bookingId}/upload-id`, fd)
      }

      toast.success(`Booking #${bookingId} created! Invoice emailed to guest.`)
      navigate(`/bookings/${bookingId}`)
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to create booking')
    } finally {
      setSubmitting(false)
    }
  }

  const selectedRoom = rooms.find(r => r.id === parseInt(form.room_id))
  const today = new Date().toISOString().split('T')[0]

  return (
    <div>
      <div className="page-header">
        <h2>New Booking</h2>
        <p>Create a new guest reservation</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Guest Information</h3></div>
          <div className="card-body">
            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Guest Name</label>
                <input className="form-control" value={form.guest_name} onChange={set('guest_name')} placeholder="Full name" required />
              </div>
              <div className="form-group">
                <label className="form-label required">Phone</label>
                <input className="form-control" value={form.guest_phone} onChange={set('guest_phone')} placeholder="+592-000-0000" required />
              </div>
            </div>
            <div className="form-group">
              <label className="form-label required">Email</label>
              <input className="form-control" type="email" value={form.guest_email} onChange={set('guest_email')} placeholder="guest@email.com" required />
            </div>

            <div className="form-group">
              <label className="form-label">Guest ID Photo</label>
              <label className="file-upload-area" style={{ display: 'block', cursor: 'pointer' }}>
                <input type="file" accept="image/*,.pdf" onChange={e => setIdFile(e.target.files[0])} />
                {idFile
                  ? <p style={{ color: 'var(--navy)', fontWeight: 500 }}>📎 {idFile.name}</p>
                  : <p>Click to upload guest ID (JPG, PNG, or PDF)</p>
                }
              </label>
            </div>
          </div>
        </div>

        <div className="card" style={{ marginBottom: 20 }}>
          <div className="card-header"><h3>Reservation Details</h3></div>
          <div className="card-body">
            <div className="form-group">
              <label className="form-label required">Room</label>
              <select className="form-control" value={form.room_id} onChange={set('room_id')} required>
                <option value="">Select a room...</option>
                {rooms.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} — {r.type} — GYD ${Number(r.price_per_night).toLocaleString()}/night (max {r.capacity} guests)
                  </option>
                ))}
              </select>
              {selectedRoom && (
                <p className="form-hint">
                  {selectedRoom.amenities?.split('\n').join(' · ')}
                </p>
              )}
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Check-In</label>
                <input className="form-control" type="date" min={today} value={form.check_in} onChange={set('check_in')} required />
              </div>
              <div className="form-group">
                <label className="form-label required">Check-Out</label>
                <input className="form-control" type="date" min={form.check_in || today} value={form.check_out} onChange={set('check_out')} required />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label required">Number of Guests</label>
                <input className="form-control" type="number" min={1} max={selectedRoom?.capacity || 10} value={form.num_guests} onChange={set('num_guests')} required />
              </div>
              <div className="form-group">
                <label className="form-label required">Payment Method</label>
                <div className="radio-group" style={{ marginTop: 6 }}>
                  {['cash', 'card'].map(pm => (
                    <label key={pm} className={`radio-option ${form.payment_method === pm ? 'selected' : ''}`}>
                      <input type="radio" value={pm} checked={form.payment_method === pm} onChange={set('payment_method')} />
                      {pm.charAt(0).toUpperCase() + pm.slice(1)}
                    </label>
                  ))}
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Promo Code</label>
              <div style={{ display: 'flex', gap: 8 }}>
                <input className="form-control" value={form.promo_code} onChange={set('promo_code')} placeholder="Enter promo code" style={{ textTransform: 'uppercase' }} />
                <button type="button" className="btn btn-outline btn-sm" onClick={validatePromo} disabled={promoLoading} style={{ flexShrink: 0 }}>
                  {promoLoading ? <Spinner /> : 'Apply'}
                </button>
              </div>
              {promoMsg && <div className={promo ? 'promo-success' : 'promo-error'}>{promoMsg}</div>}
            </div>

            {price && (
              <div className="price-display">
                <div className="price-row"><span>{price.nights} night{price.nights !== 1 ? 's' : ''} × GYD ${price.pricePer.toLocaleString()}</span><span>GYD ${price.subtotal.toLocaleString()}</span></div>
                {price.discount > 0 && <div className="price-row" style={{ color: 'var(--green)' }}><span>Discount</span><span>- GYD ${price.discount.toLocaleString()}</span></div>}
                <div className="price-total"><span>Total</span><span>GYD ${price.total.toLocaleString()}</span></div>
              </div>
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button type="button" className="btn btn-outline" onClick={() => navigate('/bookings')}>Cancel</button>
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? <><Spinner /> Creating...</> : 'Create Booking'}
          </button>
        </div>
      </form>
    </div>
  )
}
