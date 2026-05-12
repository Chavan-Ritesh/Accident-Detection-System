import { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, Circle } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import Sidebar from '../components/Sidebar'
import Navbar from '../components/Navbar'
import { Camera, Clock, X, Maximize2, AlertTriangle } from 'lucide-react'

// Fix leaflet default marker icon
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
})

// Camera marker icon
const createCameraIcon = (accidents) => L.divIcon({
  className: '',
  html: `
    <div style="
      position: relative;
      width: 44px;
      height: 44px;
    ">
      <div style="
        width: 44px;
        height: 44px;
        background: #0284c7;
        border: 3px solid white;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        box-shadow: 0 2px 10px rgba(0,0,0,0.4);
        font-size: 18px;
      ">📹</div>
      ${accidents > 0 ? `
        <div style="
          position: absolute;
          top: -4px;
          right: -4px;
          width: 18px;
          height: 18px;
          background: #ef4444;
          border: 2px solid white;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 10px;
          font-weight: bold;
          color: white;
        ">${accidents}</div>
      ` : ''}
    </div>
  `,
  iconSize: [44, 44],
  iconAnchor: [22, 44],
  popupAnchor: [0, -44],
})

// Accident marker icon
const createAccidentIcon = (color) => L.divIcon({
  className: '',
  html: `
    <div style="
      width: 28px; height: 28px;
      background: ${color};
      border: 2px solid white;
      border-radius: 50% 50% 50% 0;
      transform: rotate(-45deg);
      box-shadow: 0 2px 8px rgba(0,0,0,0.4);
    "></div>
  `,
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
})

const markerColors = {
  CRITICAL: '#ef4444',
  HIGH: '#f97316',
  MEDIUM: '#eab308',
  LOW: '#22c55e',
}

const accidentIcons = {
  COLLISION: '🚗',
  PERSON_HIT: '🚨',
  ROLLOVER: '🔄',
}

const MapView = () => {
  const [selectedFilter, setSelectedFilter] = useState('ALL')
  const [selectedCamera, setSelectedCamera] = useState(null)

  // Camera locations on highway
  const cameras = [
    {
      id: 1,
      name: 'Camera 1',
      location: 'Highway Entry Point',
      lat: 19.8762,
      lng: 75.3433,
      status: 'active',
      accidents: 3,
      streamUrl: 'http://10.94.85.239:8080/video',
    },
    {
      id: 2,
      name: 'Camera 2',
      location: 'Highway km 12',
      lat: 19.8900,
      lng: 75.3600,
      status: 'active',
      accidents: 1,
      streamUrl: '',
    },
    {
      id: 3,
      name: 'Camera 3',
      location: 'Highway km 24',
      lat: 19.9050,
      lng: 75.3750,
      status: 'active',
      accidents: 2,
      streamUrl: '',
    },
    {
      id: 4,
      name: 'Camera 4',
      location: 'Highway Exit Point',
      lat: 19.9200,
      lng: 75.3900,
      status: 'active',
      accidents: 0,
      streamUrl: '',
    },
  ]

  // Accident locations
  const accidents = [
    {
      id: 1, type: 'PERSON_HIT', severity: 'CRITICAL',
      lat: 19.8762, lng: 75.3433,
      camera: 'Camera 1', location: 'Highway Entry Point',
      time: '2 min ago', vehicles: 1, persons: 1, confidence: 92,
    },
    {
      id: 2, type: 'COLLISION', severity: 'HIGH',
      lat: 19.8900, lng: 75.3600,
      camera: 'Camera 2', location: 'Highway km 12',
      time: '8 min ago', vehicles: 2, persons: 0, confidence: 87,
    },
    {
      id: 3, type: 'ROLLOVER', severity: 'HIGH',
      lat: 19.9050, lng: 75.3750,
      camera: 'Camera 3', location: 'Highway km 24',
      time: '15 min ago', vehicles: 1, persons: 0, confidence: 78,
    },
    {
      id: 4, type: 'COLLISION', severity: 'MEDIUM',
      lat: 19.9200, lng: 75.3900,
      camera: 'Camera 4', location: 'Highway Exit Point',
      time: '32 min ago', vehicles: 2, persons: 0, confidence: 65,
    },
  ]

  const filteredAccidents = accidents.filter(a =>
    selectedFilter === 'ALL' || a.type === selectedFilter
  )

  return (
    <div className="min-h-screen bg-dark-400">
      <Sidebar />

      <div className="ml-64">
        <Navbar title="Map View" />

        <div className="pt-16 p-6 space-y-4">

          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h2 className="text-white font-semibold text-lg">Accident Map</h2>
              <p className="text-gray-500 text-sm">
                Highway — Aurangabad, Maharashtra •
                <span className="text-primary-400 ml-1">{cameras.length} cameras</span>
              </p>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              {['ALL', 'COLLISION', 'PERSON_HIT', 'ROLLOVER'].map(f => (
                <button
                  key={f}
                  onClick={() => setSelectedFilter(f)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                    selectedFilter === f
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
          </div>

          {/* Legend */}
          <div className="flex items-center gap-6 flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-lg">📹</span>
              <span className="text-gray-400 text-xs">Camera (click for live feed)</span>
            </div>
            {Object.entries(markerColors).map(([severity, color]) => (
              <div key={severity} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ background: color }}></div>
                <span className="text-gray-400 text-xs">{severity}</span>
              </div>
            ))}
          </div>

          {/* Map */}
          <div className="rounded-2xl overflow-hidden border border-dark-100"
            style={{ height: '520px' }}>
            <MapContainer
              center={[19.8762, 75.3433]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                attribution='&copy; OpenStreetMap contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              {/* Camera Markers */}
              {cameras.map(camera => (
                <Marker
                  key={`cam-${camera.id}`}
                  position={[camera.lat, camera.lng]}
                  icon={createCameraIcon(camera.accidents)}
                  eventHandlers={{
                    click: () => setSelectedCamera(camera)
                  }}
                >
                  <Popup>
                    <div className="p-1 min-w-40">
                      <p className="font-bold text-sm mb-1">📹 {camera.name}</p>
                      <p className="text-xs text-gray-600">📍 {camera.location}</p>
                      <p className="text-xs text-gray-600 mt-1">
                        🚨 {camera.accidents} accidents detected
                      </p>
                      <button
                        onClick={() => setSelectedCamera(camera)}
                        className="mt-2 w-full text-xs bg-blue-500 text-white px-2 py-1 rounded"
                      >
                        View Live Feed
                      </button>
                    </div>
                  </Popup>
                </Marker>
              ))}

              {/* Accident Markers */}
              {filteredAccidents.map(accident => (
                <div key={`acc-${accident.id}`}>
                  {accident.severity === 'CRITICAL' && (
                    <Circle
                      center={[accident.lat, accident.lng]}
                      radius={150}
                      pathOptions={{
                        color: markerColors[accident.severity],
                        fillColor: markerColors[accident.severity],
                        fillOpacity: 0.15,
                        weight: 2,
                      }}
                    />
                  )}
                  <Marker
                    position={[accident.lat + 0.001, accident.lng + 0.001]}
                    icon={createAccidentIcon(markerColors[accident.severity])}
                  >
                    <Popup>
                      <div className="p-1 min-w-44">
                        <p className="font-bold text-sm mb-2">
                          {accidentIcons[accident.type]} {accident.type.replace('_', ' ')}
                        </p>
                        <div className="space-y-1 text-xs text-gray-600">
                          <p>📍 {accident.location}</p>
                          <p>📷 {accident.camera}</p>
                          <p>⏱ {accident.time}</p>
                          <p>📊 Confidence: {accident.confidence}%</p>
                          {accident.vehicles > 0 && <p>🚗 Vehicles: {accident.vehicles}</p>}
                          {accident.persons > 0 && <p>🚶 Persons: {accident.persons}</p>}
                          <p style={{ color: markerColors[accident.severity], fontWeight: 'bold' }}>
                            ⚠ {accident.severity}
                          </p>
                        </div>
                      </div>
                    </Popup>
                  </Marker>
                </div>
              ))}

            </MapContainer>
          </div>

          {/* Camera Cards Below Map */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {cameras.map(camera => (
              <div
                key={camera.id}
                onClick={() => setSelectedCamera(camera)}
                className="p-4 bg-dark-200 rounded-xl border border-dark-100
                  hover:border-primary-500 cursor-pointer transition-all group"
              >
                <div className="flex items-center justify-between mb-2">
                  <Camera className="w-5 h-5 text-primary-400" />
                  {camera.accidents > 0 && (
                    <span className="text-xs px-2 py-0.5 bg-danger/10 text-danger rounded-full">
                      {camera.accidents} alerts
                    </span>
                  )}
                </div>
                <p className="text-white text-sm font-medium">{camera.name}</p>
                <p className="text-gray-500 text-xs mt-1">{camera.location}</p>
                <p className="text-primary-400 text-xs mt-2 group-hover:underline">
                  Click to view feed →
                </p>
              </div>
            ))}
          </div>

        </div>
      </div>

      {/* ── Live Feed Modal ── */}
      {selectedCamera && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-dark-200 rounded-2xl border border-dark-100 w-full max-w-2xl">

            {/* Modal Header */}
            <div className="flex items-center justify-between p-4 border-b border-dark-100">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 bg-success rounded-full animate-pulse"></div>
                <div>
                  <h3 className="text-white font-semibold">{selectedCamera.name}</h3>
                  <p className="text-gray-500 text-xs">{selectedCamera.location}</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCamera(null)}
                className="p-2 hover:bg-dark-300 rounded-lg text-gray-400 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Live Feed */}
            <div className="relative bg-dark-400 aspect-video">
              {selectedCamera.streamUrl ? (
                <img
                  src={`${selectedCamera.streamUrl}`}
                  alt="Live Feed"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    e.target.nextSibling.style.display = 'flex'
                  }}
                />
              ) : null}

              {/* Fallback when no stream */}
              <div className={`absolute inset-0 flex flex-col items-center justify-center
                ${selectedCamera.streamUrl ? 'hidden' : 'flex'}`}>
                <Camera className="w-16 h-16 text-dark-100 mb-3" />
                <p className="text-gray-500 text-sm">
                  {selectedCamera.streamUrl
                    ? 'Connecting to feed...'
                    : 'No stream URL configured'
                  }
                </p>
                {selectedCamera.streamUrl && (
                  <p className="text-gray-600 text-xs mt-1">{selectedCamera.streamUrl}</p>
                )}
              </div>

              {/* Recording Badge */}
              <div className="absolute bottom-3 left-3 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-lg">
                <div className="w-2 h-2 bg-danger rounded-full animate-pulse"></div>
                <span className="text-white text-xs">LIVE</span>
              </div>

              {/* Timestamp */}
              <div className="absolute bottom-3 right-3 bg-black/60 px-2 py-1 rounded-lg">
                <span className="text-white text-xs font-mono">
                  {new Date().toLocaleTimeString()}
                </span>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-gray-500">
                <span className="flex items-center gap-1">
                  <AlertTriangle className="w-3 h-3 text-danger" />
                  {selectedCamera.accidents} accidents detected
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date().toLocaleDateString()}
                </span>
              </div>
              <button
                onClick={() => setSelectedCamera(null)}
                className="px-4 py-2 bg-primary-600 hover:bg-primary-500 text-white rounded-xl text-sm transition-all"
              >
                Close
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}

export default MapView