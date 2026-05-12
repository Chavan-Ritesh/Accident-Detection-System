import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import alertsAPI from '../api/alertsAPI'
import {
  Camera, Bell, Shield, Activity,
  AlertTriangle, CheckCircle, Clock,
  TrendingUp, Car, User, RotateCcw,
  RefreshCw
} from 'lucide-react'

const StatCard = ({ title, value, icon, color, subtitle, loading }) => (
  <div className="bg-dark-200 rounded-2xl p-6 border border-dark-100 hover:border-primary-800 transition-all duration-200">
    <div className="flex items-start justify-between mb-4">
      <div className={`p-3 rounded-xl ${color}`}>
        {icon}
      </div>
      <span className="text-success text-xs font-medium flex items-center gap-1">
        <TrendingUp className="w-3 h-3" />
        Live
      </span>
    </div>
    {loading ? (
      <div className="h-8 w-16 bg-dark-300 rounded animate-pulse mb-1"></div>
    ) : (
      <p className="text-3xl font-bold text-white mb-1">{value}</p>
    )}
    <p className="text-gray-400 text-sm font-medium">{title}</p>
    {subtitle && <p className="text-gray-600 text-xs mt-1">{subtitle}</p>}
  </div>
)

const AccidentItem = ({ severity, type, time, camera, persons, vehicles }) => {
  const severityConfig = {
    CRITICAL: { color: 'text-red-400', bg: 'bg-red-400/10', dot: 'bg-red-400' },
    HIGH: { color: 'text-orange-400', bg: 'bg-orange-400/10', dot: 'bg-orange-400' },
    MEDIUM: { color: 'text-yellow-400', bg: 'bg-yellow-400/10', dot: 'bg-yellow-400' },
    LOW: { color: 'text-green-400', bg: 'bg-green-400/10', dot: 'bg-green-400' },
  }

  const accidentConfig = {
    COLLISION: {
      icon: <Car className="w-4 h-4" />,
      label: 'Vehicle Collision',
      detail: `${vehicles} vehicles involved`
    },
    PERSON_HIT: {
      icon: <User className="w-4 h-4" />,
      label: 'Person Hit by Vehicle',
      detail: `${persons} person(s) involved`
    },
    ROLLOVER: {
      icon: <RotateCcw className="w-4 h-4" />,
      label: 'Vehicle Rollover',
      detail: `${vehicles} vehicle(s) involved`
    },
  }

  const config = severityConfig[severity] || severityConfig.LOW
  const accident = accidentConfig[type] || accidentConfig.COLLISION

  return (
    <div className="flex items-start gap-3 p-3 bg-dark-300 rounded-xl hover:bg-dark-100 transition-all">
      <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${config.dot}`}></div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className={config.color}>{accident.icon}</span>
            <p className="text-white text-sm font-medium">{accident.label}</p>
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${config.bg} ${config.color}`}>
            {severity}
          </span>
        </div>
        <p className="text-gray-500 text-xs mt-0.5">{accident.detail}</p>
        <div className="flex items-center gap-3 mt-1">
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <Camera className="w-3 h-3" />{camera}
          </span>
          <span className="text-gray-500 text-xs flex items-center gap-1">
            <Clock className="w-3 h-3" />{time}
          </span>
        </div>
      </div>
    </div>
  )
}

const Dashboard = () => {
  const [stats, setStats] = useState(null)
  const [recentAlerts, setRecentAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchData = async () => {
    try {
      // Fetch stats & alerts simultaneously
      const [statsRes, alertsRes] = await Promise.all([
        alertsAPI.getStats(),
        alertsAPI.getAlerts({ limit: 5 })
      ])

      if (statsRes.success) setStats(statsRes.stats)
      if (alertsRes.success) setRecentAlerts(alertsRes.alerts)
      setLastUpdated(new Date().toLocaleTimeString())

    } catch (error) {
      console.error('Dashboard data error:', error)
    } finally {
      setLoading(false)
    }
  }

  // Fetch on mount
  useEffect(() => {
    fetchData()

    // Auto refresh every 30 seconds
    const interval = setInterval(fetchData, 30000)
    return () => clearInterval(interval)
  }, [])

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
    <div className="min-h-screen bg-dark-400">
      <Sidebar />

      <div className="ml-64">
        <Navbar title="Dashboard" />

        <div className="pt-16 p-6 space-y-6">

          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-500 text-sm">
                {lastUpdated
                  ? `Last updated: ${lastUpdated}`
                  : 'Loading data...'
                }
              </p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-2 px-4 py-2 bg-dark-200 hover:bg-dark-100 text-gray-300 rounded-xl text-sm border border-dark-100 transition-all"
            >
              <RefreshCw className="w-4 h-4" />
              Refresh
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
            <StatCard
              title="Active Cameras"
              value={1}
              icon={<Camera className="w-6 h-6 text-primary-400" />}
              color="bg-primary-900/50"
              subtitle="Phone camera online"
              loading={loading}
            />
            <StatCard
              title="Total Accidents"
              value={stats?.total_accidents ?? 0}
              icon={<Activity className="w-6 h-6 text-danger" />}
              color="bg-danger/10"
              subtitle="Detected today"
              loading={loading}
            />
            <StatCard
              title="Active Alerts"
              value={stats?.unacknowledged ?? 0}
              icon={<AlertTriangle className="w-6 h-6 text-warning" />}
              color="bg-warning/10"
              subtitle="Requires attention"
              loading={loading}
            />
            <StatCard
              title="Acknowledged"
              value={stats?.acknowledged ?? 0}
              icon={<CheckCircle className="w-6 h-6 text-success" />}
              color="bg-success/10"
              subtitle="Resolved alerts"
              loading={loading}
            />
          </div>

          {/* Accident Type Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-dark-200 rounded-2xl p-4 border border-dark-100 flex items-center gap-4">
              <div className="p-3 bg-red-500/10 rounded-xl">
                <Car className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? '—' : stats?.by_type?.collisions ?? 0}
                </p>
                <p className="text-gray-400 text-sm">Collisions Today</p>
              </div>
            </div>
            <div className="bg-dark-200 rounded-2xl p-4 border border-dark-100 flex items-center gap-4">
              <div className="p-3 bg-red-600/10 rounded-xl">
                <User className="w-6 h-6 text-red-500" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? '—' : stats?.by_type?.person_hits ?? 0}
                </p>
                <p className="text-gray-400 text-sm">Person Hit Today</p>
              </div>
            </div>
            <div className="bg-dark-200 rounded-2xl p-4 border border-dark-100 flex items-center gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <RotateCcw className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {loading ? '—' : stats?.by_type?.rollovers ?? 0}
                </p>
                <p className="text-gray-400 text-sm">Rollovers Today</p>
              </div>
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

            {/* Recent Accidents */}
            <div className="xl:col-span-2 bg-dark-200 rounded-2xl p-6 border border-dark-100">
              <div className="flex items-center justify-between mb-5">
                <div className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary-400" />
                  <h3 className="text-white font-semibold">Recent Accidents</h3>
                </div>
                <span className="text-xs text-primary-400 bg-primary-900/50 px-3 py-1 rounded-full">
                  Live
                </span>
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="h-16 bg-dark-300 rounded-xl animate-pulse"></div>
                  ))}
                </div>
              ) : recentAlerts.length === 0 ? (
                <div className="text-center py-8">
                  <CheckCircle className="w-12 h-12 text-success mx-auto mb-3 opacity-50" />
                  <p className="text-gray-500 text-sm">No accidents detected yet</p>
                  <p className="text-gray-600 text-xs mt-1">System is monitoring...</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentAlerts.map(alert => (
                    <AccidentItem
                      key={alert.id}
                      severity={alert.severity}
                      type={alert.accident?.accident_type}
                      camera={`Camera ${alert.accident?.camera_id}`}
                      time={formatTime(alert.created_at)}
                      persons={alert.accident?.persons_involved}
                      vehicles={alert.accident?.vehicles_involved}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Severity Summary */}
            <div className="bg-dark-200 rounded-2xl p-6 border border-dark-100">
              <div className="flex items-center gap-2 mb-5">
                <Shield className="w-5 h-5 text-primary-400" />
                <h3 className="text-white font-semibold">Severity Summary</h3>
              </div>
              <div className="space-y-3">
                {[
                  { label: 'Critical', key: 'critical', color: 'bg-red-400', text: 'text-red-400' },
                  { label: 'High', key: 'high', color: 'bg-orange-400', text: 'text-orange-400' },
                  { label: 'Medium', key: 'medium', color: 'bg-yellow-400', text: 'text-yellow-400' },
                  { label: 'Low', key: 'low', color: 'bg-green-400', text: 'text-green-400' },
                ].map(item => {
                  const count = stats?.by_severity?.[item.key] ?? 0
                  const total = stats?.total_alerts ?? 1
                  const percent = total > 0
                    ? Math.round((count / total) * 100)
                    : 0
                  return (
                    <div key={item.key} className="p-3 bg-dark-300 rounded-xl">
                      <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-medium ${item.text}`}>
                          {item.label}
                        </span>
                        <span className="text-white text-sm font-bold">
                          {loading ? '—' : count}
                        </span>
                      </div>
                      <div className="w-full bg-dark-400 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full ${item.color} transition-all duration-500`}
                          style={{ width: `${percent}%` }}
                        ></div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  )
}

export default Dashboard