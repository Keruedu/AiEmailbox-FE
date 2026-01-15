'use client';

import { Result, Button } from 'antd';
import { DisconnectOutlined, ReloadOutlined } from '@ant-design/icons';
import { useRouter } from 'next/navigation';

export default function OfflinePage() {
  const router = useRouter();

  const handleRetry = () => {
    if (navigator.onLine) {
      router.push('/inbox');
    } else {
      window.location.reload();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Result
        icon={<DisconnectOutlined style={{ fontSize: 72, color: '#faad14' }} />}
        title="Bạn đang offline"
        subTitle="Không có kết nối Internet. Vui lòng kiểm tra kết nối mạng của bạn."
        extra={[
          <Button
            key="retry"
            type="primary"
            icon={<ReloadOutlined />}
            onClick={handleRetry}
          >
            Thử lại
          </Button>,
          <Button
            key="cache"
            onClick={() => router.push('/inbox')}
          >
            Xem email đã lưu
          </Button>,
        ]}
      >
        <div className="text-gray-600 text-sm mt-4">
          <p>Khi bạn đã xem email trước đó, chúng vẫn có thể xem được trong chế độ offline.</p>
          <p className="mt-2">Các tính năng bị hạn chế khi offline:</p>
          <ul className="list-disc list-inside mt-2 text-left max-w-md mx-auto">
            <li>Không thể gửi email mới</li>
            <li>Không thể cập nhật trạng thái email</li>
            <li>Không thể tải email mới</li>
            <li>Không thể tìm kiếm online</li>
          </ul>
        </div>
      </Result>
    </div>
  );
}
