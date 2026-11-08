import { createContext, useEffect, useState } from 'react'
import { supabase } from '../../services/supabase/client.js'
export const NotificationContext = createContext({ items: [], unread: 0 })
export function NotificationProvider({ children }) {
  const [items, setItems] = useState([])
  const [unread, setUnread] = useState(0)
  return <NotificationContext.Provider value={{ items, unread }}>{children}</NotificationContext.Provider>
}