import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import { Eye, EyeOff, Shield, Camera } from 'lucide-react'

const Login = () => {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)

  const { login } = useAuth()
  const navigate = useNavigate()

  const handleLogin = async (e) => {
    e.preventDefault()

    if (!username || !password) {
      toast.error('Please enter username and password!')
      return
    }

    setLoading(true)

    try {
      const result = await login(username, password)

      if (result.success) {
        toast.success(`Welcome back, ${result.user.username}! 🎉`)

        // Redirect based on role
        if (result.user.role === 'admin') {
          navigate('/dashboard')
        } else if (result.user.role === 'operator') {
          navigate('/dashboard')
        }
      } else {
        toast.error(result.message || '❌ Login failed!')
      }
    } catch (error) {
      toast.error('❌ Something went wrong!')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dark-400 flex items-center justify-center p-4">

      {/* Background Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-primary-500 rounded-full opacity-10 blur-3xl"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-primary-700 rounded-full opacity-10 blur-3xl"></div>
      </div>

      {/* Login Card */}
      <div className="relative w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="p-3 bg-primary-500 rounded-2xl">
              <Camera className="w-8 h-8 text-white" />
            </div>
            <div className="p-3 bg-dark-200 rounded-2xl">
              <Shield className="w-8 h-8 text-primary-400" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-white">
            Video Surveillance
          </h1>
          <p className="text-gray-400 mt-2">
            Secure access for authorized personnel only
          </p>
        </div>

        {/* Form Card */}
        <div className="bg-dark-200 rounded-2xl p-8 shadow-2xl border border-dark-100">

          <h2 className="text-xl font-semibold text-white mb-6">
            Sign In to Dashboard
          </h2>

          <form onSubmit={handleLogin} className="space-y-5">

            {/* Username */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter your username"
                className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 bg-dark-300 border border-dark-100 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all pr-12"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Role Info */}
            <div className="flex gap-3">
              <div className="flex-1 p-3 bg-dark-300 rounded-xl border border-dark-100 text-center">
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-primary-400">Admin</p>
              </div>
              <div className="flex-1 p-3 bg-dark-300 rounded-xl border border-dark-100 text-center">
                <p className="text-xs text-gray-500">Role</p>
                <p className="text-sm font-medium text-warning">Operator</p>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-primary-600 hover:bg-primary-500 disabled:bg-primary-900 disabled:cursor-not-allowed text-white font-semibold rounded-xl transition-all duration-200 flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Signing in...
                </>
              ) : (
                <>
                  <Shield className="w-5 h-5" />
                  Sign In
                </>
              )}
            </button>

          </form>

          {/* Footer */}
          <p className="text-center text-gray-600 text-sm mt-6">
            Only Admin & Operator roles can access this system
          </p>

        </div>

        {/* Version */}
        <p className="text-center text-gray-700 text-xs mt-4">
          Video Surveillance System v1.0.0
        </p>

      </div>
    </div>
  )
}

export default Login