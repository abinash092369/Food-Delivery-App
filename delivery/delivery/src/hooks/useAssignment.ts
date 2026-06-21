import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate, useLocation } from 'react-router-dom';
import { useDriverAuthStore } from '../store/driver-auth.store';
import { useAssignmentStore } from '../store/assignment.store';
import { driverApi } from '../api/driver.api';
import { wsService } from '../lib/websocket';

export function useAssignment() {
  const { driver, accessToken } = useDriverAuthStore();
  const { isOnline, currentAssignment, setCurrentAssignment } = useAssignmentStore();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Keep track of Web Audio context and intervals
  const audioCtxRef = useRef<{ ctx: AudioContext; intervalId: any } | null>(null);

  // Poll current and available assignments every 5s when online
  const { data, refetch } = useQuery({
    queryKey: ['assignments'],
    queryFn: async () => {
      const [currentRes, availableRes] = await Promise.all([
        driverApi.getCurrentAssignment().catch(() => ({ data: null })),
        driverApi.getAvailableAssignments().catch(() => ({ data: [] }))
      ]);

      if (currentRes.data) {
        return currentRes.data;
      }
      if (availableRes.data && availableRes.data.length > 0) {
        return availableRes.data[0];
      }
      return null;
    },
    enabled: isOnline && !!accessToken && !!driver,
    refetchInterval: 5000,
  });

  const playAlertSound = () => {
    // Vibrate device
    if (navigator.vibrate) {
      navigator.vibrate([200, 100, 200, 100, 200]);
    }

    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioContextClass) return;
      
      // Stop any existing context
      stopAlertSound();

      const ctx = new AudioContextClass();
      
      const triggerChime = () => {
        const osc1 = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        osc1.type = 'sine';
        osc1.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
        osc1.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(293.66, ctx.currentTime); // D4
        
        gainNode.gain.setValueAtTime(0.15, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);

        osc1.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc1.start();
        osc2.start();
        osc1.stop(ctx.currentTime + 0.5);
        osc2.stop(ctx.currentTime + 0.5);
      };

      // Play immediately
      triggerChime();

      // Repeat chime every 1.2s
      const intervalId = setInterval(() => {
        triggerChime();
        if (navigator.vibrate) {
          navigator.vibrate([200, 100, 200]);
        }
      }, 1200);

      audioCtxRef.current = { ctx, intervalId };
    } catch (e) {
      console.warn('Web Audio synthesis failed or blocked', e);
    }
  };

  const stopAlertSound = () => {
    if (audioCtxRef.current) {
      clearInterval(audioCtxRef.current.intervalId);
      try {
        audioCtxRef.current.ctx.close();
      } catch (e) {
        // Ignore close errors
      }
      audioCtxRef.current = null;
    }
    if (navigator.vibrate) {
      navigator.vibrate(0);
    }
  };

  // Sync polling query data with store
  useEffect(() => {
    if (data) {
      if (data.status === 'ASSIGNED') {
        if (!currentAssignment || currentAssignment.id !== data.id) {
          playAlertSound();
        }
        setCurrentAssignment(data);
        if (location.pathname !== '/assignment/alert') {
          navigate('/assignment/alert', { replace: true, state: { assignment: data } });
        }
      } else if (data.status === 'ACCEPTED' || data.status === 'PICKED_UP') {
        stopAlertSound();
        setCurrentAssignment(data);
      } else {
        stopAlertSound();
        setCurrentAssignment(null);
      }
    } else {
      if (currentAssignment && currentAssignment.status === 'ASSIGNED') {
        setCurrentAssignment(null);
      }
      stopAlertSound();
    }
  }, [data, location.pathname, currentAssignment, navigate, setCurrentAssignment]);

  // Subscribe to WebSocket for real-time assignments
  useEffect(() => {
    if (!isOnline || !driver || !accessToken) {
      return;
    }

    const topic = `/topic/driver/${driver.id}`;
    const unsubscribe = wsService.subscribe(topic, (payload) => {
      console.log('[STOMP] Received WebSocket assignment payload:', payload);
      // Fetch full assignment info via REST API to ensure data format parity
      refetch();
    });

    return () => {
      unsubscribe();
    };
  }, [isOnline, driver, accessToken, refetch]);

  // Clean up sound on unmount
  useEffect(() => {
    return () => {
      stopAlertSound();
    };
  }, []);

  return { currentAssignment, refetch, stopAlertSound, playAlertSound };
}
export default useAssignment;
