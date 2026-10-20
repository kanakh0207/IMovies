/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useEffect, useState } from 'react'
import { api } from '../api'

const AuthContext = createContext(null)

// account = { _id, name, email, phone, role: 'user' | 'admin' }  (null when logged out)
export function AuthProvider({ children }) {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api
      .get('/auth/me')
      .then((d) => setAccount({ ...d.user, role: d.role }))
      .catch(() => setAccount(null))
      .finally(() => setLoading(false))
  }, [])

  const login = async (email, password) => {
    const d = await api.post('/auth/login', { email, password })
    setAccount(d.user)
    return d.user
  }
  const register = async (form) => {
    const d = await api.post('/auth/register', form)
    setAccount(d.user)
    return d.user
  }
  const adminLogin = async (email, password) => {
    const d = await api.post('/admin/login', { email, password })
    setAccount(d.user)
    return d.user
  }
  const logout = async () => {
    try {
      await api.post('/auth/logout')
    } finally {
      setAccount(null)
    }
  }
  const updateAccount = (patch) => setAccount((a) => ({ ...a, ...patch }))

  return (
    <AuthContext.Provider value={{ account, loading, login, register, adminLogin, logout, updateAccount }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
