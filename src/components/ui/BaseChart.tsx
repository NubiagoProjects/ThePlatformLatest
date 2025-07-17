'use client';

import React from 'react';
import { BaseCard } from './BaseCard';

interface ChartData {
  label: string;
  value: number;
  color?: string;
}

interface BaseChartProps {
  title?: string;
  data: ChartData[];
  type: 'bar' | 'line' | 'pie' | 'doughnut';
  height?: number;
  className?: string;
}

export const BaseChart: React.FC<BaseChartProps> = ({
  title,
  data,
  type,
  height = 300,
  className = '',
}) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const total = data.reduce((sum, d) => sum + d.value, 0);

  const renderBarChart = () => (
    <div className="flex items-end justify-between h-full gap-2">
      {data.map((item, index) => (
        <div key={index} className="flex-1 flex flex-col items-center">
          <div
            className="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600"
            style={{
              height: `${(item.value / maxValue) * 100}%`,
              backgroundColor: item.color || '#3B82F6',
            }}
          />
          <span className="text-xs text-gray-600 mt-2 text-center">{item.label}</span>
        </div>
      ))}
    </div>
  );

  const renderLineChart = () => (
    <svg className="w-full h-full" viewBox={`0 0 100 100`}>
      <polyline
        fill="none"
        stroke="#3B82F6"
        strokeWidth="2"
        points={data.map((item, index) => {
          const x = (index / (data.length - 1)) * 80 + 10;
          const y = 90 - ((item.value / maxValue) * 70 + 10);
          return `${x},${y}`;
        }).join(' ')}
      />
      {data.map((item, index) => {
        const x = (index / (data.length - 1)) * 80 + 10;
        const y = 90 - ((item.value / maxValue) * 70 + 10);
        return (
          <circle
            key={index}
            cx={x}
            cy={y}
            r="2"
            fill="#3B82F6"
          />
        );
      })}
    </svg>
  );

  const renderPieChart = () => {
    let currentAngle = 0;
    const radius = 40;
    const centerX = 50;
    const centerY = 50;

    return (
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
          const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
          const x2 = centerX + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
          const y2 = centerY + radius * Math.sin((currentAngle - 90) * Math.PI / 180);

          const largeArcFlag = angle > 180 ? 1 : 0;

          const pathData = [
            `M ${centerX} ${centerY}`,
            `L ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            'Z'
          ].join(' ');

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    );
  };

  const renderDoughnutChart = () => {
    let currentAngle = 0;
    const radius = 35;
    const innerRadius = 20;
    const centerX = 50;
    const centerY = 50;

    return (
      <svg className="w-full h-full" viewBox="0 0 100 100">
        {data.map((item, index) => {
          const percentage = item.value / total;
          const angle = percentage * 360;
          const startAngle = currentAngle;
          currentAngle += angle;

          const x1 = centerX + radius * Math.cos((startAngle - 90) * Math.PI / 180);
          const y1 = centerY + radius * Math.sin((startAngle - 90) * Math.PI / 180);
          const x2 = centerX + radius * Math.cos((currentAngle - 90) * Math.PI / 180);
          const y2 = centerY + radius * Math.sin((currentAngle - 90) * Math.PI / 180);

          const innerX1 = centerX + innerRadius * Math.cos((startAngle - 90) * Math.PI / 180);
          const innerY1 = centerY + innerRadius * Math.sin((startAngle - 90) * Math.PI / 180);
          const innerX2 = centerX + innerRadius * Math.cos((currentAngle - 90) * Math.PI / 180);
          const innerY2 = centerY + innerRadius * Math.sin((currentAngle - 90) * Math.PI / 180);

          const largeArcFlag = angle > 180 ? 1 : 0;

          const pathData = [
            `M ${x1} ${y1}`,
            `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
            `L ${innerX2} ${innerY2}`,
            `A ${innerRadius} ${innerRadius} 0 ${largeArcFlag} 0 ${innerX1} ${innerY1}`,
            'Z'
          ].join(' ');

          return (
            <path
              key={index}
              d={pathData}
              fill={item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)`}
              stroke="white"
              strokeWidth="1"
            />
          );
        })}
      </svg>
    );
  };

  const renderChart = () => {
    switch (type) {
      case 'bar':
        return renderBarChart();
      case 'line':
        return renderLineChart();
      case 'pie':
        return renderPieChart();
      case 'doughnut':
        return renderDoughnutChart();
      default:
        return null;
    }
  };

  return (
    <BaseCard className={`p-6 ${className}`}>
      {title && (
        <h3 className="text-lg font-semibold text-gray-900 mb-4">{title}</h3>
      )}
      
      <div style={{ height }} className="relative">
        {renderChart()}
      </div>

      {/* Legend */}
      {(type === 'pie' || type === 'doughnut') && (
        <div className="mt-4 flex flex-wrap gap-4">
          {data.map((item, index) => (
            <div key={index} className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: item.color || `hsl(${(index * 360) / data.length}, 70%, 60%)` }}
              />
              <span className="text-sm text-gray-600">{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </BaseCard>
  );
}; 