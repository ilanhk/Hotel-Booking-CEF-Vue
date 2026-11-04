import axios from 'axios'

// All calls go through the Vite dev proxy (/api -> backend), see vite.config.ts.
// withCredentials makes the browser send the HttpOnly JWT cookie with every request.
export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
})

// True when axios gave up waiting for the server (the request timeout elapsed).
export function isTimeoutError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.code === 'ECONNABORTED'
}

// [Step 4: expired session] Central handling of failed responses for every API call:
// - 5xx: send the user to the "try again later" page.
// - 401 on any call except /auth/* (login failures, /auth/me on startup are expected 401s): the session expired
//   while the page was open, so forget the local user and go back to /login.
// The router and store are imported lazily because they depend on this module (circular import otherwise).
api.interceptors.response.use(undefined, async (error: unknown) => {
  if (!axios.isAxiosError(error)) return Promise.reject(error)
  const status = error.response?.status ?? 0

  if (status >= 500) {
    const { default: router } = await import('@/router')
    if (router.currentRoute.value.name !== 'sorry') {
      await router.push({ name: 'sorry' })
    }
  } else if (status === 401 && !error.config?.url?.startsWith('/auth/')) {
    const [{ default: router }, { useAuthStore }] = await Promise.all([
      import('@/router'),
      import('@/stores/auth'),
    ])
    useAuthStore().clearSession()
    if (router.currentRoute.value.name !== 'login') {
      await router.push({ name: 'login' })
    }
  }
  return Promise.reject(error)
})

// Pulls the backend's { message } / { error } text out of a failed request.
export function getErrorMessage(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined
    return data?.message ?? data?.error ?? 'Could not reach the server'
  }
  return 'Something went wrong'
}
