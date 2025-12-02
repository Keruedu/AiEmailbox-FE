'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, List, Card, Button, Badge, Typography, Space, Avatar, Spin, message, Empty } from 'antd';
import {
  InboxOutlined,
  StarOutlined,
  SendOutlined,
  FileOutlined,
  DeleteOutlined,
  FolderOutlined,
  MailOutlined,
  ReloadOutlined,
  LogoutOutlined,
  PaperClipOutlined,
  ArrowLeftOutlined,
} from '@ant-design/icons';
import { useAuth } from '@/contexts/AuthContext';
import { emailService } from '@/services/email';
import { Mailbox, Email } from '@/types/email';
import ProtectedRoute from '@/components/ProtectedRoute';
import './inbox.css';

const { Header, Sider, Content } = Layout;
const { Title, Text } = Typography;

const iconMap: Record<string, React.ReactNode> = {
  InboxOutlined: <InboxOutlined />,
  StarOutlined: <StarOutlined />,
  SendOutlined: <SendOutlined />,
  FileOutlined: <FileOutlined />,
  DeleteOutlined: <DeleteOutlined />,
  FolderOutlined: <FolderOutlined />,
};

export default function InboxPage() {
  const { user, logout } = useAuth();
  const [mailboxes, setMailboxes] = useState<Mailbox[]>([]);
  const [selectedMailbox, setSelectedMailbox] = useState<string>('');
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [showMobileDetail, setShowMobileDetail] = useState(false);

  useEffect(() => {
    loadMailboxes();
  }, []);

  useEffect(() => {
    if (selectedMailbox) {
      loadEmails(selectedMailbox);
    }
  }, [selectedMailbox]);

  const loadMailboxes = async () => {
    try {
      const data = await emailService.getMailboxes();
      setMailboxes(data || []);
      if (data && data.length > 0 && !selectedMailbox) {
        const inbox = data.find(m => m.id === 'INBOX');
        setSelectedMailbox(inbox ? 'INBOX' : data[0].id);
      }
    } catch (error) {
      message.error('Failed to load mailboxes');
      console.error(error);
    }
  };

  const loadEmails = async (mailboxId: string) => {
    setEmailsLoading(true);
    try {
      const data = await emailService.getEmails(mailboxId);
      setEmails(data.emails || []);
      setSelectedEmail(null);
    } catch (error) {
      message.error('Failed to load emails');
      console.error(error);
    } finally {
      setEmailsLoading(false);
    }
  };

  const handleMailboxSelect = (mailboxId: string) => {
    setSelectedMailbox(mailboxId);
    setShowMobileDetail(false);
  };

  const handleEmailSelect = (email: Email) => {
    setSelectedEmail(email);
    setShowMobileDetail(true);
  };

  const handleRefresh = () => {
    loadEmails(selectedMailbox);
    message.success('Refreshed');
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 48) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  return (
    <ProtectedRoute>
      <Layout style={{ minHeight: '100vh' }}>
        <Header style={{ 
          background: '#fff', 
          padding: '0 24px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MailOutlined style={{ fontSize: '24px', color: '#667eea' }} />
            <Title level={4} style={{ margin: 0 }}>AI Email Box</Title>
          </div>
          <Space>
            <Text>{user?.name || user?.email}</Text>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        </Header>

        <Layout>
          {/* Left Sidebar - Mailboxes */}
          <Sider 
            width={250} 
            theme="light" 
            style={{ 
              borderRight: '1px solid #f0f0f0',
              display: showMobileDetail ? 'none' : 'block'
            }}
            breakpoint="lg"
            collapsedWidth="0"
            className="mailbox-sider"
          >
            <Menu
              mode="inline"
              selectedKeys={[selectedMailbox]}
              style={{ height: '100%', borderRight: 0 }}
              items={mailboxes.map((mailbox) => ({
                key: mailbox.id,
                icon: iconMap[mailbox.icon] || <FolderOutlined />,
                onClick: () => handleMailboxSelect(mailbox.id),
                label: (
                  <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                    <span>{mailbox.name}</span>
                    {mailbox.unreadCount > 0 && (
                      <Badge count={mailbox.unreadCount} style={{ backgroundColor: '#667eea' }} />
                    )}
                  </span>
                ),
              }))}
            />
          </Sider>

          {/* Middle - Email List */}
          <Layout 
            style={{ 
              display: showMobileDetail ? 'none' : 'flex',
              borderRight: '1px solid #f0f0f0',
              maxWidth: '600px',
            }}
            className="email-list-layout"
          >
            <div style={{ 
              padding: '16px', 
              background: '#fff', 
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}>
              <Title level={5} style={{ margin: 0 }}>
                {mailboxes.find(m => m.id === selectedMailbox)?.name || 'Emails'}
              </Title>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={emailsLoading}>
                Refresh
              </Button>
            </div>
            
            <Content style={{ padding: '8px', overflow: 'auto', height: 'calc(100vh - 120px)' }}>
              {emailsLoading ? (
                <div style={{ textAlign: 'center', padding: '48px' }}>
                  <Spin size="large" />
                </div>
              ) : emails.length === 0 ? (
                <Empty description="No emails" style={{ marginTop: '48px' }} />
              ) : (
                <List
                  dataSource={emails}
                  renderItem={(email) => (
                    <Card
                      hoverable
                      style={{ 
                        marginBottom: '8px',
                        cursor: 'pointer',
                        backgroundColor: email.isRead ? '#fff' : '#f6f8fa',
                        borderLeft: selectedEmail?.id === email.id ? '3px solid #667eea' : '3px solid transparent'
                      }}
                      bodyStyle={{ padding: '12px 16px' }}
                      onClick={() => handleEmailSelect(email)}
                    >
                      <Space direction="vertical" style={{ width: '100%' }} size={4}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Space>
                            <Text strong style={{ fontSize: '14px' }}>
                              {email.from.name || email.from.email}
                            </Text>
                            {email.isStarred && <StarOutlined style={{ color: '#faad14' }} />}
                            {email.hasAttachments && <PaperClipOutlined />}
                          </Space>
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {formatDate(email.receivedAt)}
                          </Text>
                        </div>
                        <Text strong={!email.isRead} style={{ fontSize: '13px' }}>
                          {email.subject}
                        </Text>
                        <Text type="secondary" ellipsis style={{ fontSize: '12px' }}>
                          {email.preview}
                        </Text>
                      </Space>
                    </Card>
                  )}
                />
              )}
            </Content>
          </Layout>

          {/* Right - Email Detail */}
          <Content 
            style={{ 
              background: '#fff', 
              padding: showMobileDetail ? '0' : '24px',
              overflow: 'auto',
              height: 'calc(100vh - 64px)'
            }}
            className="email-detail-content"
          >
            {showMobileDetail && (
              <Button 
                icon={<ArrowLeftOutlined />} 
                onClick={() => setShowMobileDetail(false)}
                style={{ margin: '16px' }}
                className="mobile-back-button"
              >
                Back
              </Button>
            )}
            
            {selectedEmail ? (
              <div style={{ maxWidth: '900px', margin: '0 auto', padding: showMobileDetail ? '0 16px 16px' : '0' }}>
                <Space direction="vertical" size="large" style={{ width: '100%' }}>
                  <div>
                    <Title level={3}>{selectedEmail.subject}</Title>
                    <Space direction="vertical" size="small" style={{ width: '100%' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <Avatar style={{ backgroundColor: '#667eea' }}>
                          {selectedEmail.from.name?.charAt(0) || selectedEmail.from.email.charAt(0).toUpperCase()}
                        </Avatar>
                        <div>
                          <Text strong>{selectedEmail.from.name || selectedEmail.from.email}</Text>
                          <br />
                          <Text type="secondary" style={{ fontSize: '12px' }}>
                            {selectedEmail.from.email}
                          </Text>
                        </div>
                      </div>
                      <div>
                        <Text type="secondary">To: </Text>
                        <Text>{selectedEmail.to.map(t => t.email).join(', ')}</Text>
                      </div>
                      {selectedEmail.cc && selectedEmail.cc.length > 0 && (
                        <div>
                          <Text type="secondary">Cc: </Text>
                          <Text>{selectedEmail.cc.map(c => c.email).join(', ')}</Text>
                        </div>
                      )}
                      <Text type="secondary" style={{ fontSize: '12px' }}>
                        {new Date(selectedEmail.receivedAt).toLocaleString()}
                      </Text>
                    </Space>
                  </div>

                  <Space wrap>
                    <Button type="primary">Reply</Button>
                    <Button>Reply All</Button>
                    <Button>Forward</Button>
                    <Button icon={<StarOutlined />}>
                      {selectedEmail.isStarred ? 'Unstar' : 'Star'}
                    </Button>
                    <Button icon={<DeleteOutlined />} danger>Delete</Button>
                  </Space>

                  {selectedEmail.attachments && selectedEmail.attachments.length > 0 && (
                    <Card title="Attachments" size="small">
                      <Space direction="vertical" style={{ width: '100%' }}>
                        {selectedEmail.attachments.map((attachment) => (
                          <div 
                            key={attachment.id}
                            style={{ 
                              display: 'flex', 
                              justifyContent: 'space-between', 
                              alignItems: 'center',
                              padding: '8px',
                              background: '#f6f8fa',
                              borderRadius: '4px'
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
                            <Button size="small">Download</Button>
                          </div>
                        ))}
                      </Space>
                    </Card>
                  )}

                  <Card>
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                      style={{ lineHeight: '1.6' }}
                    />
                  </Card>
                </Space>
              </div>
            ) : (
              <Empty 
                description="Select an email to view details" 
                style={{ marginTop: '20%' }}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
              />
            )}
          </Content>
        </Layout>
      </Layout>
    </ProtectedRoute>
  );
}
