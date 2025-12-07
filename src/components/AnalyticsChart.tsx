import React, { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';

interface AnalyticsData {
  date: string;
  views: number;
  uniqueViews?: number;
  engagementRate?: number;
}

interface AnalyticsChartProps {
  data: AnalyticsData[];
  totalUniqueViews: number;
  totalViews: number;
}

interface TooltipData {
  x: number;
  y: number;
  date: string;
  views: number;
  uniqueViews: number;
  visible: boolean;
}

export const AnalyticsChart: React.FC<AnalyticsChartProps> = ({
  data,
  totalUniqueViews,
  totalViews,
}) => {
  const [activeTab, setActiveTab] = useState<'changelog' | 'feedback' | 'nps'>('changelog');
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('week');
  const [tooltip, setTooltip] = useState<TooltipData>({
    x: 0,
    y: 0,
    date: '',
    views: 0,
    uniqueViews: 0,
    visible: false
  });

  // Filter data based on time range
  const getFilteredData = () => {
    const now = new Date();
    let daysToShow = 7; // default for week
    
    switch (timeRange) {
      case 'day':
        daysToShow = 1;
        break;
      case 'week':
        daysToShow = 7;
        break;
      case 'month':
        daysToShow = 30;
        break;
    }
    
    return data.slice(-daysToShow);
  };

  const getSelectedPeriod = () => {
    switch (timeRange) {
      case 'day':
        return 'Today';
      case 'week':
        return 'Last 7 days';
      case 'month':
        return 'Last 30 days';
      default:
        return 'Last 7 days';
    }
  };

  const chartData = getFilteredData();
  
  // Calculate engagement rate (views to unique views ratio)
  const engagementRate = totalViews > 0 ? ((totalUniqueViews / totalViews) * 100).toFixed(2) : '0.00';

  // Chart dimensions
  const chartWidth = 800;
  const chartHeight = 300;
  const padding = { top: 20, right: 40, bottom: 40, left: 60 };
  const innerWidth = chartWidth - padding.left - padding.right;
  const innerHeight = chartHeight - padding.top - padding.bottom;

  const maxViews = Math.max(...chartData.map(d => d.views), 1);
  const maxUniqueViews = Math.max(...chartData.map(d => d.uniqueViews || d.views * 0.7), 1);

  // Generate path for views line
  const generatePath = (dataPoints: number[], maxValue: number) => {
    if (dataPoints.length === 0) return '';
    
    const points = dataPoints.map((value, index) => {
      const x = (index / Math.max(dataPoints.length - 1, 1)) * innerWidth;
      const y = innerHeight - (value / maxValue) * innerHeight;
      return `${x},${y}`;
    });
    
    return `M ${points.join(' L ')}`;
  };

  // Generate area path for filled chart
  const generateAreaPath = (dataPoints: number[], maxValue: number) => {
    if (dataPoints.length === 0) return '';
    
    const points = dataPoints.map((value, index) => {
      const x = (index / Math.max(dataPoints.length - 1, 1)) * innerWidth;
      const y = innerHeight - (value / maxValue) * innerHeight;
      return `${x},${y}`;
    });
    
    const areaPath = `M 0,${innerHeight} L ${points.join(' L ')} L ${innerWidth},${innerHeight} Z`;
    return areaPath;
  };

  const viewsData = chartData.map(d => d.views);
  const uniqueViewsData = chartData.map(d => d.uniqueViews || d.views * 0.7);

  // Handle mouse events for tooltips
  const handleMouseMove = (event: React.MouseEvent<SVGSVGElement>) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const mouseX = event.clientX - rect.left - padding.left;
    const mouseY = event.clientY - rect.top;
    
    if (mouseX >= 0 && mouseX <= innerWidth && mouseY >= padding.top && mouseY <= chartHeight - padding.bottom) {
      // Find closest data point
      const dataIndex = Math.round((mouseX / innerWidth) * (chartData.length - 1));
      
      if (dataIndex >= 0 && dataIndex < chartData.length) {
        const dataPoint = chartData[dataIndex];
        setTooltip({
          x: event.clientX,
          y: event.clientY - 10,
          date: new Date(dataPoint.date).toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric' 
          }),
          views: dataPoint.views,
          uniqueViews: Math.round(dataPoint.uniqueViews || dataPoint.views * 0.7),
          visible: true
        });
      }
    }
  };

  const handleMouseLeave = () => {
    setTooltip(prev => ({ ...prev, visible: false }));
  };

  return (
    <>
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        {/* Header with tabs */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex space-x-1">
            <button
              onClick={() => setActiveTab('changelog')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'changelog'
                  ? 'bg-blue-50 text-blue-600 border border-blue-200'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-50'
              }`}
            >
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>Changelog</span>
            </button>
            <button
              onClick={() => setActiveTab('feedback')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'feedback'
                  ? 'bg-gray-50 text-gray-600 border border-gray-200'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              disabled
            >
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>Feedback</span>
            </button>
            <button
              onClick={() => setActiveTab('nps')}
              className={`flex items-center space-x-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === 'nps'
                  ? 'bg-gray-50 text-gray-600 border border-gray-200'
                  : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
              }`}
              disabled
            >
              <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
              <span>NPS</span>
            </button>
          </div>

          {/* Time range selector */}
          <div className="flex items-center space-x-4">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === 'day'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Day
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === 'week'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Week
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-3 py-1 text-sm font-medium rounded-md transition-colors ${
                  timeRange === 'month'
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Month
              </button>
            </div>
            
            <div className="flex items-center space-x-2 text-sm text-gray-600 bg-gray-50 rounded-lg px-3 py-2">
              <Calendar size={16} />
              <span>{getSelectedPeriod()}</span>
            </div>
          </div>
        </div>

        {/* Metrics */}
        <div className="grid grid-cols-2 gap-8 mb-8">
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {totalUniqueViews.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              <div className="w-3 h-0.5 bg-blue-500 mr-2"></div>
              Unique Views
            </div>
          </div>
          <div>
            <div className="text-3xl font-bold text-gray-900 mb-1">
              {engagementRate}%
            </div>
            <div className="text-sm text-gray-600 flex items-center">
              <div className="w-3 h-0.5 bg-yellow-500 mr-2"></div>
              Engagement Rate
            </div>
          </div>
        </div>

        {/* Chart */}
        <div className="relative">
          <svg 
            width={chartWidth} 
            height={chartHeight} 
            className="overflow-visible"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <defs>
              <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.05" />
              </linearGradient>
              <linearGradient id="yellowGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#EAB308" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#EAB308" stopOpacity="0.05" />
              </linearGradient>
            </defs>
            
            <g transform={`translate(${padding.left}, ${padding.top})`}>
              {/* Grid lines */}
              {[0, 0.25, 0.5, 0.75, 1].map((ratio) => (
                <g key={ratio}>
                  <line
                    x1={0}
                    y1={innerHeight * ratio}
                    x2={innerWidth}
                    y2={innerHeight * ratio}
                    stroke="#F3F4F6"
                    strokeWidth={1}
                  />
                  <text
                    x={-10}
                    y={innerHeight * ratio + 4}
                    textAnchor="end"
                    className="text-xs fill-gray-400"
                  >
                    {Math.round(maxViews * (1 - ratio))}
                  </text>
                </g>
              ))}

              {/* Views area chart */}
              <path
                d={generateAreaPath(viewsData, maxViews)}
                fill="url(#blueGradient)"
              />
              
              {/* Views line */}
              <path
                d={generatePath(viewsData, maxViews)}
                fill="none"
                stroke="#3B82F6"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Engagement rate area (smaller, yellow) */}
              <path
                d={generateAreaPath(uniqueViewsData.map(v => v * 0.1), maxViews)}
                fill="url(#yellowGradient)"
              />
              
              {/* Engagement rate line */}
              <path
                d={generatePath(uniqueViewsData.map(v => v * 0.1), maxViews)}
                fill="none"
                stroke="#EAB308"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points */}
              {viewsData.map((value, index) => {
                const x = (index / Math.max(viewsData.length - 1, 1)) * innerWidth;
                const y = innerHeight - (value / maxViews) * innerHeight;
                return (
                  <circle
                    key={`views-${index}`}
                    cx={x}
                    cy={y}
                    r={4}
                    fill="#3B82F6"
                    stroke="white"
                    strokeWidth={2}
                    className="hover:r-6 transition-all cursor-pointer"
                  />
                );
              })}

              {/* X-axis labels */}
              {chartData.map((item, index) => {
                const x = (index / Math.max(chartData.length - 1, 1)) * innerWidth;
                const date = new Date(item.date);
                const label = date.toLocaleDateString('en-US', { 
                  month: '2-digit', 
                  day: '2-digit' 
                });
                
                return (
                  <text
                    key={`label-${index}`}
                    x={x}
                    y={innerHeight + 20}
                    textAnchor="middle"
                    className="text-xs fill-gray-500"
                  >
                    {label}
                  </text>
                );
              })}
            </g>
          </svg>
        </div>
      </div>

      {/* Tooltip */}
      {tooltip.visible && (
        <div
          className="fixed z-50 bg-gray-900 text-white text-xs rounded-lg px-3 py-2 pointer-events-none shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)'
          }}
        >
          <div className="font-medium">{tooltip.date}</div>
          <div className="flex items-center space-x-2 mt-1">
            <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            <span>Views: {tooltip.views.toLocaleString()}</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
            <span>Unique: {tooltip.uniqueViews.toLocaleString()}</span>
          </div>
        </div>
      )}
    </>
  );
};