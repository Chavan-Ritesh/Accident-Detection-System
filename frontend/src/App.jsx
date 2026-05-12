import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { AuthProvider } from './context/AuthContext'
import { AlertProvider } from './context/AlertContext'
import ProtectedRoute from './components/ProtectedRoute'

// Pages
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import CameraGrid from './pages/CameraGrid'
import AlertsPage from './pages/AlertsPage'
import MapView from './pages/MapView'
import Analytics from './pages/Analytics'

const App = () => {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AlertProvider>

          {/* Toast Notifications */}
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 4000,
              style: {
                background: '#1e2433',
                color: '#ffffff',
                border: '1px solid #0284c7',
                borderRadius: '12px',
              },
              success: {
                iconTheme: {
                  primary: '#10b981',
                  secondary: '#ffffff',
                },
              },
              error: {
                iconTheme: {
                  primary: '#ef4444',
                  secondary: '#ffffff',
                },
              },
            }}
          />

          <Routes>

            {/* Public Route */}
            <Route path="/login" element={<Login />} />

            {/* Protected Routes */}
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute allowedRoles={['admin', 'operator']}>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/cameras"
              element={
                <ProtectedRoute allowedRoles={['admin', 'operator']}>
                  <CameraGrid />
                </ProtectedRoute>
              }
            />
            <Route
              path="/alerts"
              element={
                <ProtectedRoute allowedRoles={['admin', 'operator']}>
                  <AlertsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="/map"
              element={
                <ProtectedRoute allowedRoles={['admin', 'operator']}>
                  <MapView />
                </ProtectedRoute>
              }
            />
            <Route
              path="/analytics"
              element={
                <ProtectedRoute allowedRoles={['admin']}>
                  <Analytics />
                </ProtectedRoute>
              }
            />

            {/* Default Redirect */}
            <Route path="/" element={<Navigate to="/login" replace />} />
            <Route path="*" element={<Navigate to="/login" replace />} />

          </Routes>

        </AlertProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App