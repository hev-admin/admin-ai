export function success(data = null, message = 'success') {
  return { code: 200, message, data }
}

export function error(message = 'error', code = 400) {
  return { code, message, data: null }
}

export function paginate(list, page, pageSize, total) {
  return {
    code: 200,
    message: 'success',
    data: {
      list,
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    },
  }
}
