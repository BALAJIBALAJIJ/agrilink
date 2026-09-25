import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

const WS_URL = import.meta.env.VITE_WS_URL || 'http://localhost:8080/ws';

let stompClient = null;
const subscriptions = new Map();

export function connectWebSocket(userId, onNotification) {
  if (stompClient?.connected) return;

  stompClient = new Client({
    webSocketFactory: () => new SockJS(WS_URL),
    reconnectDelay: 5000,
    heartbeatIncoming: 4000,
    heartbeatOutgoing: 4000,

    onConnect: () => {
      console.log('WebSocket connected');

      // Subscribe to user-specific notifications
      if (userId) {
        stompClient.subscribe(`/user/${userId}/queue/notifications`, (message) => {
          const notification = JSON.parse(message.body);
          if (onNotification) onNotification(notification);
        });
      }
    },

    onStompError: (frame) => {
      console.error('WebSocket error', frame);
    },
  });

  stompClient.activate();
}

export function subscribeToGps(transportRequestId, onLocation) {
  if (!stompClient?.connected) return null;

  const sub = stompClient.subscribe(`/topic/gps/${transportRequestId}`, (message) => {
    const location = JSON.parse(message.body);
    if (onLocation) onLocation(location);
  });

  subscriptions.set(`gps-${transportRequestId}`, sub);
  return sub;
}

export function subscribeToTransportStatus(transportRequestId, onStatus) {
  if (!stompClient?.connected) return null;

  const sub = stompClient.subscribe(`/topic/transport/${transportRequestId}`, (message) => {
    const status = JSON.parse(message.body);
    if (onStatus) onStatus(status);
  });

  subscriptions.set(`transport-${transportRequestId}`, sub);
  return sub;
}

export function unsubscribe(key) {
  const sub = subscriptions.get(key);
  if (sub) {
    sub.unsubscribe();
    subscriptions.delete(key);
  }
}

export function disconnectWebSocket() {
  if (stompClient) {
    stompClient.deactivate();
    stompClient = null;
    subscriptions.clear();
  }
}

export function sendGpsUpdate(transporterId, requestId, latitude, longitude, speed, heading) {
  if (!stompClient?.connected) return;

  stompClient.publish({
    destination: '/app/gps-update',
    body: JSON.stringify({ transporterId, requestId, latitude, longitude, speed, heading }),
  });
}
