'use client';

import React from 'react';
import { Heatmap } from '@ant-design/charts';
import { DailyActivity } from '@/types/statistics';
import { Empty } from 'antd';

interface ActivityHeatmapProps {
  data: DailyActivity[];
  loading?: boolean;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const ActivityHeatmap: React.FC<ActivityHeatmapProps> = ({ data, loading }) => {
  // Handle empty data
  if (!data || data.length === 0) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Empty description="No activity data available" />
      </div>
    );
  }

  // Transform data for heatmap
  const chartData = data.map(item => ({
    day: DAYS[item.dayOfWeek] || 'Unknown',
    hour: `${item.hour.toString().padStart(2, '0')}:00`,
    count: item.count,
  }));

  // Calculate max count safely
  const maxCount = Math.max(...data.map(d => d.count), 1);

  const config = {
    data: chartData,
    xField: 'hour',
    yField: 'day',
    colorField: 'count',
    loading,
    color: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
    mark: 'cell',
    style: {
      inset: 1,
      radius: 2,
    },
    scale: {
      color: {
        type: 'linear' as const,
        range: ['#ebedf0', '#9be9a8', '#40c463', '#30a14e', '#216e39'],
      },
    },
    axis: {
      x: {
        title: 'Hour of Day',
        tickFilter: (_: unknown, index: number) => index % 3 === 0, // Show every 3rd hour
        style: {
          labelFontSize: 10,
        },
      },
      y: {
        title: false,
        style: {
          labelFontSize: 11,
        },
      },
    },
    tooltip: {
      title: (d: { day: string; hour: string }) => `${d.day} at ${d.hour}`,
      items: [
        { field: 'count', name: 'Emails' },
      ],
    },
    legend: {
      color: {
        title: 'Emails',
        position: 'bottom' as const,
        length: 200,
      },
    },
  };

  return <Heatmap {...config} />;
};

export default ActivityHeatmap;
