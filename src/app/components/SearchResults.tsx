import React from 'react';
import { List, Card, Typography, Space, Button, Empty } from 'antd';
import { StarOutlined, PaperClipOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { Email } from '@/types/email';

const { Text, Title } = Typography;

interface SearchResultsProps {
  results: Email[];
  loading: boolean;
  onSelect: (email: Email) => void;
  onClose: () => void;
  searchQuery: string;
  onLoadMore: () => void;
  loadingMore: boolean;
  hasMore: boolean;
  totalEstimate?: number;
}

const SearchResults: React.FC<SearchResultsProps> = ({ 
  results, 
  loading, 
  onSelect, 
  onClose,
  searchQuery,
  onLoadMore,
  loadingMore,
  hasMore,
  totalEstimate
}) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const safeResults = results || [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', background: '#fff' }}>
      <div style={{ padding: '16px', borderBottom: '1px solid #f0f0f0', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Space>
           <Button icon={<ArrowLeftOutlined />} onClick={onClose}>Back</Button>
           <Title level={5} style={{ margin: 0 }}>
             Search results for &quot;{searchQuery}&quot;
           </Title>
        </Space>
        {totalEstimate !== undefined ? (
             <Text type="secondary">Showing {safeResults.length}/{totalEstimate}</Text>
        ) : (
             <Text type="secondary">{safeResults.length} found</Text>
        )}
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '16px' }}>
        {loading && safeResults.length === 0 ? (
           <div style={{ textAlign: 'center', padding: '40px' }}>Loading...</div>
        ) : safeResults.length === 0 ? (
           <Empty description="No emails found matching your query" />
        ) : (
          <>
          <List
            dataSource={safeResults}
            renderItem={(email) => {
              // Highlight helper
              const HighlightText = ({ text, highlight }: { text: string, highlight: string }) => {
                if (!highlight.trim()) {
                  return <span>{text}</span>;
                }
                
                // Create fuzzy regex for Vietnamese and simple typos
                const createFuzzyRegex = (query: string) => {
                    const charMap: Record<string, string> = {
                        'a': '[aàáạảãâầấậẩẫăằắặẳẵ]',
                        'e': '[eèéẹẻẽêềếệểễ]',
                        'i': '[iìíịỉĩ]',
                        'o': '[oòóọỏõôồốộổỗơờớợởỡ]',
                        'u': '[uùúụủũưừứựửữ]',
                        'y': '[yỳýỵỷỹ]',
                        'd': '[dđ]',
                    };
                    return query.toLowerCase().split('').map(char => charMap[char] || char).join('');
                };

                const fuzzyPattern = createFuzzyRegex(highlight);
                const regex = new RegExp(`(${fuzzyPattern})`, 'gi');
                const parts = text.split(regex);
                
                return (
                  <span>
                    {parts.map((part, i) => 
                      regex.test(part) ? (
                        <span key={i} style={{ backgroundColor: '#ffbf00', fontWeight: 'bold' }}>{part}</span>
                      ) : (
                        <span key={i}>{part}</span>
                      )
                    )}
                  </span>
                );
              };

              return (
              <Card
                hoverable
                style={{ marginBottom: '8px', cursor: 'pointer' }}
                onClick={() => onSelect(email)}
                size="small"
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                  <Space>
                    <Text strong>
                        <HighlightText text={email.from.name || email.from.email} highlight={searchQuery} />
                    </Text>
                    {email.isStarred && <StarOutlined style={{ color: '#faad14' }} />}
                    {email.hasAttachments && <PaperClipOutlined />}
                  </Space>
                  <Text type="secondary" style={{ fontSize: '12px' }}>{formatDate(email.receivedAt)}</Text>
                </div>
                <Text strong style={{ fontSize: '14px', display: 'block' }}>
                    <HighlightText text={email.subject} highlight={searchQuery} />
                </Text>
                <Text type="secondary" ellipsis>
                    <HighlightText text={email.preview || email.summary || ''} highlight={searchQuery} />
                </Text>
              </Card>
              );
            }}
          />
          {hasMore && (
            <div style={{ textAlign: 'center', marginTop: '16px', paddingBottom: '20px' }}>
                <Button onClick={onLoadMore} loading={loadingMore}>Load More</Button>
            </div>
          )}
          </>
        )}
      </div>
    </div>
  );
};

export default SearchResults;
