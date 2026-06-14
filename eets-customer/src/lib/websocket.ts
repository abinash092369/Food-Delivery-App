import { Client } from '@stomp/stompjs'
import SockJS from 'sockjs-client'
import { useAuthStore } from '../store/auth.store'

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws'

class WebSocketService {
  private client: Client | null = null;
  private connected = false;

  public connect(onConnectCallback?: () => void, onErrorCallback?: (err: any) => void) {
    try {
      if (this.client && this.client.connected) {
        if (onConnectCallback) onConnectCallback()
        return
      }

      const { accessToken } = useAuthStore.getState()

      this.client = new Client({
        webSocketFactory: () => {
          try {
            return new SockJS(WS_URL)
          } catch (e) {
            console.error('[WebSocket] SockJS factory error', e)
            throw e
          }
        },
        connectHeaders: accessToken
          ? { Authorization: `Bearer ${accessToken}` }
          : {},
        debug: (str) => {
          console.log('[WebSocket STOMP]', str)
        },
        reconnectDelay: 5000,
        heartbeatIncoming: 4000,
        heartbeatOutgoing: 4000,
      })

      this.client.onConnect = (frame) => {
        this.connected = true
        console.log('[WebSocket] Connected successfully', frame)
        if (onConnectCallback) onConnectCallback()
      }

      this.client.onStompError = (frame) => {
        console.error('[WebSocket] STOMP Protocol Error', frame.headers['message'])
        if (onErrorCallback) onErrorCallback(frame)
      }

      this.client.onWebSocketClose = () => {
        this.connected = false
        console.log('[WebSocket] Connection closed')
      }

      this.client.activate()
    } catch (err) {
      console.error('[WebSocket] Connect method error', err)
      this.connected = false
      if (onErrorCallback) onErrorCallback(err)
    }
  }

  public disconnect() {
    try {
      if (this.client) {
        this.client.deactivate()
        this.connected = false
        this.client = null
        console.log('[WebSocket] Disconnected')
      }
    } catch (err) {
      console.error('[WebSocket] Disconnect error', err)
    }
  }

  public subscribe(destination: string, callback: (payload: any) => void) {
    if (!this.client || !this.connected) {
      // Retry in 1s if not connected yet
      const timeoutId = setTimeout(() => this.subscribe(destination, callback), 1000)
      return {
        unsubscribe: () => clearTimeout(timeoutId),
      }
    }

    try {
      const sub = this.client.subscribe(destination, (message) => {
        try {
          const payload = JSON.parse(message.body)
          callback(payload)
        } catch (err) {
          callback(message.body)
        }
      })

      return sub
    } catch (err) {
      console.error('[WebSocket] Subscribe error', err)
      return {
        unsubscribe: () => {},
      }
    }
  }
}

export const wsService = new WebSocketService()
export default wsService
