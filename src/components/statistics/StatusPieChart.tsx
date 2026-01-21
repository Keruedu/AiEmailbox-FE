'use client';

import React from 'react';
import { Pie } from '@ant-design/charts';
import { EmailStatusStats } from '@/types/statistics';

interface KanbanColumn {
  key: string;
  label: string;
  color?: string;
}

interface StatusPieChartProps {
  data: EmailStatusStats[];
  columns?: KanbanColumn[]; // Optional columns for label mapping
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

export const StatusPieChart: React.FC<StatusPieChartProps> = ({ data, columns, loading }) => {
  // Build a dynamic label map from columns (if provided)
  const columnLabelMap: Record<string, string> = {};
  const columnColorMap: Record<string, string> = {};

  if (columns) {
    columns.forEach(col => {
      columnLabelMap[col.key] = col.label;
      if (col.color) {
        columnColorMap[col.key] = col.color;
      }
    });
  }

  const chartData = data.map(item => ({
    // Prioritize: columns prop → STATUS_LABELS → raw status
    type: columnLabelMap[item.status] || STATUS_LABELS[item.status] || item.status,
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
    // Use column color if available, else STATUS_COLORS, else default blue
    color: (datum: { type: string; status: string }) =>
      columnColorMap[datum.status] || STATUS_COLORS[datum.status] || '#1890ff',
  };

  return <Pie {...config} />;
};

export default StatusPieChart;

