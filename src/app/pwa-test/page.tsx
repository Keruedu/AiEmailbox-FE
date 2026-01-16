'use client';

import React, { useState, useEffect } from 'react';
import { Card, Button, Space, Tag, Descriptions, Alert, Divider, message } from 'antd';
import {
  WifiOutlined,
  DisconnectOutlined,
  ReloadOutlined,
  ClearOutlined,
  CheckCircleOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined
} from '@ant-design/icons';
import { useOnlineStatus, useNetworkStatus } from '@/hooks/useOnlineStatus';

export default function PWATestPage() {
  const isOnline = useOnlineStatus();
  const networkStatus = useNetworkStatus();
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);
  const [cacheInfo, setCacheInfo] = useState<{ name: string; size: number }[]>([]);
  const [isPWA] = useState(() => {
    if (typeof window !== 'undefined') {
      return window.matchMedia('(display-mode: standalone)').matches;
    }
    return false;
  });
  const [isClient] = useState(() => typeof window !== 'undefined');

  const refreshCacheInfo = async () => {
    if (!('caches' in window)) return;

    try {
      const cacheNames = await caches.keys();
      const cacheData = await Promise.all(
        cacheNames.map(async (name) => {
          const cache = await caches.open(name);
          const keys = await cache.keys();
          return { name, size: keys.length };
        })
      );
      setCacheInfo(cacheData);
    } catch (err) {
      console.error('Error getting cache info:', err);
    }
  };

  useEffect(() => {
    let mounted = true;

    const loadInitialData = async () => {
      // Get service worker registration
      if ('serviceWorker' in navigator) {
        try {
          const reg = await navigator.serviceWorker.getRegistration();
          if (mounted) {
            setSwRegistration(reg || null);
          }
        } catch (err) {
          console.error('Error getting SW registration:', err);
        }
      }

      // Get cache info
      if ('caches' in window) {
        try {
          const cacheNames = await caches.keys();
          const cacheData = await Promise.all(
            cacheNames.map(async (name) => {
              const cache = await caches.open(name);
              const keys = await cache.keys();
              return { name, size: keys.length };
            })
          );
          if (mounted) {
            setCacheInfo(cacheData);
          }
        } catch (err) {
          console.error('Error getting cache info:', err);
        }
      }
    };

    loadInitialData().catch(console.error);

    return () => {
      mounted = false;
    };
  }, []);

  const handleClearCache = async () => {
    if (!('caches' in window)) {
      message.error('Cache API không khả dụng');
      return;
    }

    try {
      const cacheNames = await caches.keys();
      await Promise.all(cacheNames.map(name => caches.delete(name)));
      message.success('Đã xóa cache thành công!');
      await refreshCacheInfo();
    } catch (error) {
      message.error('Lỗi khi xóa cache');
      console.error(error);
    }
  };

  const handleUpdateSW = async () => {
    if (!swRegistration) {
      message.warning('Service Worker chưa được đăng ký');
      return;
    }

    try {
      await swRegistration.update();
      message.success('Đã cập nhật Service Worker!');
    } catch (error) {
      message.error('Lỗi khi cập nhật Service Worker');
      console.error(error);
    }
  };

  const handleUnregisterSW = async () => {
    if (!swRegistration) {
      message.warning('Service Worker chưa được đăng ký');
      return;
    }

    try {
      await swRegistration.unregister();
      message.success('Đã unregister Service Worker!');
      setSwRegistration(null);
    } catch (error) {
      message.error('Lỗi khi unregister Service Worker');
      console.error(error);
    }
  };

  if (!isClient) {
    return <div className="p-6">Loading...</div>;
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">🧪 PWA Testing Dashboard</h1>

      {/* Online Status */}
      <Card className="mb-4">
        <div className="flex items-center justify-between">
          <Space size="large">
            <div>
              {isOnline ? (
                <Tag icon={<WifiOutlined />} color="success" className="text-lg px-4 py-2">
                  Online
                </Tag>
              ) : (
                <Tag icon={<DisconnectOutlined />} color="warning" className="text-lg px-4 py-2">
                  Offline
                </Tag>
              )}
            </div>
            <div>
              <strong>Connection Type:</strong> {networkStatus.effectiveType || 'Unknown'}
            </div>
            {networkStatus.downlink && (
              <div>
                <strong>Speed:</strong> {networkStatus.downlink} Mbps
              </div>
            )}
          </Space>
        </div>
      </Card>

      {/* PWA Status */}
      <Card title="PWA Status" className="mb-4">
        <Descriptions column={1} bordered>
          <Descriptions.Item label="Running as PWA">
            {isPWA ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Yes - Installed
              </Tag>
            ) : (
              <Tag icon={<InfoCircleOutlined />} color="default">
                No - Browser mode
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Service Worker">
            {swRegistration ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Active - {swRegistration.active?.state}
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="error">
                Not registered
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Cache API">
            {'caches' in window ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Available
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="error">
                Not available
              </Tag>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Notification API">
            {'Notification' in window ? (
              <Tag icon={<CheckCircleOutlined />} color="success">
                Available
              </Tag>
            ) : (
              <Tag icon={<CloseCircleOutlined />} color="error">
                Not available
              </Tag>
            )}
          </Descriptions.Item>
        </Descriptions>
      </Card>

      {/* Cache Information */}
      <Card
        title="Cache Storage"
        extra={
          <Button
            type="primary"
            danger
            icon={<ClearOutlined />}
            onClick={handleClearCache}
          >
            Clear All Cache
          </Button>
        }
        className="mb-4"
      >
        {cacheInfo.length > 0 ? (
          <div>
            {cacheInfo.map(cache => (
              <Alert
                key={cache.name}
                message={cache.name}
                description={`${cache.size} cached items`}
                type="info"
                showIcon
                className="mb-2"
              />
            ))}
          </div>
        ) : (
          <Alert
            message="No cache found"
            type="warning"
            showIcon
          />
        )}
      </Card>

      {/* Service Worker Controls */}
      {swRegistration && (
        <Card title="Service Worker Controls" className="mb-4">
          <Space>
            <Button
              type="primary"
              icon={<ReloadOutlined />}
              onClick={handleUpdateSW}
            >
              Update Service Worker
            </Button>
            <Button
              danger
              onClick={handleUnregisterSW}
            >
              Unregister Service Worker
            </Button>
          </Space>
        </Card>
      )}

      {/* Instructions */}
      <Card title="Testing Instructions">
        <Divider orientation="left">Test Offline Mode</Divider>
        <ol className="list-decimal list-inside space-y-2">
          <li>Open Chrome DevTools (F12)</li>
          <li>Go to Network tab</li>
          <li>Select &quot;Offline&quot; in throttling dropdown</li>
          <li>Reload page - it should still work!</li>
          <li>Navigate to /inbox to see cached emails</li>
        </ol>

        <Divider orientation="left">Test Installation</Divider>
        <ol className="list-decimal list-inside space-y-2">
          <li>Look for install button in Chrome address bar</li>
          <li>Click to install as PWA</li>
          <li>App will open in standalone window</li>
          <li>Check &quot;Running as PWA&quot; status above</li>
        </ol>

        <Divider orientation="left">Test Caching</Divider>
        <ol className="list-decimal list-inside space-y-2">
          <li>Browse to /inbox and load some emails</li>
          <li>Check &quot;Cache Storage&quot; section above</li>
          <li>Go offline (DevTools → Network → Offline)</li>
          <li>Reload page - cached emails should appear</li>
          <li>Online status indicator should show &quot;Offline&quot;</li>
        </ol>

        <Divider orientation="left">Clear Everything</Divider>
        <ol className="list-decimal list-inside space-y-2">
          <li>Click &quot;Clear All Cache&quot; button above</li>
          <li>Unregister Service Worker if needed</li>
          <li>Reload page to start fresh</li>
        </ol>
      </Card>

      <Alert
        message="Pro Tip"
        description="Open DevTools → Application tab to see detailed Service Worker and Cache information"
        type="info"
        showIcon
        icon={<InfoCircleOutlined />}
        className="mt-4"
      />
    </div>
  );
}
