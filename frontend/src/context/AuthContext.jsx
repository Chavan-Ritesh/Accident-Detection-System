import { createContext, useContext, useState, useEffect } from 'react'
import authAPI from '../api/authAPI'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(true)

  // ─── Load user from localStorage on app start ────────────────────────────
  useEffect(() => {
    const savedToken = localStorage.getItem('access_token')
    const savedUser = localStorage.getItem('user')

    if (savedToken && savedUser) {
      setToken(savedToken)
      setUser(JSON.parse(savedUser))
    }
    setLoading(false)
  }, [])

  // ─── Login ────────────────────────────────────────────────────────────────
  const login = async (username, password) => {
    try {
      const data = await authAPI.login(username, password)

      if (data.success) {
        // Save to localStorage
        localStorage.setItem('access_token', data.access_token)
        localStorage.setItem('user', JSON.stringify(data.user))

        // Save to state
        setToken(data.access_token)
        setUser(data.user)

        return { success: true, user: data.user }
      }

      return { success: false, message: data.message }
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || '❌ Login failed!'
      }
    }
  }

  // ─── Logout ───────────────────────────────────────────────────────────────
  const logout = async () => {
    try {
      await authAPI.logout()
    } catch (error) {
      console.error('Logout error:', error)
    } finally {
      localStorage.removeItem('access_token')
      localStorage.removeItem('user')
      setToken(null)
      setUser(null)
    }
  }

  // ─── Check if user is admin ───────────────────────────────────────────────
  const isAdmin = () => user?.role === 'admin'

  // ─── Check if user is operator ────────────────────────────────────────────
  const isOperator = () => user?.role === 'operator'

  // ─── Check if authenticated ───────────────────────────────────────────────
  const isAuthenticated = () => !!token && !!user

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      login,
      logout,
      isAdmin,
      isOperator,
      isAuthenticated
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider')
  }
  return context
}

export default AuthContext