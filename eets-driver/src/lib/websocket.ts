import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

class WebSocketService {
  private client: Client | null = null;
  private connectedCallbacks: Set<() => void> = new Set();
  private subscriptionCallbacks: Map<string, Set<(message: any) => void>> = new Map();
  private activeSubscriptions: Map<string, any> = new Map();

  connect(accessToken: string) {
    if (this.client && this.client.connected) {
      return;
    }

    this.client = new Client({
      webSocketFactory: () => new SockJS(WS_URL),
      connectHeaders: {
        Authorization: `Bearer ${accessToken}`,
      },
      debug: (str) => {
        console.log('[STOMP]', str);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    this.client.onConnect = (frame) => {
      console.log('[STOMP] Connected', frame);
      this.connectedCallbacks.forEach((cb) => cb());
      // Re-subscribe to topics if connection is re-established
      this.subscriptionCallbacks.forEach((_callbacks, topic) => {
        this.subscribeToTopic(topic);
      });
    };

    this.client.onStompError = (frame) => {
      console.error('[STOMP] Error', frame.headers['message']);
      console.error('[STOMP] Details', frame.body);
    };

    this.client.onWebSocketClose = () => {
      console.log('[STOMP] Connection closed');
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
      this.client = null;
      this.activeSubscriptions.clear();
      console.log('[STOMP] Disconnected');
    }
  }

  onConnect(cb: () => void) {
    this.connectedCallbacks.add(cb);
    if (this.client && this.client.connected) {
      cb();
    }
    return () => {
      this.connectedCallbacks.delete(cb);
    };
  }

  subscribe(topic: string, callback: (message: any) => void) {
    if (!this.subscriptionCallbacks.has(topic)) {
      this.subscriptionCallbacks.set(topic, new Set());
    }
    this.subscriptionCallbacks.get(topic)!.add(callback);

    if (this.client && this.client.connected) {
      this.subscribeToTopic(topic);
    }

    return () => {
      const callbacks = this.subscriptionCallbacks.get(topic);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptionCallbacks.delete(topic);
          const sub = this.activeSubscriptions.get(topic);
          if (sub) {
            sub.unsubscribe();
            this.activeSubscriptions.delete(topic);
          }
        }
      }
    };
  }

  private subscribeToTopic(topic: string) {
    if (this.activeSubscriptions.has(topic)) {
      return;
    }
    if (!this.client || !this.client.connected) {
      return;
    }

    const sub = this.client.subscribe(topic, (message) => {
      try {
        const payload = JSON.parse(message.body);
        const callbacks = this.subscriptionCallbacks.get(topic);
        if (callbacks) {
          callbacks.forEach((cb) => cb(payload));
        }
      } catch (err) {
        console.error('[STOMP] Error parsing message body', err);
      }
    });

    this.activeSubscriptions.set(topic, sub);
  }

  publish(destination: string, body: any) {
    if (!this.client || !this.client.connected) {
      console.warn('[STOMP] Cannot publish, client not connected');
      return;
    }
    this.client.publish({
      destination,
      body: JSON.stringify(body),
    });
  }

  isConnected() {
    return this.client !== null && this.client.connected;
  }
}

export const wsService = new WebSocketService();
export default wsService;
