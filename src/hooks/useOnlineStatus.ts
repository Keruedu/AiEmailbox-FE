'use client';

import { useEffect, useState } from 'react';

interface NavigatorConnection {
  effectiveType?: string;
  downlink?: number;
  rtt?: number;
  addEventListener?: (type: string, listener: () => void) => void;
  removeEventListener?: (type: string, listener: () => void) => void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NavigatorConnection;
  mozConnection?: NavigatorConnection;
  webkitConnection?: NavigatorConnection;
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? navigator.onLine : true);

  useEffect(() => {

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}

export function useNetworkStatus() {
  const [networkStatus, setNetworkStatus] = useState<{
    isOnline: boolean;
    effectiveType?: string;
    downlink?: number;
    rtt?: number;
  }>({
    isOnline: true,
  });

  useEffect(() => {
    const updateNetworkStatus = () => {
      const nav = navigator as NavigatorWithConnection;
      const connection = nav.connection || 
                        nav.mozConnection || 
                        nav.webkitConnection;

      setNetworkStatus({
        isOnline: navigator.onLine,
        effectiveType: connection?.effectiveType,
        downlink: connection?.downlink,
        rtt: connection?.rtt,
      });
    };

    // Set initial state
    updateNetworkStatus();

    // Listen for online/offline events
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);

    // Listen for connection changes
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || 
                      nav.mozConnection || 
                      nav.webkitConnection;
    
    if (connection && connection.addEventListener) {
      connection.addEventListener('change', updateNetworkStatus);
    }

    return () => {
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      
      if (connection && connection.removeEventListener) {
        connection.removeEventListener('change', updateNetworkStatus);
      }
    };
  }, []);

  return networkStatus;
}

export function useCachedData<T>(cacheKey: string, defaultValue: T): [T, (value: T) => void] {
  const [data, setData] = useState<T>(defaultValue);

  useEffect(() => {
    // Try to load from cache on mount
    const loadFromCache = async () => {
      if ('caches' in window) {
        try {
          const cache = await caches.open('ai-emailbox-api-v1');
          const response = await cache.match(cacheKey);
          
          if (response) {
            const cachedData = await response.json();
            setData(cachedData);
          }
        } catch (error) {
          console.error('Failed to load from cache:', error);
        }
      }
    };

    loadFromCache();
  }, [cacheKey]);

  const updateData = (value: T) => {
    setData(value);
    
    // Save to cache
    if ('caches' in window) {
      caches.open('ai-emailbox-api-v1').then(cache => {
        const response = new Response(JSON.stringify(value), {
          headers: { 'Content-Type': 'application/json' }
        });
        cache.put(cacheKey, response);
      }).catch(error => {
        console.error('Failed to save to cache:', error);
      });
    }
  };

  return [data, updateData];
}
