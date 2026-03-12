import React, { useEffect, useState } from 'react'
import api from '../../api/client'
import { LoadingCenter } from '../../components/LoadingSpinner'
import { format } from 'date-fns'

export default function EmployeeDashboard() {
  const [stats, setStats] = useState(null)
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([
      api.get('/api/bookings/today'),
      api.get('/api/bookings?status=confirmed'),
    ]).then(([statsRes, bookingsRes]) => {
      setStats(statsRes.data)
      setBookings(bookingsRes.data.slice(0, 5))
    }).finally(() => setLoading(false))
  }, [])

  if (loading) return <LoadingCenter />

  const today = format(new Date(), 'EEEE, MMMM d, yyyy')

  return (
    <div>
      <div className="page-header">
        <h2>Dashboard</h2>
        <p>{today}</p>
      </div>

      <div className="stat-cards">
        <div className="stat-card blue">
          <div className="stat-card-label">Today's Check-Ins</div>
          <div className="stat-card-value">{stats?.check_ins ?? 0}</div>
          <div className="stat-card-sub">guests arriving today</div>
        </div>
        <div className="stat-card gold">
          <div className="stat-card-label">Today's Check-Outs</div>
          <div className="stat-card-value">{stats?.check_outs ?? 0}</div>
          <div className="stat-card-sub">guests departing today</div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-label">Currently Occupied</div>
          <div className="stat-card-value">{stats?.occupied ?? 0}</div>
          <div className="stat-card-sub">of {stats?.total_rooms ?? 0} active rooms</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Available Rooms</div>
          <div className="stat-card-value">{Math.max(0, (stats?.total_rooms ?? 0) - (stats?.occupied ?? 0))}</div>
          <div className="stat-card-sub">ready for booking</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header">
          <h3>Recent Confirmed Bookings</h3>
        </div>
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
              </tr>
            </thead>
            <tbody>
              {bookings.length === 0 ? (
                <tr><td colSpan={6} style={{ textAlign: 'center', color: 'var(--gray-400)', padding: 32 }}>No bookings yet</td></tr>
              ) : bookings.map(b => (
                <tr key={b.id}>
                  <td><span className="text-muted text-xs">#{b.id}</span></td>
                  <td><strong>{b.guest_name}</strong><br /><span className="text-xs text-muted">{b.guest_email}</span></td>
                  <td>{b.room?.name ?? `Room ${b.room_id}`}</td>
                  <td>{b.check_in}</td>
                  <td>{b.check_out}</td>
                  <td><strong>GYD ${Number(b.total_price).toLocaleString()}</strong></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
