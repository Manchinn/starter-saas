import { io } from 'socket.io-client'

// Mirror the token storage strategy used by the REST client (api/index.js).
function readToken(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
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
      auth: (cb) => cb({ token: readToken('accessToken') }),
    })
  }
  return socket
}

export function connectSocket() {
  const s = getSocket()
  s.auth = (cb) => cb({ token: readToken('accessToken') })
  if (!s.connected) s.connect()
  return s
}

export function disconnectSocket() {
  if (socket) socket.disconnect()
}
