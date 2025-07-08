import request from '@/utils/request.js'

export const uploadApi = {
  uploadAvatar(file) {
    const formData = new FormData()
    formData.append('file', file)
    return request.post('/upload/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    })
  },
}
