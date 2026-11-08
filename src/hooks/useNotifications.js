import { useContext } from 'react'
import { NotificationContext } from '../app/providers/NotificationProvider.jsx'
export const useNotifications = () => useContext(NotificationContext)