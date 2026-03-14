import { io, Socket } from 'socket.io-client';
import Cookies from 'js-cookie';

const SOCKET_URL = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || 'http://localhost:5002';

export interface LocationData {
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: string;
}

type LocationCallback = (data: {
  requestId: string;
  latitude: number;
  longitude: number;
  heading: number;
  speed: number;
  timestamp: string;
}) => void;

type StatusCallback = (data: { requestId: string; active: boolean }) => void;

class SocketService {
  private socket: Socket | null = null;
  private locationCallbacks = new Map<string, LocationCallback>();
  private statusCallbacks = new Map<string, StatusCallback>();

  connect(token?: string): void {
    if (this.socket?.connected) return;

    const authToken = token || Cookies.get('customer_token');
    if (!authToken) {
      console.warn('[Socket] No auth token, cannot connect');
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token: authToken },
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 20,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
    });

    this.socket.on('connect', () => {
      console.log('[Socket] Connected');
    });

    this.socket.on('disconnect', (reason) => {
      console.log('[Socket] Disconnected:', reason);
    });

    this.socket.on('connect_error', (err) => {
      console.warn('[Socket] Connection error:', err.message);
    });

    this.socket.on('location:update', (data) => {
      const cb = this.locationCallbacks.get(data.requestId);
      if (cb) cb(data);
    });

    this.socket.on('tracking:status', (data) => {
      const cb = this.statusCallbacks.get(data.requestId);
      if (cb) cb(data);
    });
  }

  disconnect(): void {
    this.locationCallbacks.clear();
    this.statusCallbacks.clear();
    this.socket?.disconnect();
    this.socket = null;
  }

  isConnected(): boolean {
    return this.socket?.connected ?? false;
  }

  watchTracking(
    requestId: string,
    onLocation: LocationCallback,
    onStatus?: StatusCallback
  ): void {
    this.locationCallbacks.set(requestId, onLocation);
    if (onStatus) this.statusCallbacks.set(requestId, onStatus);
    this.socket?.emit('tracking:watch', { requestId });
  }

  unwatchTracking(requestId: string): void {
    this.locationCallbacks.delete(requestId);
    this.statusCallbacks.delete(requestId);
    this.socket?.emit('tracking:unwatch', { requestId });
  }
}

const socketService = new SocketService();
export default socketService;
