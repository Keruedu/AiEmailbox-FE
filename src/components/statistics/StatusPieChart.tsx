'use client';

import React from 'react';
import { Pie } from '@ant-design/charts';
import { EmailStatusStats } from '@/types/statistics';

interface StatusPieChartProps {
  data: EmailStatusStats[];
  loading?: boolean;
}

const STATUS_COLORS: Record<string, string> = {
  inbox: '#1890ff',
  todo: '#faad14',
  in_progress: '#722ed1',
  done: '#52c41a',
  snoozed: '#8c8c8c',
};

const STATUS_LABELS: Record<string, string> = {
  inbox: 'Inbox',
  todo: 'To Do',
  in_progress: 'In Progress',
  done: 'Done',
  snoozed: 'Snoozed',
};

export const StatusPieChart: React.FC<StatusPieChartProps> = ({ data, loading }) => {
  const chartData = data.map(item => ({
    type: STATUS_LABELS[item.status] || item.status,
    value: item.count,
    status: item.status,
  }));

  const config = {
    data: chartData,
    angleField: 'value',
    colorField: 'type',
    radius: 0.8,
    innerRadius: 0.6,
    loading,
    label: {
      text: 'value',
      style: {
        fontWeight: 'bold',
      },
    },
    legend: {
      color: {
        title: false,
        position: 'right' as const,
        rowPadding: 5,
      },
    },
    tooltip: {
      title: 'type',
    },
    color: (datum: { type: string; status: string }) => STATUS_COLORS[datum.status] || '#1890ff',
  };

  return <Pie {...config} />;
};

export default StatusPieChart;
