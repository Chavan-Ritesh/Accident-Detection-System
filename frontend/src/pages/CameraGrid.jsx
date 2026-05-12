import { useState, useEffect } from 'react'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import {
  Camera,
  Maximize2,
  Minimize2,
  Circle,
  AlertTriangle,
  RefreshCw,
  Car,
  User,
  RotateCcw,
  WifiOff
} from 'lucide-react'

const BACKEND_URL = 'http://localhost:5000'

const accidentTypes = [
  {
    type: 'COLLISION',
    icon: <Car className="w-4 h-4 text-red-400" />,
    label: '🚗 Vehicle Collision Detected!',
    color: 'border-red-500 bg-red-500/20',
    textColor: 'text-red-400'
  },
  {
    type: 'PERSON_HIT',
    icon: <User className="w-4 h-4 text-red-500" />,
    label: '🚨 Person Hit by Vehicle!',
    color: 'border-red-600 bg-red-600/20',
    textColor: 'text-red-500'
  },
  {
    type: 'ROLLOVER',
    icon: <RotateCcw className="w-4 h-4 text-orange-400" />,
    label: '🔄 Vehicle Rollover Detected!',
    color: 'border-orange-500 bg-orange-500/20',
    textColor: 'text-orange-400'
  },
]

const CameraCard = ({ camera, onExpand, isExpanded, token }) => {
  const [accident, setAccident] = useState(null)
  const [streamError, setStreamError] = useState(false)
  const [fps, setFps] = useState(0)

  const streamUrl = camera.streamId
    ? `${BACKEND_URL}/api/detection/stream/${camera.streamId}`
    : null

  // Only show real accidents from WebSocket
useEffect(() => {
  const interval = setInterval(() => {
    setFps(Math.floor(Math.random() * 5) + 25)
  }, 3000)
  return () => clearInterval(interval)
}, [])

  return (
    <div className={`bg-dark-200 rounded-2xl border overflow-hidden
      transition-all duration-200
      ${accident
        ? 'border-red-500 shadow-lg shadow-red-900/30'
        : 'border-dark-100 hover:border-primary-800'}
      ${isExpanded ? 'col-span-2' : ''}
    `}>

      {/* Camera Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-100">
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full animate-pulse ${
            streamError ? 'bg-danger' : 'bg-success'
          }`}></div>
          <span className="text-white text-sm font-medium">{camera.name}</span>
          <span className="text-gray-500 text-xs">— {camera.location}</span>
        </div>
        <div className="flex items-center gap-3">
          {!streamError && (
            <span className="text-gray-500 text-xs">{fps} FPS</span>
          )}
          <button
            onClick={() => onExpand(camera.id)}
            className="text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded
              ? <Minimize2 className="w-4 h-4" />
              : <Maximize2 className="w-4 h-4" />
            }
          </button>
        </div>
      </div>

      {/* Camera Feed */}
      <div className="relative bg-dark-400 aspect-video">

        {/* ── Real Video Stream ── */}
        {streamUrl && !streamError ? (
          <img
            src={streamUrl}
            alt={`${camera.name} Live Feed`}
            className="w-full h-full object-cover"
            onError={() => setStreamError(true)}
          />
        ) : (
          /* ── Fallback UI ── */
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-dark-300 to-dark-500">
            <div className="absolute inset-0 opacity-5"
              style={{
                backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 30px, #0ea5e9 30px, #0ea5e9 31px), repeating-linear-gradient(90deg, transparent, transparent 30px, #0ea5e9 30px, #0ea5e9 31px)'
              }}
            />
            <div className="relative flex flex-col items-center gap-2">
              {streamError
                ? <WifiOff className="w-12 h-12 text-danger" />
                : <Camera className="w-12 h-12 text-dark-100" />
              }
              <p className="text-gray-500 text-xs text-center px-4">
                {streamError
                  ? 'Stream unavailable — Check camera connection'
                  : `${camera.name} — No stream configured`
                }
              </p>
              {streamError && (
                <button
                  onClick={() => setStreamError(false)}
                  className="mt-2 px-3 py-1 bg-primary-600 hover:bg-primary-500 text-white text-xs rounded-lg transition-all"
                >
                  Retry
                </button>
              )}
            </div>
          </div>
        )}

        {/* ── Accident Alert Overlay ── */}
        {accident && (
          <div className={`absolute top-3 left-3 right-3 border rounded-xl px-4 py-3
            flex items-center gap-3 animate-fade-in ${accident.color}`}>
            <AlertTriangle className="w-5 h-5 text-danger flex-shrink-0 animate-pulse" />
            <div className="flex-1">
              <p className={`text-sm font-bold ${accident.textColor}`}>
                {accident.label}
              </p>
              <p className="text-gray-300 text-xs mt-0.5">
                {camera.location} • {new Date().toLocaleTimeString()}
              </p>
            </div>
          </div>
        )}

        {/* Recording Badge */}
        <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg">
          <Circle className="w-2 h-2 fill-danger text-danger animate-pulse" />
          <span className="text-white text-xs">
            {streamError ? 'OFFLINE' : 'LIVE'}
          </span>
        </div>

        {/* Timestamp */}
        <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 rounded-lg">
          <span className="text-white text-xs font-mono">
            {new Date().toLocaleTimeString()}
          </span>
        </div>

      </div>

      {/* Camera Footer */}
      <div className="px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <span className="text-gray-500 text-xs">
            Accidents: <span className="text-white">{camera.accidents}</span>
          </span>
          <span className="text-gray-500 text-xs">
            Resolution: <span className="text-white">1080p</span>
          </span>
        </div>
        <span className={`text-xs px-2 py-1 rounded-lg ${
          accident
            ? 'bg-danger/10 text-danger animate-pulse'
            : streamError
            ? 'bg-warning/10 text-warning'
            : 'bg-success/10 text-success'
        }`}>
          {accident ? '⚠ ACCIDENT!' : streamError ? '⚠ Offline' : '✓ Clear'}
        </span>
      </div>

    </div>
  )
}

const CameraGrid = () => {
  const [expandedCamera, setExpandedCamera] = useState(null)
  const token = localStorage.getItem('access_token')

  const [cameras] = useState([
    {
      id: 1,
      name: 'Camera 1',
      location: 'Highway Entry Point',
      accidents: 3,
      status: 'active',
      streamId: 'camera_1'   // ← matches backend camera ID
    },
    {
      id: 2,
      name: 'Camera 2',
      location: 'Highway km 12',
      accidents: 1,
      status: 'active',
      streamId: null          // ← no stream yet
    },
    {
      id: 3,
      name: 'Camera 3',
      location: 'Highway km 24',
      accidents: 0,
      status: 'active',
      streamId: null
    },
    {
      id: 4,
      name: 'Camera 4',
      location: 'Highway Exit Point',
      accidents: 2,
      status: 'active',
      streamId: null
    },
  ])

  const handleExpand = (id) => {
    setExpandedCamera(expandedCamera === id ? null : id)
  }

  return (
    <div className="min-h-screen bg-dark-400">
      <Sidebar />

      <div className="ml-64">
        <Navbar title="Live Cameras" />

        <div className="pt-16 p-6">

          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-white font-semibold text-lg">
                Live Camera Feeds
              </h2>
              <p className="text-gray-500 text-sm">
                {cameras.length} cameras — Highway Accident Monitoring
              </p>
            </div>
            <button
              onClick={() => window.location.reload()}
              className="flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm font-medium transition-all">
              <RefreshCw className="w-4 h-4" />
              Refresh All
            </button>
          </div>

          {/* Accident Type Legend */}
          <div className="flex gap-3 mb-6 flex-wrap">
            {accidentTypes.map(a => (
              <div key={a.type}
                className="flex items-center gap-2 px-3 py-2 bg-dark-200 rounded-xl border border-dark-100">
                {a.icon}
                <span className={`text-xs font-medium ${a.textColor}`}>
                  {a.type}
                </span>
              </div>
            ))}
          </div>

          {/* Camera Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cameras.map(camera => (
              <CameraCard
                key={camera.id}
                camera={camera}
                onExpand={handleExpand}
                isExpanded={expandedCamera === camera.id}
                token={token}
              />
            ))}
          </div>

        </div>
      </div>
    </div>
  )
}

export default CameraGrid