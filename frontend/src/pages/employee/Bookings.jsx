import React, { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import api from '../../api/client'
import { LoadingCenter } from '../../components/LoadingSpinner'

function StatusBadge({ status }) {
  return status === 'confirmed'
    ? <span className="badge badge-green">Confirmed</span>
    : <span className="badge badge-red">Cancelled</span>
}

export default function Bookings() {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState('')

  const fetchBookings = () => {
    setLoading(true)
    const params = new URLSearchParams()
    if (statusFilter) params.append('status', statusFilter)
    if (search) params.append('guest_name', search)
    api.get(`/api/bookings?${params}`).then(r => setBookings(r.data)).finally(() => setLoading(false))
  }

  useEffect(() => { fetchBookings() }, [statusFilter])

  const handleSearch = (e) => {
    e.preventDefault()
    fetchBookings()
  }

  return (
    <div>
      <div className="page-header-row page-header">
        <div>
          <h2>Bookings</h2>
          <p>Manage all guest bookings</p>
        </div>
        <Link to="/bookings/new" className="btn btn-primary">+ New Booking</Link>
      </div>

      <div className="card">
        <div className="card-body" style={{ paddingBottom: 0 }}>
          <form className="filter-bar" onSubmit={handleSearch}>
            <input
              className="search-input"
              placeholder="Search by guest name..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <select className="form-control" style={{ width: 'auto' }} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">All Status</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
            <button type="submit" className="btn btn-navy btn-sm">Search</button>
          </form>
        </div>
        {loading ? <LoadingCenter /> : (
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Guest</th>
                  <th>Room</th>
                  <th>Check-In</th>
                  <th>Check-Out</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {bookings.length === 0 ? (
                  <tr><td colSpan={8}><div className="empty-state"><h3>No bookings found</h3></div></td></tr>
                ) : bookings.map(b => (
                  <tr key={b.id}>
                    <td className="text-xs text-muted">#{b.id}</td>
                    <td>
                      <strong>{b.guest_name}</strong><br />
                      <span className="text-xs text-muted">{b.guest_phone}</span>
                    </td>
                    <td>{b.room?.name ?? `Room ${b.room_id}`}</td>
                    <td>{b.check_in}</td>
                    <td>{b.check_out}</td>
                    <td><strong>GYD ${Number(b.total_price).toLocaleString()}</strong></td>
                    <td><StatusBadge status={b.status} /></td>
                    <td><Link to={`/bookings/${b.id}`} className="btn btn-outline btn-xs">View</Link></td>
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
