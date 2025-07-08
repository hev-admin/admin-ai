import { useDialog, useMessage as useNaiveMessage, useNotification } from 'naive-ui'

let messageInstance = null
let notificationInstance = null
let dialogInstance = null

/**
 * Initialize message instances (call in App.vue setup)
 */
export function setupMessage() {
  messageInstance = useNaiveMessage()
  notificationInstance = useNotification()
  dialogInstance = useDialog()
}

/**
 * Message helper for displaying messages outside of setup context
 */
export const message = {
  success(content, options = {}) {
    messageInstance?.success(content, options)
  },
  error(content, options = {}) {
    messageInstance?.error(content, options)
  },
  warning(content, options = {}) {
    messageInstance?.warning(content, options)
  },
  info(content, options = {}) {
    messageInstance?.info(content, options)
  },
  loading(content, options = {}) {
    return messageInstance?.loading(content, options)
  },
}

/**
 * Notification helper
 */
export const notification = {
  success(options) {
    notificationInstance?.success(options)
  },
  error(options) {
    notificationInstance?.error(options)
  },
  warning(options) {
    notificationInstance?.warning(options)
  },
  info(options) {
    notificationInstance?.info(options)
  },
}

/**
 * Dialog helper
 */
export const dialog = {
  confirm(options) {
    return dialogInstance?.warning({
      title: '确认',
      positiveText: '确定',
      negativeText: '取消',
      ...options,
    })
  },
  warning(options) {
    return dialogInstance?.warning(options)
  },
  error(options) {
    return dialogInstance?.error(options)
  },
  success(options) {
    return dialogInstance?.success(options)
  },
  info(options) {
    return dialogInstance?.info(options)
  },
}

/**
 * Handle API error with appropriate message
 */
export function handleApiError(error) {
  const errorMessage = error.response?.data?.message
    || error.message
    || '请求失败，请稍后重试'

  const errorCode = error.response?.data?.code || error.response?.status

  // Handle specific error codes
  switch (errorCode) {
    case 401:
      message.error('登录已过期，请重新登录')
      break
    case 403:
      message.error('无权限访问')
      break
    case 404:
      message.error('请求的资源不存在')
      break
    case 429:
      message.error('请求过于频繁，请稍后再试')
      break
    case 500:
      message.error('服务器错误，请稍后重试')
      break
    default:
      message.error(errorMessage)
  }

  return errorMessage
}
