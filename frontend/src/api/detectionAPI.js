import axiosClient from './axiosClient'

const detectionAPI = {

  // Get all cameras status
  getCameras: async () => {
    const response = await axiosClient.get('/detection/cameras')
    return response.data
  },

  // Start a camera
  startCamera: async (cameraData) => {
    const response = await axiosClient.post('/detection/cameras/start', cameraData)
    return response.data
  },

  // Stop a camera
  stopCamera: async (cameraId) => {
    const response = await axiosClient.post('/detection/cameras/stop', { camera_id: cameraId })
    return response.data
  },

  // Get YOLOv8 status
  getYoloStatus: async () => {
    const response = await axiosClient.get('/detection/yolo/status')
    return response.data
  },

}

export default detectionAPI