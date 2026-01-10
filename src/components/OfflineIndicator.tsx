'use client';

import { useEffect, useState } from 'react';
import { notification } from 'antd';
import { WifiOutlined, DisconnectOutlined } from '@ant-design/icons';

export default function OfflineIndicator() {
  const [isOnline, setIsOnline] = useState(() => typeof window !== 'undefined' ? navigator.onLine : true);
  const [api, contextHolder] = notification.useNotification();

  useEffect(() => {

    const handleOnline = () => {
      setIsOnline(true);
      api.success({
        message: 'Đã kết nối lại',
        description: 'Bạn đã có kết nối Internet. Dữ liệu đang được đồng bộ...',
        icon: <WifiOutlined style={{ color: '#52c41a' }} />,
        placement: 'bottomRight',
        duration: 3,
      });

      // Reload fresh data when coming back online
      window.location.reload();
    };

    const handleOffline = () => {
      setIsOnline(false);
      api.warning({
        message: 'Mất kết nối',
        description: 'Bạn đang ở chế độ offline. Một số tính năng có thể bị hạn chế.',
        icon: <DisconnectOutlined style={{ color: '#faad14' }} />,
        placement: 'bottomRight',
        duration: 0, // Keep it open until back online
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [api]);

  return (
    <>
      {contextHolder}
      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-yellow-500 text-white px-4 py-2 text-center z-50 text-sm">
          <DisconnectOutlined className="mr-2" />
          Bạn đang ở chế độ offline - Đang hiển thị dữ liệu đã lưu
        </div>
      )}
    </>
  );
}
