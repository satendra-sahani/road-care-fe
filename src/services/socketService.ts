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
  // Generic event handlers (e.g. 'call:incoming') — kept in a registry so they
  // are (re)attached whenever the socket is created/recreated, and survive a
  // handler being registered before the socket exists.
  private genericHandlers = new Map<string, Set<(...args: any[]) => void>>();

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

    // Re-bind every registered generic handler to the fresh socket.
    for (const [event, handlers] of this.genericHandlers) {
      for (const h of handlers) this.socket.on(event, h);
    }

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

  // Ensure a connection exists (uses the customer_token cookie). Safe to call
  // repeatedly — no-op if already connected.
  ensureConnected(): void {
    if (!this.socket?.connected) this.connect();
  }

  // Generic event subscription (used by the incoming-call listener). The
  // handler is stored so it survives (re)connects even if registered before the
  // socket exists. Returns an unsubscribe function.
  on(event: string, handler: (...args: any[]) => void): () => void {
    if (!this.genericHandlers.has(event)) this.genericHandlers.set(event, new Set());
    this.genericHandlers.get(event)!.add(handler);
    this.socket?.on(event, handler);
    return () => { this.off(event, handler); };
  }

  off(event: string, handler: (...args: any[]) => void): void {
    this.genericHandlers.get(event)?.delete(handler);
    this.socket?.off(event, handler);
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
