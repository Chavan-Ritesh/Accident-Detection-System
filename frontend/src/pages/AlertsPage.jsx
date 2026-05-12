import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import alertsAPI from '../api/alertsAPI'
import {
  AlertTriangle, Car, User, RotateCcw,
  CheckCircle, Clock, Camera, Filter,
  Download, Eye, RefreshCw
} from 'lucide-react'

const accidentConfig = {
  COLLISION: {
    icon: <Car className="w-4 h-4" />,
    label: 'Vehicle Collision',
    color: 'text-red-400',
    bg: 'bg-red-400/10'
  },
  PERSON_HIT: {
    icon: <User className="w-4 h-4" />,
    label: 'Person Hit',
    color: 'text-red-500',
    bg: 'bg-red-500/10'
  },
  ROLLOVER: {
    icon: <RotateCcw className="w-4 h-4" />,
    label: 'Vehicle Rollover',
    color: 'text-orange-400',
    bg: 'bg-orange-400/10'
  },
}

const severityConfig = {
  CRITICAL: { color: 'text-red-400', bg: 'bg-red-400/10', border: 'border-red-400/30' },
  HIGH: { color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/30' },
  MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', border: 'border-yellow-400/30' },
  LOW: { color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/30' },
}

const AlertRow = ({ alert, onAcknowledge, onView }) => {
  const accType = alert.accident?.accident_type || 'COLLISION'
  const accident = accidentConfig[accType] || accidentConfig.COLLISION
  const severity = severityConfig[alert.severity] || severityConfig.LOW

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown'
    const date = new Date(timestamp)
    const now = new Date()
    const diff = Math.floor((now - date) / 1000)
    if (diff < 60) return `${diff}s ago`
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
    return `${Math.floor(diff / 3600)}h ago`
  }

  return (
    <div className={`p-4 bg-dark-300 rounded-xl border ${severity.border}
      hover:bg-dark-100 transition-all duration-200
      ${alert.acknowledged ? 'opacity-60' : ''}
    `}>
      <div className="flex items-start gap-4">

        {/* Accident Icon */}
        <div className={`p-2 rounded-lg flex-shrink-0 ${accident.bg}`}>
          <span className={accident.color}>{accident.icon}</span>
        </div>

        {/* Main Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-3 flex-wrap">
            <div>
              <p className="text-white font-medium text-sm">
                {accident.label}
              </p>
              <div className="flex items-center gap-3 mt-1 flex-wrap">
                <span className="text-gray-500 text-xs flex items-center gap-1">
                  <Camera className="w-3 h-3" />
                  Camera {alert.accident?.camera_id}
                </span>
                <span className="text-gray-500 text-xs flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {formatTime(alert.created_at)}
                </span>
                <span className="text-gray-500 text-xs">
                  📍 {alert.accident?.road_name || 'Highway'}
                </span>
              </div>
              <div className="flex items-center gap-3 mt-1">
                {alert.accident?.vehicles_involved > 0 && (
                  <span className="text-gray-400 text-xs">
                    🚗 {alert.accident.vehicles_involved} vehicle(s)
                  </span>
                )}
                {alert.accident?.persons_involved > 0 && (
                  <span className="text-gray-400 text-xs">
                    🚶 {alert.accident.persons_involved} person(s)
                  </span>
                )}
                <span className="text-gray-400 text-xs">
                  📊 {Math.round(
                    (alert.accident?.confidence || 0) * 100
                  )}% confidence
                </span>
              </div>

              {/* Email & SMS Status */}
              <div className="flex items-center gap-2 mt-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  alert.email_sent
                    ? 'bg-success/10 text-success'
                    : 'bg-dark-400 text-gray-600'
                }`}>
                  📧 {alert.email_sent ? 'Email Sent' : 'No Email'}
                </span>
                <span className={`text-xs px-2 py-0.5 rounded-full ${
                  alert.sms_sent
                    ? 'bg-success/10 text-success'
                    : 'bg-dark-400 text-gray-600'
                }`}>
                  📱 {alert.sms_sent ? 'SMS Sent' : 'No SMS'}
                </span>
              </div>
            </div>

            {/* Right Side */}
            <div className="flex flex-col items-end gap-2">
              <span className={`text-xs px-2 py-1 rounded-full font-medium
                ${severity.bg} ${severity.color}`}>
                {alert.severity}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onView(alert)}
                  className="flex items-center gap-1 px-2 py-1 bg-primary-900/50 hover:bg-primary-800 text-primary-400 rounded-lg text-xs transition-all"
                >
                  <Eye className="w-3 h-3" />
                  View
                </button>
                {!alert.acknowledged ? (
                  <button
                    onClick={() => onAcknowledge(alert.id)}
                    className="flex items-center gap-1 px-2 py-1 bg-success/10 hover:bg-success/20 text-success rounded-lg text-xs transition-all"
                  >
                    <CheckCircle className="w-3 h-3" />
                    Acknowledge
                  </button>
                ) : (
                  <span className="flex items-center gap-1 text-success text-xs">
                    <CheckCircle className="w-3 h-3" />
                    Acknowledged
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

const AlertsPage = () => {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('ALL')
  const [severityFilter, setSeverityFilter] = useState('ALL')
  const [selectedAlert, setSelectedAlert] = useState(null)
  const [stats, setStats] = useState(null)

  const fetchAlerts = async () => {
    try {
      setLoading(true)
      const [alertsRes, statsRes] = await Promise.all([
        alertsAPI.getAlerts({ limit: 50 }),
        alertsAPI.getStats()
      ])
      if (alertsRes.success) setAlerts(alertsRes.alerts)
      if (statsRes.success) setStats(statsRes.stats)
    } catch (error) {
      console.error('Alerts fetch error:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAlerts()
    const interval = setInterval(fetchAlerts, 30000)
    return () => clearInterval(interval)
  }, [])

  const handleAcknowledge = async (alertId) => {
    try {
      const res = await alertsAPI.acknowledgeAlert(alertId)
      if (res.success) {
        setAlerts(prev => prev.map(a =>
          a.id === alertId ? { ...a, acknowledged: true } : a
        ))
      }
    } catch (error) {
      console.error('Acknowledge error:', error)
    }
  }

  const handleView = (alert) => setSelectedAlert(alert)

  // Filter alerts
  const filteredAlerts = alerts.filter(a => {
    const typeMatch = filter === 'ALL' ||
      a.accident?.accident_type === filter
    const severityMatch = severityFilter === 'ALL' ||
      a.severity === severityFilter
    return typeMatch && severityMatch
  })

  const unacknowledged = alerts.filter(a => !a.acknowledged).length

  return (
    <div className="min-h-screen bg-dark-400">
      <Sidebar />

      <div className="ml-64">
        <Navbar title="Alerts" />

        <div className="pt-16 p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-white font-semibold text-lg">
                Accident Alerts
              </h2>
              <p className="text-gray-500 text-sm">
                {unacknowledged} unacknowledged alerts
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={fetchAlerts}
                className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-100 text-gray-300 rounded-xl text-sm border border-dark-100 transition-all"
              >
                <RefreshCw className="w-4 h-4" />
                Refresh
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-100 text-gray-300 rounded-xl text-sm border border-dark-100 transition-all">
                <Download className="w-4 h-4" />
                Export
              </button>
            </div>
          </div>

          {/* Severity Summary Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'].map(s => {
              const count = stats?.by_severity?.[s.toLowerCase()] ?? 0
              const config = severityConfig[s]
              return (
                <div
                  key={s}
                  onClick={() => setSeverityFilter(
                    severityFilter === s ? 'ALL' : s
                  )}
                  className={`p-4 bg-dark-200 rounded-xl border cursor-pointer
                    hover:opacity-80 transition-all ${config.border}
                    ${severityFilter === s ? 'ring-1 ring-offset-1 ring-offset-dark-400 ring-primary-500' : ''}`}
                >
                  <p className={`text-2xl font-bold ${config.color}`}>
                    {loading ? '—' : count}
                  </p>
                  <p className="text-gray-500 text-xs mt-1">{s}</p>
                </div>
              )
            })}
          </div>

          {/* Type Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-gray-400" />
              <span className="text-gray-400 text-sm">Filter:</span>
            </div>
            {['ALL', 'COLLISION', 'PERSON_HIT', 'ROLLOVER'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  filter === f
                    ? 'bg-primary-600 text-white'
                    : 'bg-dark-200 text-gray-400 hover:text-white border border-dark-100'
                }`}
              >
                {f === 'ALL' ? 'All Accidents' :
                 f === 'COLLISION' ? '🚗 Collision' :
                 f === 'PERSON_HIT' ? '🚨 Person Hit' :
                 '🔄 Rollover'}
              </button>
            ))}
          </div>

          {/* Alerts List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i}
                  className="h-24 bg-dark-200 rounded-xl animate-pulse">
                </div>
              ))}
            </div>
          ) : filteredAlerts.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <AlertTriangle className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="text-sm">No alerts found</p>
              <p className="text-xs mt-1 text-gray-600">
                System is actively monitoring for accidents
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredAlerts.map(alert => (
                <AlertRow
                  key={alert.id}
                  alert={alert}
                  onAcknowledge={handleAcknowledge}
                  onView={handleView}
                />
              ))}
            </div>
          )}

        </div>
      </div>

      {/* Evidence Modal */}
      {selectedAlert && (
        <div
          className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedAlert(null)}
        >
          <div
            className="bg-dark-200 rounded-2xl p-6 max-w-md w-full border border-dark-100"
            onClick={e => e.stopPropagation()}
          >
            <h3 className="text-white font-semibold mb-4">
              🚨 Accident Evidence
            </h3>
            <div className="bg-dark-400 rounded-xl aspect-video flex items-center justify-center mb-4">
              {selectedAlert.accident?.screenshot_path ? (
                <img
                  src={`http://localhost:5000/uploads/${selectedAlert.accident.screenshot_path}`}
                  alt="Accident Screenshot"
                  className="w-full h-full object-cover rounded-xl"
                />
              ) : (
                <div className="text-center">
                  <Camera className="w-12 h-12 text-dark-100 mx-auto mb-2" />
                  <p className="text-gray-500 text-sm">
                    No screenshot available
                  </p>
                </div>
              )}
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Type:</span>
                <span className="text-white">
                  {accidentConfig[selectedAlert.accident?.accident_type]?.label}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Severity:</span>
                <span className={severityConfig[selectedAlert.severity]?.color}>
                  {selectedAlert.severity}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Camera:</span>
                <span className="text-white">
                  Camera {selectedAlert.accident?.camera_id}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Road:</span>
                <span className="text-white">
                  {selectedAlert.accident?.road_name}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Confidence:</span>
                <span className="text-white">
                  {Math.round(
                    (selectedAlert.accident?.confidence || 0) * 100
                  )}%
                </span>
              </div>
            </div>
            <button
              onClick={() => setSelectedAlert(null)}
              className="w-full mt-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm transition-all"
            >
              Close
            </button>
          </div>
        </div>
      )}

    </div>
  )
}

export default AlertsPage