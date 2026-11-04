import { api } from './http'

export type UserRole = 'Guest' | 'Property Manager'

export interface AuthUser {
  id: string
  name: string
  email: string
  role: UserRole
}

export async function login(email: string, password: string): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/login', { email, password })
  return data
}

export async function register(
  name: string,
  email: string,
  password: string,
): Promise<AuthUser> {
  const { data } = await api.post<AuthUser>('/auth/register', { name, email, password })
  return data
}

export async function logout(): Promise<void> {
  await api.post('/auth/logout')
}

// Resolves to the logged-in user, or null when there is no valid session cookie.
export async function fetchCurrentUser(): Promise<AuthUser | null> {
  try {
    const { data } = await api.get<AuthUser>('/auth/me')
    return data
  } catch {
    return null
  }
}
