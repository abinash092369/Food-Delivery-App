import { useEffect, useState } from 'react'
import { wsService } from '../lib/websocket'
import { OrderStatus } from '../types'

export const useOrderTracking = (orderId: number | string | undefined) => {
  const [status, setStatus] = useState<OrderStatus | null>(null)
  const [estimatedDeliveryAt, setEstimatedDeliveryAt] = useState<string | null>(null)
  const [driverLocation, setDriverLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [driverEta, setDriverEta] = useState<string | null>(null)
  const [connected, setConnected] = useState(false)

  useEffect(() => {
    if (!orderId) return

    let isMounted = true;
    let statusSub: any = null;
    let driverSub: any = null;

    try {
      wsService.connect(
        () => {
          if (!isMounted) return
          setConnected(true)

          try {
            // Subscribe to order tracking topic
            statusSub = wsService.subscribe(
              `/topic/order/${orderId}`,
              (payload: any) => {
                if (!isMounted) return
                
                // Differentiate based on 'event' field
                if (payload.event === 'status_updated') {
                  if (payload.status) setStatus(payload.status)
                } else if (payload.event === 'order_delivered') {
                  setStatus('DELIVERED')
                } else if (payload.event === 'order_cancelled') {
                  setStatus('CANCELLED')
                } else if (payload.event === 'driver_assigned') {
                  setStatus('ACCEPTED')
                } else if (payload.event === 'driver_location') {
                  if (payload.lat !== undefined && payload.lng !== undefined) {
                    setDriverLocation({ lat: payload.lat, lng: payload.lng })
                  }
                  if (payload.eta !== undefined) {
                    setDriverEta(`${payload.eta} mins`)
                  }
                } else {
                  // Direct fallback
                  if (payload.status) setStatus(payload.status)
                  if (payload.estimatedDeliveryAt) setEstimatedDeliveryAt(payload.estimatedDeliveryAt)
                }
              }
            )
          } catch (subErr) {
            console.error('Subscription to WS topic failed', subErr)
          }
        },
        (err) => {
          console.error('STOMP Connection failed', err)
          if (isMounted) setConnected(false)
        }
      )
    } catch (wsErr) {
      console.error('wsService.connect threw an error', wsErr)
      if (isMounted) setConnected(false)
    }

    return () => {
      isMounted = false
      if (statusSub && typeof statusSub.unsubscribe === 'function') {
        statusSub.unsubscribe()
      }
    }
  }, [orderId])

  return {
    status,
    estimatedDeliveryAt,
    driverLocation,
    driverEta,
    connected,
  }
}
export default useOrderTracking
