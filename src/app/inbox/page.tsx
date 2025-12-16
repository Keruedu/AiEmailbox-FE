'use client';

import { useState, useEffect } from 'react';
import { Layout, Menu, List, Card, Button, Badge, Typography, Space, Avatar, Spin, message, Empty, Modal } from 'antd';
import EmailDetail from '@/app/components/EmailDetail';
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
  AppstoreOutlined,
  BarsOutlined,
} from '@ant-design/icons';
import KanbanBoard from '@/app/components/Kanban/KanbanBoard';
import SearchResults from '@/app/components/SearchResults';
import SearchInput from '@/app/components/SearchInput';
import { useAuth } from '@/contexts/AuthContext';
import { emailService } from '@/services/email';
import apiClient from '@/services/api';
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
  const [viewMode, setViewMode] = useState<'list' | 'kanban'>('list');

  // Search state
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Email[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchLoading, setSearchLoading] = useState(false);
  const [nextPageToken, setNextPageToken] = useState<string>('');
  const [loadingMore, setLoadingMore] = useState(false);
  const [totalEstimate, setTotalEstimate] = useState<number>(0);

  useEffect(() => {
    const savedView = localStorage.getItem('viewMode');
    if (savedView === 'list' || savedView === 'kanban') {
      setViewMode(savedView);
    }
  }, []);

  const handleViewToggle = (mode: 'list' | 'kanban') => {
    setViewMode(mode);
    localStorage.setItem('viewMode', mode);
  };

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

    if (!email.isRead) {
        // Optimistic update
        setEmails(prev => prev.map(e => e.id === email.id ? { ...e, isRead: true } : e));
        
        // Mark as read in backend
        emailService.markAsRead(email.id).catch(err => {
            console.error('Failed to mark as read', err);
        });
    }
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
      console.error('Star error:', error);
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
      console.error('Delete error:', error);
      message.error('Failed to delete email');
    }
  };

  const handleDownloadAttachment = async (emailId: string, attachmentId: string, filename: string) => {
    try {
      // Use apiClient to leverage automatic auth header and token refresh mechanisms
      // The URL returned by service includes the full path, but apiClient uses baseURL.
      // We need to parse relative path or check if apiClient handles absolute URLs (it usually does if valid).
      // However, emailService.getAttachmentUrl returns full URL from env. 
      // Let's rely on apiClient handling absolute URL override or extract path.
      // Easiest is to reconstruct relative path manually or just pass full URL if axios supports it (it does).
      
      const url = emailService.getAttachmentUrl(emailId, attachmentId);
      
      // Axios request with blob response type
      /* eslint-disable @typescript-eslint/no-explicit-any */
      const response = await apiClient.get(url, { 
        responseType: 'blob'
      });
      
      const blob = new Blob([response.data]);
      const downloadUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = downloadUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(downloadUrl);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Download error:', error);
      message.error('Failed to download attachment');
    }
  };

  const handleKanbanModalClose = () => {
    setSelectedEmail(null);
  };
  
  const handleKanbanCardClick = async (cardId: string) => {
    try {
       // Mark as read in backend
       emailService.markAsRead(cardId); // Fire and forget or await? Await to ensure standard behavior
       
       // Fetch full email details because Kanban card is partial
       const fullEmail = await emailService.getEmailDetail(cardId);
       setSelectedEmail(fullEmail);
       // Modal will open because selectedEmail is set
    } catch (error) {
       message.error('Failed to load email details');
       console.error(error);
    }
  };

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setIsSearching(false);
      setSearchResults([]);
      setNextPageToken('');
      setTotalEstimate(0);
      return;
    }
    
    setIsSearching(true);
    setSearchLoading(true);
    setSearchResults([]); 
    setNextPageToken('');
    setTotalEstimate(0);

    try {
      const result = await emailService.searchEmails(query);
      setSearchResults(result.emails || []);
      setNextPageToken(result.nextPageToken);
      setTotalEstimate(result.totalEstimate);
    } catch (error) {
       console.error('Search failed:', error);
       message.error('Search failed');
    } finally {
       setSearchLoading(false);
    }
  };

  const handleLoadMoreSearch = async () => {
    if (!nextPageToken || loadingMore) return;
    
    setLoadingMore(true);
    try {
        const result = await emailService.searchEmails(searchQuery, nextPageToken);
        setSearchResults(prev => [...prev, ...(result.emails || [])]);
        setNextPageToken(result.nextPageToken);
        // Helper: Ensure estimate is consistent or use the one from first request?
        // Usually pagination doesn't change estimate much, but good to update if backend sends it.
        setTotalEstimate(result.totalEstimate); 
    } catch (error) {
        console.error('Load more failed:', error);
        message.error('Failed to load more results');
    } finally {
        setLoadingMore(false);
    }
  };

  const handleClearSearch = () => {
    setIsSearching(false);
    setSearchQuery('');
    setSearchResults([]);
    setTotalEstimate(0);
  };

  return (
    <ProtectedRoute>
      <Layout style={{ height: '100vh', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <Header className="inbox-header" style={{ 
          background: '#fff', 
          padding: '12px 16px', // Increased padding for 2 rows
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          zIndex: 1,
          height: 'auto',
          minHeight: '64px',
          flexWrap: 'wrap',
          gap: '12px', // Add gap for wrapping
          flexShrink: 0
        }}>
          <div className="header-title" style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <MailOutlined style={{ fontSize: '24px', color: '#667eea' }} />
            <Title level={4} style={{ margin: 0, whiteSpace: 'nowrap' }}>AI Email Box</Title>
          </div>

          {/* Search Bar - will order change on mobile via CSS */}
          {/* Search Bar */}
          <SearchInput onSearch={handleSearch} defaultValue={searchQuery} />

          <div className="header-actions">
            <Space>
              <Text className="header-user-email" style={{ maxWidth: '150px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {user?.name || user?.email}
              </Text>
              
              <div className="flex bg-gray-100 p-1 rounded-lg mr-2">
                 <button 
                    onClick={() => handleViewToggle('list')}
                    className={`px-3 py-1 rounded-md text-sm font-medium border-0 cursor-pointer transition-all flex items-center ${viewMode === 'list' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                    <BarsOutlined className="mr-1" />
                    <span className="view-mode-text">List</span>
                 </button>
                 <button 
                    onClick={() => handleViewToggle('kanban')}
                    className={`px-3 py-1 rounded-md text-sm font-medium border-0 cursor-pointer transition-all flex items-center ${viewMode === 'kanban' ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-500 hover:text-gray-700'}`}
                 >
                    <AppstoreOutlined className="mr-1" />
                    <span className="view-mode-text">Kanban</span>
                 </button>
              </div>

              <Button icon={<LogoutOutlined />} onClick={handleLogout}>
                <span className="logout-text">Logout</span>
              </Button>
            </Space>
          </div>
        </Header>

        {isSearching ? (
          <Content style={{ flex: 1, overflow: 'hidden' }}>
            <SearchResults 
               results={searchResults} 
               loading={searchLoading} 
               onSelect={handleEmailSelect} 
               onClose={handleClearSearch}
               searchQuery={searchQuery}
               onLoadMore={handleLoadMoreSearch}
               loadingMore={loadingMore}
               hasMore={!!nextPageToken}
               totalEstimate={totalEstimate}
            />
            {/* Reusing the Modal for details if an item is clicked from search results */}
             <Modal
                title={null}
                footer={null}
                open={!!selectedEmail}
                onCancel={() => setSelectedEmail(null)} // Close detail only
                width={1000} 
                centered
                destroyOnClose
                styles={{ body: { padding: 0, height: '80vh', overflow: 'hidden' } }}
             >
                <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {selectedEmail && (
                   <EmailDetail 
                       email={selectedEmail} 
                       onBack={() => setSelectedEmail(null)}
                       onStar={handleStar}
                       onDelete={(e, email) => {
                           handleDelete(e, email);
                           setSelectedEmail(null);
                           // Update search results? Ideally yes, but tricky without re-search
                           setSearchResults(prev => prev.filter(p => p.id !== email.id));
                       }}
                       onDownloadAttachment={handleDownloadAttachment}
                       showMobileDetail={false} 
                   />
                )}
                </div>
             </Modal>
          </Content>
        ) : viewMode === 'kanban' ? (
          <Content style={{ flex: 1, overflow: 'hidden', background: '#fff' }}>
             <KanbanBoard onCardClick={handleKanbanCardClick} />
             
             {/* Modal for Kanban Detail View */}
             <Modal
                title={null}
                footer={null}
                open={!!selectedEmail}
                onCancel={handleKanbanModalClose}
                width={1000} // Wide modal to mimic list view detail
                centered
                destroyOnClose
                styles={{ body: { padding: 0, height: '80vh', overflow: 'hidden' } }}
             >
                <div className="h-full overflow-y-auto [&::-webkit-scrollbar]:hidden" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {selectedEmail && (
                   <EmailDetail 
                       email={selectedEmail} 
                       onBack={handleKanbanModalClose} // "Back" button also acts as close
                       onStar={handleStar}
                       onDelete={(e, email) => {
                           handleDelete(e, email);
                           handleKanbanModalClose(); // Close modal on delete
                       }}
                       onDownloadAttachment={handleDownloadAttachment}
                       showMobileDetail={false} 
                   />
                )}
                </div>
             </Modal>
          </Content>
        ) : (
        <Layout className="main-layout" style={{ flex: 1, overflow: 'hidden' }}>
          {/* Left Sidebar - Mailboxes */}
          <Sider 
            width={250} 
            theme="light" 
            style={{ 
              borderRight: '1px solid #f0f0f0',
              overflowY: 'auto', // Enable vertical scrolling
              height: '100%',
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
              flexDirection: 'column',
              height: '100%',
              overflow: 'hidden'
            }}
            className="email-list-layout"
          >
            <div style={{ 
              padding: '16px', 
              background: '#fff', 
              borderBottom: '1px solid #f0f0f0',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              flexShrink: 0
            }}>
              <Title level={5} style={{ margin: 0 }}>
                {mailboxes.find(m => m.id === selectedMailbox)?.name || 'Emails'}
              </Title>
              <Button icon={<ReloadOutlined />} onClick={handleRefresh} loading={emailsLoading}>
                Refresh
              </Button>
            </div>
            
            <Content style={{ padding: '8px', overflowY: 'auto', flex: 1 }}>
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
                            {!email.isRead && (
                               <div className="w-2 h-2 rounded-full bg-blue-600" style={{ marginRight: -4 }} />
                            )}
                            <Text strong={!email.isRead} style={{ fontSize: '14px', color: !email.isRead ? '#262626' : '#595959' }}>
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
              overflowY: 'auto',
              height: '100%',
              display: showMobileDetail ? 'block' : undefined, 
              scrollbarWidth: 'none',
              msOverflowStyle: 'none',
              flex: 1
            }}
            className={`email-detail-content ${!showMobileDetail ? 'hidden-mobile' : ''} [&::-webkit-scrollbar]:hidden`}
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
        )}
        
        <ComposeModal 
          visible={isComposeVisible} 
          onCancel={handleComposeClose} 
          onSend={handleComposeSend} 
        />
      </Layout>
    </ProtectedRoute>
  );
}
