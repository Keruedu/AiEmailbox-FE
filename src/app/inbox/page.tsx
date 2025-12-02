'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, List, Card, Button, Badge, Typography, Space, Avatar, Spin, message, Empty } from 'antd';
import ComposeModal from '@/components/ComposeModal';
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
  EditOutlined,
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
  const [isComposeVisible, setIsComposeVisible] = useState(false);

  const handleComposeClose = () => {
    setIsComposeVisible(false);
  };

  const handleComposeSend = () => {
    setIsComposeVisible(false);
    if (selectedMailbox === 'SENT') {
      loadEmails('SENT');
    }
  };

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

  const handleStar = async (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    try {
      // Toggle star: if currently starred, we want to unstar (isStarred=false), so we pass false.
      // Wait, toggleStar implementation: if isStarred=true -> add STARRED label.
      // So if email.isStarred is true, we want to remove it.
      // My service implementation: toggleStar(id, isStarred) -> if isStarred, add label.
      // So we should pass !email.isStarred to set the new state.
      await emailService.toggleStar(email.id, !email.isStarred);
      
      // Optimistic update
      const updateEmails = (list: Email[]) => list.map(e => 
        e.id === email.id ? { ...e, isStarred: !e.isStarred } : e
      );
      setEmails(updateEmails(emails));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail({ ...selectedEmail, isStarred: !selectedEmail.isStarred });
      }
      message.success(email.isStarred ? 'Unstarred' : 'Starred');
    } catch (error) {
      message.error('Failed to update star');
    }
  };

  const handleDelete = async (e: React.MouseEvent, email: Email) => {
    e.stopPropagation();
    try {
      await emailService.deleteEmail(email.id);
      setEmails(emails.filter(e => e.id !== email.id));
      if (selectedEmail?.id === email.id) {
        setSelectedEmail(null);
        setShowMobileDetail(false);
      }
      message.success('Email deleted');
    } catch (error) {
      message.error('Failed to delete email');
    }
  };

  const handleDownloadAttachment = async (emailId: string, attachmentId: string, filename: string) => {
    try {
      const url = emailService.getAttachmentUrl(emailId, attachmentId);
      // For authenticated download, we might need to fetch with axios and create blob
      // But for now, let's try opening in new tab if it works with cookie/session
      // Since we use Bearer token, we need to fetch it.
      
      // Simple fetch implementation
      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken') || ''}` // Assuming we can get token
        }
      });
      
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      message.error('Failed to download attachment');
    }
  };

  return (
    <ProtectedRoute>
      <Layout style={{ minHeight: '100vh' }}>
        <Header className="inbox-header" style={{ 
          background: '#fff', 
          padding: '0 16px', 
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1,
          height: 'auto',
          minHeight: '64px',
          flexWrap: 'wrap'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MailOutlined style={{ fontSize: '24px', color: '#667eea' }} />
            <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>AI Email Box</Title>
          </div>
          <Space>
            <Text className="header-user-email" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {user?.name || user?.email}
            </Text>
            <Button icon={<LogoutOutlined />} onClick={handleLogout}>
              Logout
            </Button>
          </Space>
        </Header>

        <Layout className="main-layout">
          {/* Left Sidebar - Mailboxes */}
          <Sider 
            width={250} 
            theme="light" 
            style={{ 
              borderRight: '1px solid #f0f0f0',
              // On mobile: hide if detail is shown OR if email list is shown (technically list is always shown on mobile unless detail is open)
              // But we want Sider to be hidden on mobile generally unless toggled? 
              // For simplicity: Mobile view = Stack. 
              // If showMobileDetail is true, hide Sider.
              // If showMobileDetail is false, show Sider? No, usually Sider is hidden behind a menu or takes full width.
              // Let's make Sider hidden on small screens and use a Drawer or just stack it.
              // For this assignment: 3-column on desktop, 1-column on mobile.
              // Mobile: Mailbox List -> Email List -> Email Detail.
              // So we need another state for "Show Mailbox List".
              // Let's assume: Desktop = All 3 visible. Mobile = One active view.
            }}
            breakpoint="lg"
            collapsedWidth="0"
            className={`mailbox-sider ${showMobileDetail ? 'hidden-mobile' : ''}`}
          >
            <div style={{ padding: '16px' }}>
              <Button 
                type="primary" 
                icon={<EditOutlined />} 
                block 
                size="large"
                onClick={() => setIsComposeVisible(true)}
                style={{ marginBottom: '16px', borderRadius: '24px', height: '48px' }}
              >
                Compose
              </Button>
            </div>
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
              // On mobile, this should be visible if detail is NOT visible.
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
                            <div onClick={(e) => handleStar(e, email)}>
                                {email.isStarred ? <StarOutlined style={{ color: '#faad14' }} /> : <StarOutlined style={{ color: '#d9d9d9' }} />}
                            </div>
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
              height: 'calc(100vh - 64px)',
              display: showMobileDetail ? 'block' : undefined // On desktop, it's flexed by Layout. On mobile, we toggle.
            }}
            className={`email-detail-content ${!showMobileDetail ? 'hidden-mobile' : ''}`}
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
                    <Button icon={<StarOutlined />} onClick={(e) => handleStar(e, selectedEmail)}>
                      {selectedEmail.isStarred ? 'Unstar' : 'Star'}
                    </Button>
                    <Button icon={<DeleteOutlined />} danger onClick={(e) => handleDelete(e, selectedEmail)}>Delete</Button>
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
                            <Button size="small" onClick={() => handleDownloadAttachment(selectedEmail.id, attachment.id, attachment.filename)}>Download</Button>
                          </div>
                        ))}
                      </Space>
                    </Card>
                  )}

                  <Card>
                    <div 
                      dangerouslySetInnerHTML={{ __html: selectedEmail.body }}
                      style={{ lineHeight: '1.6', overflowWrap: 'break-word' }}
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
        
        <ComposeModal 
          visible={isComposeVisible} 
          onCancel={handleComposeClose} 
          onSend={handleComposeSend} 
        />
      </Layout>
    </ProtectedRoute>
  );
}
