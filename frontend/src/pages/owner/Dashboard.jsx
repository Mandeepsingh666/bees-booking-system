import React, { useEffect, useState } from 'react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import api from '../../api/client'
import { LoadingCenter } from '../../components/LoadingSpinner'
import { format, parseISO } from 'date-fns'

export default function OwnerDashboard() {
  const [summary, setSummary] = useState(null)
  const [chartData, setChartData] = useState([])
  const [period, setPeriod] = useState('week')
  const [loading, setLoading] = useState(true)
  const [chartLoading, setChartLoading] = useState(false)

  useEffect(() => {
    api.get('/api/reports/summary').then(r => setSummary(r.data)).finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setChartLoading(true)
    api.get(`/api/reports/occupancy?period=${period}`)
      .then(r => setChartData(r.data.map(d => ({
        ...d,
        label: format(parseISO(d.date), period === 'year' ? 'MMM yyyy' : period === 'week' ? 'EEE d' : 'MMM d'),
      }))))
      .finally(() => setChartLoading(false))
  }, [period])

  if (loading) return <LoadingCenter />

  return (
    <div>
      <div className="page-header">
        <h2>Owner Dashboard</h2>
        <p>Overview of Shellby Suits performance</p>
      </div>

      <div className="stat-cards">
        <div className="stat-card gold">
          <div className="stat-card-label">Total Revenue</div>
          <div className="stat-card-value" style={{ fontSize: '1.5rem' }}>GYD ${Number(summary?.total_revenue || 0).toLocaleString()}</div>
          <div className="stat-card-sub">all confirmed bookings</div>
        </div>
        <div className="stat-card green">
          <div className="stat-card-label">Active Bookings</div>
          <div className="stat-card-value">{summary?.active_bookings ?? 0}</div>
          <div className="stat-card-sub">guests currently staying</div>
        </div>
        <div className="stat-card blue">
          <div className="stat-card-label">Total Bookings</div>
          <div className="stat-card-value">{summary?.total_bookings ?? 0}</div>
          <div className="stat-card-sub">all time confirmed</div>
        </div>
        <div className="stat-card">
          <div className="stat-card-label">Room Occupancy</div>
          <div className="stat-card-value">{summary?.occupied_rooms ?? 0}/{summary?.total_rooms ?? 0}</div>
          <div className="stat-card-sub">{summary?.available_rooms ?? 0} rooms available</div>
        </div>
      </div>

      <div className="card">
        <div className="card-header" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <h3>Room Occupancy</h3>
          <div className="chart-toggle">
            <button className={period === 'week' ? 'active' : ''} onClick={() => setPeriod('week')}>7 Days</button>
            <button className={period === 'month' ? 'active' : ''} onClick={() => setPeriod('month')}>30 Days</button>
            <button className={period === 'year' ? 'active' : ''} onClick={() => setPeriod('year')}>12 Months</button>
          </div>
        </div>
        <div className="card-body">
          {chartLoading ? <LoadingCenter /> : (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={chartData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="label" tick={{ fontSize: 11, fill: '#64748b' }} />
                <YAxis yAxisId={0} tick={{ fontSize: 11, fill: '#64748b' }} allowDecimals={false} />
                <YAxis yAxisId={1} orientation="right" tick={{ fontSize: 11, fill: '#64748b' }} tickFormatter={v => `$${(v/1000).toFixed(0)}k`} />
                <Tooltip
                  formatter={(value, name) => name === 'revenue' ? [`GYD $${Number(value).toLocaleString()}`, 'Revenue'] : [value, period === 'year' ? 'Bookings' : 'Occupied Rooms']}
                  labelStyle={{ fontWeight: 600 }}
                  contentStyle={{ fontSize: '0.8rem', borderRadius: 6 }}
                />
                <Bar yAxisId={0} dataKey="occupied" fill="#0f172a" radius={[4, 4, 0, 0]} name="Occupied Rooms" />
                <Bar yAxisId={1} dataKey="revenue" fill="#c9a84c" radius={[4, 4, 0, 0]} name="Revenue" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  )
}
