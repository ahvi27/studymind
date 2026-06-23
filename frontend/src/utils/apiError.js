/**
 * Turn Axios / FastAPI errors into user-friendly messages.
 */

export function getApiErrorMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (!error?.response) {
    if (error?.code === 'ERR_NETWORK' || error?.message === 'Network Error') {
      return 'Cannot reach the server. Start the backend: cd backend && uvicorn app.main:app --reload --port 8000'
    }
    return fallback
  }

  const { detail } = error.response.data || {}

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    return detail.map((item) => item.msg || JSON.stringify(item)).join('. ')
  }

  return fallback
}
