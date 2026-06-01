import { io } from 'socket.io-client'
import { useAuthStore } from '@/stores/auth'

// The access token lives in memory (Pinia), so the socket reads it from the
// store. Used lazily inside the auth callback, so the store/socket import cycle
// resolves fine (neither is referenced at module-eval time).
function currentToken() {
  try { return useAuthStore().accessToken } catch { return null }
}

let socket = null

// Lazily create a single shared socket. Connects to the same origin — in dev
// Vite proxies `/socket.io` (ws) to the API server; in prod they share a host.
// The access token is read on every (re)connect so reconnects use a fresh one.
export function getSocket() {
  if (!socket) {
    socket = io({
      autoConnect: false,
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      auth: (cb) => cb({ token: currentToken() }),
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  s.auth = (cb) => cb({ token: currentToken() })
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  if (socket) socket.disconnect()
}
