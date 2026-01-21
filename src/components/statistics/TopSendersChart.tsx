'use client';

import React from 'react';
import { Bar } from '@ant-design/charts';
import { TopSender } from '@/types/statistics';

interface TopSendersChartProps {
  data: TopSender[];
  loading?: boolean;
}

export const TopSendersChart: React.FC<TopSendersChartProps> = ({ data, loading }) => {
  // Truncate long names and prepare data
  const chartData = data.map(item => {
    const displayName = item.name || item.email;
    // Truncate name if too long
    const truncatedName = displayName.length > 20
      ? displayName.substring(0, 17) + '...'
      : displayName;
    return {
      name: truncatedName,
      fullName: displayName,
      email: item.email,
      count: item.count,
    };
  });

  const config = {
    data: chartData,
    xField: 'count',
    yField: 'name',
    loading,
    legend: false,
    color: '#1890ff',
    barStyle: {
      radius: [4, 4, 4, 4],
    },
    label: {
      text: 'count',
      position: 'right' as const,
      style: {
        fill: '#595959',
        fontSize: 11,
      },
    },
    axis: {
      y: {
        labelFormatter: (text: string) => text,
        style: {
          labelFontSize: 11,
        },
      },
      x: {
        title: 'Emails',
      },
    },
    tooltip: {
      title: 'fullName',
      items: [
        { field: 'email', name: 'Email' },
        { field: 'count', name: 'Emails' },
      ],
    },
  };

  return <Bar {...config} />;
};

export default TopSendersChart;
