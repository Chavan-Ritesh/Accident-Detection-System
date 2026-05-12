import axiosClient from './axiosClient'

const authAPI = {
  // Login
  login: async (username, password) => {
    const response = await axiosClient.post('/auth/login', {
      username,
      password,
    })
    return response.data
  },

  // Logout
  logout: async () => {
    const response = await axiosClient.post('/auth/logout')
    return response.data
  },

  // Get profile
  getProfile: async () => {
    const response = await axiosClient.get('/auth/profile')
    return response.data
  },

  // Get all users (admin only)
  getUsers: async () => {
    const response = await axiosClient.get('/auth/users')
    return response.data
  },

  // Register new user (admin only)
  register: async (userData) => {
    const response = await axiosClient.post('/auth/register', userData)
    return response.data
  },
}

export default authAPI