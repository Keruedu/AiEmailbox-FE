import React from 'react';
import { Button, Typography, Space, Avatar, Card, Empty, Spin } from 'antd';
import {
  ArrowLeftOutlined,
  StarOutlined,
  DeleteOutlined,
  PaperClipOutlined,
} from '@ant-design/icons';
import { Email } from '@/types/email';

const { Title, Text } = Typography;

interface EmailDetailProps {
  email: Email | null;
  onBack: () => void;
  onStar: (e: React.MouseEvent, email: Email) => void;
  onDelete: (e: React.MouseEvent, email: Email) => void;
  onDownloadAttachment: (emailId: string, attachmentId: string, filename: string) => void;
  showMobileDetail: boolean;
  className?: string;
  style?: React.CSSProperties;
}

const EmailDetail: React.FC<EmailDetailProps> = ({
  email,
  onBack,
  onStar,
  onDelete,
  onDownloadAttachment,
  showMobileDetail,
  className,
  style,
}) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  if (!email) {
    return (
      <Empty
        description="Select an email to view details"
        style={{ marginTop: '20%' }}
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  return (
    <div className={className} style={style}>
      {showMobileDetail && (
        <Button
          icon={<ArrowLeftOutlined />}
          onClick={onBack}
          style={{ margin: '16px' }}
          className="mobile-back-button"
        >
          Back
        </Button>
      )}

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: showMobileDetail ? '0 16px 16px' : '0' }}>
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
          <div>
            <Title level={3}>{email.subject}</Title>
            <Space direction="vertical" size="small" style={{ width: '100%' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <Avatar style={{ backgroundColor: '#667eea' }}>
                  {email.from.name?.charAt(0) || email.from.email.charAt(0).toUpperCase()}
                </Avatar>
                <div>
                  <Text strong>{email.from.name || email.from.email}</Text>
                  <br />
                  <Text type="secondary" style={{ fontSize: '12px' }}>
                    {email.from.email}
                  </Text>
                </div>
              </div>
              <div>
                <Text type="secondary">To: </Text>
                <Text>{email.to.map((t) => t.email).join(', ')}</Text>
              </div>
              {email.cc && email.cc.length > 0 && (
                <div>
                  <Text type="secondary">Cc: </Text>
                  <Text>{email.cc.map((c) => c.email).join(', ')}</Text>
                </div>
              )}
              <Text type="secondary" style={{ fontSize: '12px' }}>
                {new Date(email.receivedAt).toLocaleString()}
              </Text>
            </Space>
          </div>

          <Space wrap>
            <Button type="primary">Reply</Button>
            <Button>Reply All</Button>
            <Button>Forward</Button>
            <Button icon={<StarOutlined />} onClick={(e) => onStar(e, email)}>
              {email.isStarred ? 'Unstar' : 'Star'}
            </Button>
            <Button icon={<DeleteOutlined />} danger onClick={(e) => onDelete(e, email)}>
              Delete
            </Button>
          </Space>

          {email.attachments && email.attachments.length > 0 && (
            <Card title="Attachments" size="small">
              <Space direction="vertical" style={{ width: '100%' }}>
                {email.attachments.map((attachment) => (
                  <div
                    key={attachment.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '8px',
                      background: '#f6f8fa',
                      borderRadius: '4px',
                    }}
                  >
                    <Space>
                      <PaperClipOutlined />
                      <div>
                        <Text strong>{attachment.filename}</Text>
                        <br />
                        <Text type="secondary" style={{ fontSize: '12px' }}>
                          {formatFileSize(attachment.size)}
                        </Text>
                      </div>
                    </Space>
                    <Button
                      size="small"
                      onClick={() =>
                        onDownloadAttachment(email.id, attachment.id, attachment.filename)
                      }
                    >
                      Download
                    </Button>
                  </div>
                ))}
              </Space>
            </Card>
          )}

          <Card>
            {!email.body ? (
                <div style={{ textAlign: 'center', padding: '20px' }}>
                    <Spin size="large" tip="Loading content..." />
                </div>
            ) : (
                <div
                dangerouslySetInnerHTML={{ __html: email.body }}
                className="email-body-content"
                style={{ 
                    lineHeight: '1.6', 
                    overflowWrap: 'break-word', 
                    wordBreak: 'break-word',
                    maxWidth: '100%',
                    overflowX: 'auto'
                }}
                />
            )}
          </Card>
        </Space>
      </div>
    </div>
  );
};

export default EmailDetail;
