import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import toast from 'react-hot-toast'
import {
  LayoutDashboard,
  Camera,
  Bell,
  Map,
  BarChart3,
  LogOut,
  Shield,
  User,
  Circle
} from 'lucide-react'

const Sidebar = () => {
  const { user, logout, isAdmin } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    await logout()
    toast.success('Logged out successfully!')
    navigate('/login')
  }

  const navItems = [
    {
      path: '/dashboard',
      icon: <LayoutDashboard className="w-5 h-5" />,
      label: 'Dashboard',
      roles: ['admin', 'operator']
    },
    {
      path: '/cameras',
      icon: <Camera className="w-5 h-5" />,
      label: 'Live Cameras',
      roles: ['admin', 'operator']
    },
    {
      path: '/alerts',
      icon: <Bell className="w-5 h-5" />,
      label: 'Alerts',
      roles: ['admin', 'operator']
    },
    {
      path: '/map',
      icon: <Map className="w-5 h-5" />,
      label: 'Map View',
      roles: ['admin', 'operator']
    },
    {
      path: '/analytics',
      icon: <BarChart3 className="w-5 h-5" />,
      label: 'Analytics',
      roles: ['admin']
    },
  ]

  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item =>
    item.roles.includes(user?.role)
  )

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-dark-200 border-r border-dark-100 flex flex-col z-50">

      {/* Logo */}
      <div className="p-6 border-b border-dark-100">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-600 rounded-xl">
            <Camera className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold text-sm">Video Surveillance</h1>
            <p className="text-gray-500 text-xs">Security System</p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-1">
        {filteredNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 ${
                isActive
                  ? 'bg-primary-600 text-white shadow-lg shadow-primary-900/50'
                  : 'text-gray-400 hover:bg-dark-300 hover:text-white'
              }`
            }
          >
            {item.icon}
            <span className="font-medium text-sm">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* System Status */}
      <div className="p-4 border-t border-dark-100">
        <div className="p-3 bg-dark-300 rounded-xl mb-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs text-gray-500">System Status</span>
            <div className="flex items-center gap-1">
              <Circle className="w-2 h-2 fill-success text-success" />
              <span className="text-xs text-success">Online</span>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-gray-500">Cameras</span>
            <span className="text-xs text-white">4 Active</span>
          </div>
        </div>

        {/* User Info */}
        <div className="flex items-center gap-3 p-3 bg-dark-300 rounded-xl mb-3">
          <div className="p-2 bg-primary-900 rounded-lg">
            {user?.role === 'admin'
              ? <Shield className="w-4 h-4 text-primary-400" />
              : <User className="w-4 h-4 text-warning" />
            }
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium truncate">{user?.username}</p>
            <p className={`text-xs capitalize ${user?.role === 'admin' ? 'text-primary-400' : 'text-warning'}`}>
              {user?.role}
            </p>
          </div>
        </div>

        {/* Logout Button */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 text-gray-400 hover:text-danger hover:bg-dark-300 rounded-xl transition-all duration-200"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium text-sm">Logout</span>
        </button>
      </div>

    </div>
  )
}

export default Sidebar