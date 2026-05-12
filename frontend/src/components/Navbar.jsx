import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { Bell, Shield, User, Wifi, WifiOff } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAlerts } from '../context/AlertContext'

const Navbar = ({ title }) => {
  const { user } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isOnline, setIsOnline] = useState(true)
  const navigate = useNavigate()
  const { unreadCount, clearUnread, cameraActive } = useAlerts()

  // ─── Update clock every second ────────────────────────────────────────────
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  // ─── Monitor online status ─────────────────────────────────────────────────
  useEffect(() => {
    const handleOnline = () => setIsOnline(true)
    const handleOffline = () => setIsOnline(false)
    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)
    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    })
  }

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  return (
    <div className="h-16 bg-dark-200 border-b border-dark-100 flex items-center justify-between px-6 fixed top-0 right-0 left-64 z-40">

      {/* Left — Page Title */}
      <div>
        <h2 className="text-white font-semibold text-lg">{title}</h2>
        <p className="text-gray-500 text-xs">{formatDate(currentTime)}</p>
      </div>

      {/* Right — Status & User */}
      <div className="flex items-center gap-4">

        {/* Clock */}
        <div className="text-right hidden md:block">
          <p className="text-white font-mono text-sm font-medium">
            {formatTime(currentTime)}
          </p>
        </div>

        {/* Connection Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg ${
          isOnline && cameraActive
            ? 'bg-success/10 text-success'
            : isOnline
            ? 'bg-warning/10 text-warning'
            : 'bg-danger/10 text-danger'
        }`}>
          {isOnline
            ? <Wifi className="w-4 h-4" />
            : <WifiOff className="w-4 h-4" />
          }
          <span className="text-xs font-medium hidden md:block">
            {!isOnline
              ? 'Offline'
              : cameraActive
              ? 'Camera Active'
              : 'Camera Offline'
            }
          </span>
        </div>
        
        {/* Notifications */}
        <button
          onClick={() => navigate('/alerts')}
          className="relative p-2 text-gray-400 hover:text-white hover:bg-dark-300 rounded-lg transition-all">
          <Bell className="w-5 h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger rounded-full text-white text-xs flex items-center justify-center font-bold">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* User Badge */}
        <div className="flex items-center gap-2 px-3 py-1.5 bg-dark-300 rounded-lg">
          <div className="p-1 bg-primary-900 rounded-md">
            {user?.role === 'admin'
              ? <Shield className="w-3 h-3 text-primary-400" />
              : <User className="w-3 h-3 text-warning" />
            }
          </div>
          <span className="text-white text-sm font-medium hidden md:block">
            {user?.username}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full hidden md:block ${
            user?.role === 'admin'
              ? 'bg-primary-900 text-primary-400'
              : 'bg-warning/10 text-warning'
          }`}>
            {user?.role}
          </span>
        </div>

      </div>
    </div>
  )
}

export default Navbar