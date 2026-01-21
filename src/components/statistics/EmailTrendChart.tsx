'use client';

import React from 'react';
import { Area } from '@ant-design/charts';
import { EmailTrendPoint } from '@/types/statistics';

interface EmailTrendChartProps {
  data: EmailTrendPoint[];
  loading?: boolean;
}

export const EmailTrendChart: React.FC<EmailTrendChartProps> = ({ data, loading }) => {
  const config = {
    data,
    xField: 'date',
    yField: 'count',
    loading,
    smooth: true,
    areaStyle: {
      fill: 'l(270) 0:#ffffff 0.5:#7ec2f3 1:#1890ff',
    },
    line: {
      style: {
        stroke: '#1890ff',
        lineWidth: 2,
      },
    },
    point: {
      size: 3,
      shape: 'circle',
      style: {
        fill: '#1890ff',
        stroke: '#fff',
        lineWidth: 1,
      },
    },
    xAxis: {
      label: {
        formatter: (text: string) => {
          const date = new Date(text);
          return `${date.getMonth() + 1}/${date.getDate()}`;
        },
      },
    },
    yAxis: {
      label: {
        formatter: (v: string) => `${v}`,
      },
    },
    tooltip: {
      title: 'date',
      formatter: (datum: EmailTrendPoint) => ({
        name: 'Emails',
        value: datum.count,
      }),
    },
  };

  return <Area {...config} />;
};

export default EmailTrendChart;
