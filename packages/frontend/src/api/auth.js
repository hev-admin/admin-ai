import request from '@/utils/request.js'

export const authApi = {
  login(data) {
    return request.post('/auth/login', data)
  },

  register(data) {
    return request.post('/auth/register', data)
  },

  logout() {
    return request.post('/auth/logout')
  },

  getProfile() {
    return request.get('/auth/profile')
  },

  updateProfile(data) {
    return request.put('/auth/profile', data)
  },

  updatePassword(data) {
    return request.put('/auth/password', data)
  },
}
