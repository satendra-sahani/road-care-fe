import { useEffect, useState } from 'react';
import Cookies from 'js-cookie';
import socketService from '@/services/socketService';

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = Cookies.get('customer_token');
    if (!token) return;

    socketService.connect(token);
    setIsConnected(socketService.isConnected());

    return () => {
      // Don't disconnect on unmount — socket stays alive for app lifetime
      // Only disconnect on explicit logout
    };
  }, []);

  return { isConnected };
}
