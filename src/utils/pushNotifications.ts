/**
 * Client-Side Web Push & Service Worker Registration
 * Enables real background push notifications on Mobile (Android / iOS PWA) & Desktop
 */

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/\-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export async function registerServiceWorkerAndPush(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
}> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return { supported: false, permission: 'denied', subscribed: false };
  }

  try {
    // 1. Register service worker
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });
    await navigator.serviceWorker.ready;

    // 2. Request browser permission
    const permission = await Notification.requestPermission();
    if (permission !== 'granted') {
      return { supported: true, permission, subscribed: false };
    }

    // 3. Check for PushManager support
    if (!('PushManager' in window)) {
      return { supported: true, permission, subscribed: false };
    }

    // 4. Fetch VAPID public key from backend
    const keyRes = await fetch('/api/vapid-public-key');
    if (!keyRes.ok) {
      return { supported: true, permission, subscribed: false };
    }
    const { publicKey } = await keyRes.json();
    if (!publicKey) {
      return { supported: true, permission, subscribed: false };
    }

    // 5. Subscribe to push manager
    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();
    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as any,
      });
    }

    // 6. Send subscription to backend server
    await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subscription),
    });

    return { supported: true, permission: 'granted', subscribed: true };
  } catch (e) {
    console.warn('Push registration warning:', e);
    return {
      supported: true,
      permission: typeof Notification !== 'undefined' ? Notification.permission : 'denied',
      subscribed: false,
    };
  }
}

export async function triggerServerPushTest(): Promise<boolean> {
  try {
    const res = await fetch('/api/notifications/test', { method: 'POST' });
    return res.ok;
  } catch {
    return false;
  }
}
