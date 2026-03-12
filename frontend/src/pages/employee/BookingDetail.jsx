import React, { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import api from '../../api/client'
import { LoadingCenter, Spinner } from '../../components/LoadingSpinner'
import ConfirmDialog from '../../components/ConfirmDialog'

function Field({ label, value }) {
  return (
    <div className="detail-field">
      <label>{label}</label>
      <span>{value || '—'}</span>
    </div>
  )
}

export default function BookingDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [cancelDialog, setCancelDialog] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [cancelling, setCancelling] = useState(false)
  const [invoicing, setInvoicing] = useState(false)
  const [uploading, setUploading] = useState(false)

  const load = () => {
    setLoading(true)
    api.get(`/api/bookings/${id}`).then(r => setBooking(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [id])

  if (loading) return <LoadingCenter />
  if (!booking) return <div className="empty-state"><h3>Booking not found</h3></div>

  const nights = Math.ceil((new Date(booking.check_out) - new Date(booking.check_in)) / 86400000)
  const isCancelled = booking.status === 'cancelled'

  const handleCancel = async () => {
    if (!cancelReason.trim()) { toast.error('Please enter a reason'); return }
    setCancelling(true)
    try {
      await api.post(`/api/bookings/${id}/cancel`, { reason: cancelReason })
      toast.success('Booking cancelled. Guest notified.')
      setCancelDialog(false)
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to cancel booking')
    } finally {
      setCancelling(false)
    }
  }

  const handleGenerateInvoice = async () => {
    setInvoicing(true)
    try {
      await api.post(`/api/invoices/${id}/generate`)
      toast.success('Invoice generated and emailed to guest!')
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Failed to generate invoice')
    } finally {
      setInvoicing(false)
    }
  }

  const handleDownloadInvoice = async () => {
    try {
      const response = await api.get(`/api/invoices/${id}/download`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([response.data], { type: 'application/pdf' }))
      const a = document.createElement('a')
      a.href = url
      a.download = `invoice-booking-${id}.pdf`
      a.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      toast.error('No invoice found. Please generate it first.')
    }
  }

  const handleIdUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      await api.post(`/api/bookings/${id}/upload-id`, fd)
      toast.success('Guest ID uploaded successfully')
      load()
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <div className="page-header-row page-header">
        <div>
          <h2>Booking #{booking.id}</h2>
          <p>Created {new Date(booking.created_at).toLocaleDateString()}</p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button className="btn btn-outline btn-sm" onClick={() => navigate('/bookings')}>← Back</button>
          {!isCancelled && (
            <button className="btn btn-danger btn-sm" onClick={() => setCancelDialog(true)}>Cancel Booking</button>
          )}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 20 }}>
        <div>
          <div className="card" style={{ marginBottom: 16 }}>
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3>Booking Details</h3>
              <span className={`badge ${isCancelled ? 'badge-red' : 'badge-green'}`}>
                {booking.status.toUpperCase()}
              </span>
            </div>
            <div className="card-body">
              <div className="detail-grid">
                <Field label="Guest Name" value={booking.guest_name} />
                <Field label="Email" value={booking.guest_email} />
                <Field label="Phone" value={booking.guest_phone} />
                <Field label="Room" value={booking.room?.name} />
                <Field label="Check-In" value={booking.check_in} />
                <Field label="Check-Out" value={booking.check_out} />
                <Field label="Nights" value={nights} />
                <Field label="Guests" value={booking.num_guests} />
                <Field label="Payment Method" value={booking.payment_method?.toUpperCase()} />
                <Field label="Employee" value={booking.employee?.username} />
              </div>
              {isCancelled && (
                <div style={{ marginTop: 16, background: 'rgba(239,68,68,0.10)', border: '1px solid rgba(239,68,68,0.30)', borderRadius: 6, padding: '12px 14px' }}>
                  <strong style={{ color: '#f87171' }}>Cancellation Reason:</strong>
                  <p style={{ color: '#fca5a5', marginTop: 4, fontSize: '0.875rem' }}>{booking.cancellation_reason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="card">
            <div className="card-header"><h3>Pricing</h3></div>
            <div className="card-body">
              <div className="price-display">
                <div className="price-row">
                  <span>{nights} night{nights !== 1 ? 's' : ''} × GYD ${booking.room ? Number(booking.room.price_per_night).toLocaleString() : '—'}</span>
                  <span>GYD ${(nights * Number(booking.room?.price_per_night || 0)).toLocaleString()}</span>
                </div>
                {Number(booking.discount_applied) > 0 && (
                  <div className="price-row" style={{ color: 'var(--green)' }}>
                    <span>Discount</span>
                    <span>- GYD ${Number(booking.discount_applied).toLocaleString()}</span>
                  </div>
                )}
                <div className="price-total">
                  <span>Total</span>
                  <span>GYD ${Number(booking.total_price).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Invoice actions */}
          {!isCancelled && (
            <div className="card">
              <div className="card-header"><h3>Invoice</h3></div>
              <div className="card-body" style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button className="btn btn-primary w-full" onClick={handleGenerateInvoice} disabled={invoicing} style={{ justifyContent: 'center' }}>
                  {invoicing ? <Spinner /> : '📧 Generate & Email Invoice'}
                </button>
                <button className="btn btn-outline w-full" onClick={handleDownloadInvoice} style={{ justifyContent: 'center' }}>
                  ⬇ Download PDF
                </button>
              </div>
            </div>
          )}

          {/* Guest ID */}
          <div className="card">
            <div className="card-header"><h3>Guest ID</h3></div>
            <div className="card-body">
              {booking.guest_id_image_path ? (
                <div>
                  <p className="text-sm text-muted" style={{ marginBottom: 8 }}>ID on file</p>
                  <a href={`/api/bookings/${id}/id-image`} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm w-full" style={{ justifyContent: 'center' }}>View ID</a>
                </div>
              ) : (
                <p className="text-sm text-muted" style={{ marginBottom: 8 }}>No ID uploaded</p>
              )}
              <label className="btn btn-outline btn-sm w-full" style={{ marginTop: 8, justifyContent: 'center', cursor: 'pointer' }}>
                {uploading ? <Spinner /> : '📎 Upload Guest ID'}
                <input type="file" accept="image/*,.pdf" onChange={handleIdUpload} style={{ display: 'none' }} />
              </label>
            </div>
          </div>
        </div>
      </div>

      <ConfirmDialog
        isOpen={cancelDialog}
        title="Cancel Booking?"
        message={`This will cancel booking #${booking.id} for ${booking.guest_name}. The guest will be notified by email.`}
        confirmLabel={cancelling ? 'Cancelling...' : 'Yes, Cancel Booking'}
        onCancel={() => { setCancelDialog(false); setCancelReason('') }}
        onConfirm={handleCancel}
      >
        <div className="form-group" style={{ marginBottom: 12 }}>
          <label className="form-label required">Cancellation Reason</label>
          <textarea className="form-control" rows={3} value={cancelReason} onChange={e => setCancelReason(e.target.value)} placeholder="Reason for cancellation..." />
        </div>
      </ConfirmDialog>
    </div>
  )
}
