import { useEffect, useRef } from 'react';
import { useRecordVisit, useRecordDownload } from './useQueries';

// Generate or retrieve session ID
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('analytics-session-id');
  if (!sessionId) {
    sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
    sessionStorage.setItem('analytics-session-id', sessionId);
  }
  return sessionId;
}

// Get browser info
function getBrowserInfo(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Chrome')) return 'Chrome';
  if (ua.includes('Firefox')) return 'Firefox';
  if (ua.includes('Safari')) return 'Safari';
  if (ua.includes('Edge')) return 'Edge';
  return 'Unknown';
}

// Get device type
function getDeviceType(): string {
  const ua = navigator.userAgent;
  if (/mobile/i.test(ua)) return 'Mobile';
  if (/tablet/i.test(ua)) return 'Tablet';
  return 'Desktop';
}

// Get platform
function getPlatform(): string {
  const ua = navigator.userAgent;
  if (ua.includes('Win')) return 'Windows';
  if (ua.includes('Mac')) return 'MacOS';
  if (ua.includes('Linux')) return 'Linux';
  if (ua.includes('Android')) return 'Android';
  if (ua.includes('iOS')) return 'iOS';
  return 'Unknown';
}

// Get location (simplified - just timezone)
function getLocation(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'Unknown';
  } catch {
    return 'Unknown';
  }
}

export function useVisitTracking(page: string) {
  const recordVisit = useRecordVisit();
  const hasTracked = useRef(false);

  useEffect(() => {
    if (!hasTracked.current) {
      hasTracked.current = true;
      
      recordVisit.mutate({
        page,
        browser: getBrowserInfo(),
        device: getDeviceType(),
        location: getLocation(),
        sessionId: getSessionId(),
      });
    }
  }, [page]);
}

export function usePWAInstallTracking() {
  const recordDownload = useRecordDownload();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Track PWA install event
    const handleAppInstalled = () => {
      if (!hasTracked.current) {
        hasTracked.current = true;
        
        recordDownload.mutate({
          browser: getBrowserInfo(),
          device: getDeviceType(),
          platform: getPlatform(),
          version: '1.0.0',
          location: getLocation(),
          sessionId: getSessionId(),
        });
      }
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);
}
