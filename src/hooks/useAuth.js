import { useContext } from 'react'
import { AuthContext } from '../app/providers/AuthProvider.jsx'
export const useAuth = () => useContext(AuthContext)