import { useState, useEffect, useRef, useCallback } from 'react';

export default function useWebSocket(url) {
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const mountedRef = useRef(true);

  const connect = useCallback(() => {
    if (!mountedRef.current) return;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('✅ WebSocket connected:', url);
        setIsConnected(true);
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log('📩 WebSocket message:', data);
          setMessages(prev => [...prev.slice(-100), data]); // keep last 100
        } catch (err) {
          console.error('WebSocket parse error:', err);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket closed, code:', event.code, 'reason:', event.reason);
        setIsConnected(false);
        // Auto-reconnect after 3 seconds
        if (mountedRef.current) {
          reconnectTimeoutRef.current = setTimeout(() => {
            console.log('🔄 Reconnecting WebSocket...');
            connect();
          }, 3000);
        }
      };

      ws.onerror = (error) => {
        console.error('❌ WebSocket error:', error);
        ws.close(); // will trigger onclose and reconnect
      };
    } catch (err) {
      console.error('WebSocket creation error:', err);
      // Retry after 5 seconds
      if (mountedRef.current) {
        reconnectTimeoutRef.current = setTimeout(connect, 5000);
      }
    }
  }, [url]);

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