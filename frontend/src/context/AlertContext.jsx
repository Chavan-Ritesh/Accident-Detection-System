import { createContext, useContext, useState, useEffect, useRef } from 'react'
import toast from 'react-hot-toast'
import useWebSocket from '../hooks/useWebSocket'

const AlertContext = createContext(null)

export const AlertProvider = ({ children }) => {
  const { isConnected, lastAccident } = useWebSocket()
  const [liveAlerts, setLiveAlerts] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [cameraActive, setCameraActive] = useState(false)
  const lastAccidentRef = useRef(null)

  // ─── Check if camera is active ────────────────────────
  useEffect(() => {
    const checkCamera = async () => {
      try {
        const res = await fetch(
          'http://localhost:5000/api/detection/cameras'
        )
        const data = await res.json()
        if (data.success && data.cameras?.length > 0) {
          const anyActive = data.cameras.some(
            c => c.is_running && c.is_connected
          )
          setCameraActive(anyActive)
        } else {
          setCameraActive(false)
        }
      } catch {
        setCameraActive(false)
      }
    }

    // Check immediately
    checkCamera()

    // Check every 10 seconds
    const interval = setInterval(checkCamera, 10000)
    return () => clearInterval(interval)
  }, [])

  // ─── Handle live accident from WebSocket ──────────────
  useEffect(() => {
    if (!lastAccident) return

    // Ignore if same accident as before
    if (lastAccidentRef.current === lastAccident) return
    lastAccidentRef.current = lastAccident

    // Only show if camera is active
    if (!cameraActive) {
      console.log('⚠ Alert ignored — camera is not active')
      return
    }

    const accident = lastAccident.data

    // Add to live alerts list
    setLiveAlerts(prev => [accident, ...prev].slice(0, 20))
    setUnreadCount(prev => prev + 1)

    // Show toast notification
    const severityEmoji = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢'
    }[accident.severity] || '🔴'

    const typeLabel = {
      COLLISION: 'Vehicle Collision',
      PERSON_HIT: 'Person Hit by Vehicle',
      ROLLOVER: 'Vehicle Rollover'
    }[accident.accident_type] || 'Accident'

    toast.error(
      `${severityEmoji} ${typeLabel} detected!\n${accident.location}`,
      {
        duration: 6000,
        style: {
          background: '#1e2433',
          color: '#ffffff',
          border: '1px solid #ef4444',
          borderRadius: '12px',
        }
      }
    )

  }, [lastAccident, cameraActive])

  const clearUnread = () => setUnreadCount(0)

  return (
    <AlertContext.Provider value={{
      isConnected,
      cameraActive,
      liveAlerts,
      unreadCount,
      clearUnread,
      lastAccident
    }}>
      {children}
    </AlertContext.Provider>
  )
}

export const useAlerts = () => {
  const context = useContext(AlertContext)
  if (!context) {
    throw new Error('useAlerts must be used within AlertProvider')
  }
  return context
}

export default AlertContext