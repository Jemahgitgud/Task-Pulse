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

function keysMatch(existingBuffer: ArrayBuffer | null, expected: Uint8Array): boolean {
  if (!existingBuffer) return false;
  const existing = new Uint8Array(existingBuffer);
  if (existing.length !== expected.length) return false;
  for (let i = 0; i < existing.length; i++) {
    if (existing[i] !== expected[i]) return false;
  }
  return true;
}

export function isEmbeddedIframe(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return window.self !== window.top;
  } catch {
    return true;
  }
}

async function subscribePushWithRegistration(registration: ServiceWorkerRegistration): Promise<boolean> {
  if (typeof window === 'undefined' || !('PushManager' in window)) {
    return false;
  }

  try {
    const keyRes = await fetch('/api/vapid-public-key');
    if (!keyRes.ok) return false;
    const { publicKey } = await keyRes.json();
    if (!publicKey) return false;

    const applicationServerKey = urlBase64ToUint8Array(publicKey);
    let subscription = await registration.pushManager.getSubscription();

    // If an old subscription exists from a previous VAPID key, refresh it
    if (subscription && !keysMatch(subscription.options.applicationServerKey, applicationServerKey)) {
      try {
        await subscription.unsubscribe();
      } catch {}
      subscription = null;
    }

    if (!subscription) {
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey as unknown as BufferSource,
      });
    }

    const subRes = await fetch('/api/notifications/subscribe', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        subscription,
        timezoneOffsetMinutes: new Date().getTimezoneOffset(),
      }),
    });

    return subRes.ok;
  } catch (e) {
    console.warn('Web Push subscription warning:', e);
    return false;
  }
}

/**
 * Registers the Service Worker silently on app boot, and if browser permission
 * is already 'granted', refreshes and syncs the Web Push subscription with the server.
 */
export async function syncPushSubscriptionIfGranted(): Promise<{
  permission: NotificationPermission | 'default';
  subscribed: boolean;
}> {
  if (typeof window === 'undefined') {
    return { permission: 'default', subscribed: false };
  }

  const currentPerm: NotificationPermission | 'default' =
    'Notification' in window ? Notification.permission : 'default';

  if (!('serviceWorker' in navigator)) {
    return { permission: currentPerm, subscribed: false };
  }

  try {
    const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;

    if (currentPerm === 'granted') {
      const subscribed = await subscribePushWithRegistration(registration);
      return { permission: 'granted', subscribed };
    }

    return { permission: currentPerm, subscribed: false };
  } catch {
    return { permission: currentPerm, subscribed: false };
  }
}

export async function registerServiceWorkerAndPush(): Promise<{
  supported: boolean;
  permission: NotificationPermission;
  subscribed: boolean;
  blockedByIframe: boolean;
}> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return { supported: false, permission: 'denied', subscribed: false, blockedByIframe: isEmbeddedIframe() };
  }

  let registration: ServiceWorkerRegistration | null = null;
  if ('serviceWorker' in navigator) {
    try {
      registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;
    } catch (e) {
      console.warn('Service worker registration warning:', e);
    }
  }

  let permission: NotificationPermission = Notification.permission;
  if (permission !== 'granted') {
    try {
      permission = await Notification.requestPermission();
    } catch {
      permission = Notification.permission;
    }
  }

  if (permission !== 'granted') {
    return {
      supported: true,
      permission,
      subscribed: false,
      blockedByIframe: isEmbeddedIframe(),
    };
  }

  const subscribed = registration ? await subscribePushWithRegistration(registration) : false;
  return {
    supported: true,
    permission: 'granted',
    subscribed,
    blockedByIframe: false,
  };
}

export async function triggerServerPushTest(): Promise<{ ok: boolean; subscribersNotified: number }> {
  try {
    const res = await fetch('/api/notifications/test', { method: 'POST' });
    if (!res.ok) return { ok: false, subscribersNotified: 0 };
    const data = await res.json();
    return { ok: true, subscribersNotified: data.subscribersNotified || 0 };
  } catch {
    return { ok: false, subscribersNotified: 0 };
  }
}
