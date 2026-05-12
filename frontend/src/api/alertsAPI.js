import axiosClient from './axiosClient'

const alertsAPI = {

  // Get all alerts
  getAlerts: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axiosClient.get(`/alerts/?${params}`)
    return response.data
  },

  // Get single alert
  getAlert: async (alertId) => {
    const response = await axiosClient.get(`/alerts/${alertId}`)
    return response.data
  },

  // Acknowledge alert
  acknowledgeAlert: async (alertId) => {
    const response = await axiosClient.post(`/alerts/${alertId}/acknowledge`)
    return response.data
  },

  // Get all accidents
  getAccidents: async (filters = {}) => {
    const params = new URLSearchParams(filters).toString()
    const response = await axiosClient.get(`/alerts/accidents?${params}`)
    return response.data
  },

  // Get dashboard stats
  getStats: async () => {
    const response = await axiosClient.get('/alerts/stats')
    return response.data
  },

}

export default alertsAPI