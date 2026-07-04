import { useState, useEffect, useRef, useCallback } from 'react';

export default function useWebSocket(url) {
  // Build WebSocket URL from VITE_API_URL if no explicit url passed
  const wsUrl = url || (() => {
    const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
    // Replace http -> ws / https -> wss and append path
    return baseUrl.replace(/^http/, 'ws') + '/ws/bookings';
  })();

  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected:', wsUrl);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 WebSocket message:', data);
          setMessages(prev => [...prev.slice(-100), data]);
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed, code:', event.code, 'reason:', event.reason);
        setIsConnected(false);
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Reconnecting WebSocket...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        ws.close(); // triggers onclose -> reconnect
      };
    } catch (err) {
      console.error('WebSocket creation error:', err);
      if (mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    }
  }, [wsUrl]);

  useEffect(() => {
    mountedRef.current = true;
    connect();

    return () => {
      mountedRef.current = false;
      clearTimeout(reconnectTimeoutRef.current);
      if (wsRef.current) {
        wsRef.current.close();
      }
    };
  }, [connect]);

  return { messages, isConnected };
}