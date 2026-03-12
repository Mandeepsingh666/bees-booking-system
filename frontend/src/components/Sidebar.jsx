import React from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'

const Icon = ({ path, title }) => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-label={title}>
    <path d={path} />
  </svg>
)

const ICONS = {
  dashboard: "M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10",
  bookings: "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2z",
  newBooking: "M12 5v14m-7-7h14",
  maintenance: "M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z",
  rooms: "M1 22V8l11-6 11 6v14M9 22V16a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6",
  promo: "M9 14l6-6M15.5 8.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0zM8.5 14.5a.5.5 0 1 1-1 0 .5.5 0 0 1 1 0z M3.5 9.5A5 5 0 0 0 9 14M14 9a5 5 0 0 0-4.5 4.5",
  employees: "M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2 M23 21v-2a4 4 0 0 0-3-3.87 M16 3.13a4 4 0 0 1 0 7.75 M9 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0z",
  logout: "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4 M16 17l5-5-5-5 M21 12H9",
}

export default function Sidebar() {
  const { user, logout, isOwner } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
          <img src="/shelbees_suites_logo.png" alt="Shelbee's Suites" style={{width: '48px', height: '48px', objectFit: 'contain'}} />
          <h1>Shelbee's Suites</h1>
        </div>
        <p>{isOwner ? 'Owner Portal' : 'Staff Portal'}</p>
      </div>

      <nav className="sidebar-nav">
        {!isOwner && (
          <>
            <div className="sidebar-section">Operations</div>
            <NavLink to="/dashboard" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.dashboard} title="Dashboard" /> Dashboard
            </NavLink>
            <NavLink to="/bookings" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.bookings} title="Bookings" /> All Bookings
            </NavLink>
            <NavLink to="/bookings/new" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.newBooking} title="New Booking" /> New Booking
            </NavLink>
            <div className="sidebar-section">Facility</div>
            <NavLink to="/maintenance" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.maintenance} title="Maintenance" /> Maintenance
            </NavLink>
            <NavLink to="/maintenance/new" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.newBooking} title="New Issue" /> New Issue
            </NavLink>
          </>
        )}

        {isOwner && (
          <>
            <div className="sidebar-section">Overview</div>
            <NavLink to="/owner/dashboard" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.dashboard} title="Dashboard" /> Dashboard
            </NavLink>
            <NavLink to="/owner/bookings" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.bookings} title="Bookings" /> Bookings
            </NavLink>
            <NavLink to="/owner/maintenance" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.maintenance} title="Maintenance" /> Maintenance
            </NavLink>
            <div className="sidebar-section">Manage</div>
            <NavLink to="/owner/rooms" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.rooms} title="Rooms" /> Rooms
            </NavLink>
            <NavLink to="/owner/promo-codes" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.promo} title="Promo Codes" /> Promo Codes
            </NavLink>
            <NavLink to="/owner/employees" className={({ isActive }) => `sidebar-link${isActive ? ' active' : ''}`}>
              <Icon path={ICONS.employees} title="Employees" /> Employees
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-user">
          <strong>{user?.username}</strong>
          {isOwner ? 'Owner' : 'Employee'}
        </div>
        <button className="btn btn-outline btn-sm w-full" onClick={handleLogout} style={{ color: '#aaaaaa', borderColor: '#3a3a3a' }}>
          <Icon path={ICONS.logout} title="Logout" /> Logout
        </button>
      </div>
    </aside>
  )
}
