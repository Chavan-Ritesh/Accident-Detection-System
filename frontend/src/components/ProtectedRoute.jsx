import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, isAuthenticated } = useAuth()

  // Show loading spinner while checking auth
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-400">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-primary-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-primary-400 font-medium">Loading...</p>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }

  // Check role access
  if (allowedRoles && !allowedRoles.includes(user?.role)) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-dark-400">
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="text-6xl">🚫</div>
          <h1 className="text-2xl font-bold text-danger">Access Denied!</h1>
          <p className="text-gray-400">
            You don't have permission to view this page.
          </p>
          <p className="text-gray-500 text-sm">
            Required role: {allowedRoles.join(' or ')}
          </p>
        </div>
      </div>
    )
  }

  return children
}

export default ProtectedRoute