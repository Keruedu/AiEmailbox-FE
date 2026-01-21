'use client';

import React, { useState, useEffect } from 'react';
import { Card, Row, Col, Statistic, Segmented, Spin, Typography, Space, Alert, Button, Avatar, Dropdown } from 'antd';
import { MailOutlined, EyeOutlined, StarOutlined, PieChartOutlined, ArrowLeftOutlined, LogoutOutlined, InboxOutlined } from '@ant-design/icons';
import { StatusPieChart, EmailTrendChart, TopSendersChart, ActivityHeatmap } from '@/components/statistics';
import { statisticsService } from '@/services/statisticsService';
import { kanbanService, KanbanColumn } from '@/services/kanbanService';
import { StatisticsResponse } from '@/types/statistics';
import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';

const { Title, Text } = Typography;

type Period = '7d' | '30d' | '90d';

function StatisticsContent() {
  const { user, logout } = useAuth();
  const [period, setPeriod] = useState<Period>('30d');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<StatisticsResponse | null>(null);
  const [columns, setColumns] = useState<KanbanColumn[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch statistics and columns in parallel
        const [statsResponse, columnsResponse] = await Promise.all([
          statisticsService.getStatistics(period),
          kanbanService.getColumns(),
        ]);

        setData(statsResponse);
        setColumns(columnsResponse);
      } catch (err) {
        setError('Failed to load statistics. Please try again.');
        console.error('Error fetching statistics:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [period]);

  const handlePeriodChange = (value: string | number) => {
    setPeriod(value as Period);
  };

  const handleBack = () => {
    window.location.href = '/inbox';
  };

  if (error) {
    return (
      <div style={{ padding: 24 }}>
        <Alert
          message="Error"
          description={error}
          type="error"
          showIcon
          action={
            <a onClick={() => window.location.reload()}>Retry</a>
          }
        />
      </div>
    );
  }

  return (
    <div style={{ padding: 24, background: '#f5f5f5', minHeight: '100vh' }}>
      {/* Back Button */}
      <Button
        icon={<ArrowLeftOutlined />}
        onClick={handleBack}
        type="link"
        style={{
          padding: 0,
          marginBottom: 8,
          color: '#667eea',
          fontWeight: 500,
        }}
      >
        Back to Inbox
      </Button>

      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        flexWrap: 'wrap',
        gap: 16
      }}>
        <Title level={2} style={{ margin: 0 }}>
          <PieChartOutlined style={{ marginRight: 12, color: '#667eea' }} />
          Email Statistics
        </Title>
        <Space>
          <Segmented
            options={[
              { label: 'Last 7 Days', value: '7d' },
              { label: 'Last 30 Days', value: '30d' },
              { label: 'Last 90 Days', value: '90d' },
            ]}
            value={period}
            onChange={handlePeriodChange}
          />
          <Dropdown
            menu={{
              items: [
                {
                  key: 'user-info',
                  label: (
                    <div style={{ padding: '8px 0' }}>
                      <Text strong>{user?.name || 'User'}</Text>
                      <br />
                      <Text type="secondary" style={{ fontSize: '12px' }}>{user?.email}</Text>
                    </div>
                  ),
                  disabled: true,
                },
                { type: 'divider' },
                {
                  key: 'inbox',
                  icon: <InboxOutlined />,
                  label: 'Go to Inbox',
                  onClick: () => window.location.href = '/inbox',
                },
                { type: 'divider' },
                {
                  key: 'logout',
                  icon: <LogoutOutlined />,
                  label: 'Logout',
                  danger: true,
                  onClick: logout,
                },
              ],
            }}
            trigger={['click']}
            placement="bottomRight"
          >
            <Avatar
              style={{ backgroundColor: '#667eea', cursor: 'pointer' }}
              size="default"
            >
              {user?.name?.charAt(0)?.toUpperCase() || user?.email?.charAt(0)?.toUpperCase() || 'U'}
            </Avatar>
          </Dropdown>
        </Space>
      </div>

      {/* Summary Cards */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Total Emails"
              value={data?.totalEmails ?? 0}
              prefix={<MailOutlined />}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Unread Emails"
              value={data?.unreadCount ?? 0}
              prefix={<EyeOutlined />}
              valueStyle={{ color: data?.unreadCount && data.unreadCount > 0 ? '#faad14' : undefined }}
              loading={loading}
            />
          </Card>
        </Col>
        <Col xs={24} sm={8}>
          <Card hoverable>
            <Statistic
              title="Starred Emails"
              value={data?.starredCount ?? 0}
              prefix={<StarOutlined />}
              valueStyle={{ color: '#faad14' }}
              loading={loading}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts Row 1 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={24} lg={12}>
          <Card
            title="Email Status Distribution"
            style={{ height: '100%' }}
          >
            <div style={{ height: 300 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <StatusPieChart data={data?.statusStats ?? []} columns={columns} />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Email Volume Trend"
            style={{ height: '100%' }}
          >
            <div style={{ height: 300 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <EmailTrendChart data={data?.emailTrend ?? []} />
              )}
            </div>
          </Card>
        </Col>
      </Row>

      {/* Charts Row 2 */}
      <Row gutter={[16, 16]}>
        <Col xs={24} lg={12}>
          <Card
            title="Top Email Senders"
            style={{ height: '100%' }}
          >
            <div style={{ height: 350 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <TopSendersChart data={data?.topSenders ?? []} />
              )}
            </div>
          </Card>
        </Col>
        <Col xs={24} lg={12}>
          <Card
            title="Email Activity Heatmap"
            extra={<Space><span style={{ fontSize: 12, color: '#8c8c8c' }}>By day and hour</span></Space>}
            style={{ height: '100%' }}
          >
            <div style={{ height: 350 }}>
              {loading ? (
                <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                  <Spin size="large" />
                </div>
              ) : (
                <ActivityHeatmap data={data?.dailyActivity ?? []} />
              )}
            </div>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

export default function StatisticsPage() {
  return (
    <ProtectedRoute>
      <StatisticsContent />
    </ProtectedRoute>
  );
}
