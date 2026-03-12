import React, { useEffect, useState } from 'react'
import api from '../../api/client'
import { LoadingCenter } from '../../components/LoadingSpinner'

export default function OwnerBookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')

  const fetchBookings = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (search) params.append('guest_name', search)
    if (dateFrom) params.append('date_from', dateFrom)
    if (dateTo) params.append('date_to', dateTo)
    api.get(`/api/bookings?${params}`).then(r => setBookings(r.data)).finally(() => setLoading(false))
  }

  const clearFilters = () => {
    setSearch(''); setStatusFilter(''); setDateFrom(''); setDateTo('')
  }

  useEffect(() => { fetchBookings() }, [statusFilter])

  return (
    <div>
      <div className="page-header">
        <h2>All Bookings</h2>
        <p>Read-only view of all guest reservations</p>
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <form className="filter-bar" onSubmit={e => { e.preventDefault(); fetchBookings() }}>
            <input className="search-input" placeholder="Search by guest name..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <input type="date" className="form-control" style={{ width: 'auto' }} value={dateFrom} onChange={e => setDateFrom(e.target.value)} title="Check-in from" />
            <input type="date" className="form-control" style={{ width: 'auto' }} value={dateTo} onChange={e => setDateTo(e.target.value)} title="Check-in to" />
            <button type="submit" className="btn btn-navy btn-sm">Search</button>
            {(search || statusFilter || dateFrom || dateTo) && (
              <button type="button" className="btn btn-outline btn-sm" onClick={() => { clearFilters(); setTimeout(fetchBookings, 0) }}>Clear</button>
            )}
          </form>
        </div>
        {loading ? <LoadingCenter /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr><th>#</th><th>Guest</th><th>Room</th><th>Check-In</th><th>Check-Out</th><th>Total</th><th>Payment</th><th>Employee</th><th>Status</th></tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={9}><div className="empty-state"><h3>No bookings found</h3></div></td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id}>
                    <td className="text-xs text-muted">#{b.id}</td>
                    <td><strong>{b.guest_name}</strong><br /><span className="text-xs text-muted">{b.guest_email}</span></td>
                    <td>{b.room?.name ?? `Room ${b.room_id}`}</td>
                    <td>{b.check_in}</td>
                    <td>{b.check_out}</td>
                    <td><strong>GYD ${Number(b.total_price).toLocaleString()}</strong></td>
                    <td><span className="badge badge-blue">{b.payment_method}</span></td>
                    <td className="text-sm">{b.employee?.username}</td>
                    <td>{b.status === 'confirmed' ? <span className="badge badge-green">Confirmed</span> : <span className="badge badge-red">Cancelled</span>}</td>
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
