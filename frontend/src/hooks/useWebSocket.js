import { useEffect, useRef, useState } from 'react'
import { io } from 'socket.io-client'

const BACKEND_URL = 'http://localhost:5000'

const useWebSocket = () => {
  const socketRef = useRef(null)
  const [isConnected, setIsConnected] = useState(false)
  const [lastAccident, setLastAccident] = useState(null)
  const [stats, setStats] = useState(null)

  useEffect(() => {
    // Connect to backend WebSocket
    socketRef.current = io(BACKEND_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 2000,
    })

    const socket = socketRef.current

    // ─── Connection Events ─────────────────────────────
    socket.on('connect', () => {
      console.log('✅ WebSocket connected!')
      setIsConnected(true)
    })

    socket.on('disconnect', () => {
      console.log('🔌 WebSocket disconnected!')
      setIsConnected(false)
    })

    socket.on('connected', (data) => {
      console.log('✅ Server says:', data.message)
    })

    // ─── Accident Events ───────────────────────────────
    socket.on('accident_detected', (data) => {
      console.log('🚨 Live accident:', data)
      setLastAccident(data)
    })

    // ─── Stats Events ──────────────────────────────────
    socket.on('system_stats', (data) => {
      setStats(data)
    })

    // ─── Cleanup ───────────────────────────────────────
    return () => {
      socket.disconnect()
    }
  }, [])

  const sendPing = () => {
    if (socketRef.current) {
      socketRef.current.emit('ping')
    }
  }

  return {
    isConnected,
    lastAccident,
    stats,
    sendPing
  }
}

export default useWebSocket