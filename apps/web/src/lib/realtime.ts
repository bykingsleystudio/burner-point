import { io, type Socket } from 'socket.io-client';
import { getAccessToken } from './api';

type RealtimeListener = (data: unknown) => void;

const listeners = new Map<string, Set<RealtimeListener>>();
let socket: Socket | null = null;
let socketToken: string | null = null;

function realtimeUrl() {
  const configured = process.env.NEXT_PUBLIC_WS_URL?.trim().replace(/\/+$/, '');
  if (configured) return configured.replace(/\/events$/, '');
  const apiUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/+$/, '');
  return apiUrl ? apiUrl.replace(/^http/, 'ws').replace(/\/api$/, '') : '';
}

function ensureSocket() {
  if (typeof window === 'undefined') return null;
  const token = getAccessToken();
  const baseUrl = realtimeUrl();
  if (!token || !baseUrl) return null;
  if (socket && socketToken === token) return socket;
  socket?.disconnect();
  socketToken = token;
  socket = io(`${baseUrl}/events`, { auth: { token }, transports: ['websocket'] });
  listeners.forEach((eventListeners, event) => {
    eventListeners.forEach((listener) => socket?.on(event, listener));
  });
  return socket;
}

export function subscribeToRealtime(events: string[], listener: RealtimeListener) {
  const activeSocket = ensureSocket();
  if (!activeSocket) return () => undefined;
  events.forEach((event) => {
    if (!listeners.has(event)) listeners.set(event, new Set());
    listeners.get(event)?.add(listener);
    activeSocket.on(event, listener);
  });
  return () => {
    events.forEach((event) => {
      listeners.get(event)?.delete(listener);
      if (!listeners.get(event)?.size) listeners.delete(event);
      activeSocket.off(event, listener);
    });
    if (!listeners.size) {
      activeSocket.disconnect();
      socket = null;
      socketToken = null;
    }
  };
}
