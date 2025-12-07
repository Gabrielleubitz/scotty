import React, { useState, useEffect } from 'react';
import { BarChart3, TrendingUp, Users, Eye, Clock, Globe, X } from 'lucide-react';
import { Modal } from './ui/Modal';
import { apiService } from '../lib/api';
import { ChangelogPost } from '../types';
import { useTeam } from '../hooks/useTeam';

interface PostAnalyticsModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: ChangelogPost;
}

export const PostAnalyticsModal: React.FC<PostAnalyticsModalProps> = ({
  isOpen,
  onClose,
  post,
}) => {
  const { currentTeam } = useTeam();
  const [analytics, setAnalytics] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && post) {
      loadAnalytics();
    }
  }, [isOpen, post]);

  const loadAnalytics = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await apiService.getPostAnalytics(post.id, currentTeam?.id);
      setAnalytics(data);
    } catch (error) {
      console.error('Failed to load post analytics:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load analytics';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value}%`;
  };

  const getPercentageColor = (value: number) => {
    return value >= 0 ? 'text-green-600' : 'text-red-600';
  };

  if (!analytics && !loading && !error) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Post Analytics" size="xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-2">{post.title}</h3>
          <p className="text-sm text-gray-600">
            Published on {post.createdAt.toLocaleDateString()}
          </p>
        </div>

        {error ? (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">{error}</p>
            {error.includes('not available on your current plan') && (
              <p className="text-sm text-yellow-700 mt-2">
                Upgrade to Pro to access detailed post analytics.
              </p>
            )}
          </div>
        ) : loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : (
          <>
            {/* Key Metrics */}
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-6">
                <h4 className="text-lg font-semibold text-gray-900 flex items-center">
                  <BarChart3 size={20} className="mr-2" />
                  LAST WEEK PERFORMANCE
                </h4>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Views */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">VIEWS</span>
                    <span className={`text-sm font-semibold ${getPercentageColor(analytics.viewsChange)}`}>
                      {formatPercentage(analytics.viewsChange)}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    {analytics.totalViews.toLocaleString()}
                  </div>
                  
                  {/* Mini chart placeholder */}
                  <div className="h-12 bg-gradient-to-r from-blue-100 to-blue-200 rounded relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path
                        d={`M 0,35 ${analytics.last7Days.map((day, i) => 
                          `L ${(i / (analytics.last7Days.length - 1)) * 100},${35 - (day.views / Math.max(...analytics.last7Days.map(d => d.views)) * 25)}`
                        ).join(' ')}`}
                        fill="none"
                        stroke="#3B82F6"
                        strokeWidth="2"
                      />
                      <path
                        d={`M 0,35 ${analytics.last7Days.map((day, i) => 
                          `L ${(i / (analytics.last7Days.length - 1)) * 100},${35 - (day.views / Math.max(...analytics.last7Days.map(d => d.views)) * 25)}`
                        ).join(' ')} L 100,35 Z`}
                        fill="url(#blueGradient)"
                        opacity="0.3"
                      />
                      <defs>
                        <linearGradient id="blueGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#3B82F6" />
                          <stop offset="100%" stopColor="#3B82F6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Unique Views */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">UNIQUE VIEWS</span>
                    <span className={`text-sm font-semibold ${getPercentageColor(analytics.uniqueChange)}`}>
                      {formatPercentage(analytics.uniqueChange)}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    {analytics.uniqueUsers.toLocaleString()}
                  </div>
                  
                  {/* Mini chart placeholder */}
                  <div className="h-12 bg-gradient-to-r from-green-100 to-green-200 rounded relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path
                        d={`M 0,30 ${analytics.last7Days.map((day, i) => 
                          `L ${(i / (analytics.last7Days.length - 1)) * 100},${30 - (day.views * 0.8 / Math.max(...analytics.last7Days.map(d => d.views)) * 20)}`
                        ).join(' ')}`}
                        fill="none"
                        stroke="#10B981"
                        strokeWidth="2"
                      />
                      <path
                        d={`M 0,30 ${analytics.last7Days.map((day, i) => 
                          `L ${(i / (analytics.last7Days.length - 1)) * 100},${30 - (day.views * 0.8 / Math.max(...analytics.last7Days.map(d => d.views)) * 20)}`
                        ).join(' ')} L 100,30 Z`}
                        fill="url(#greenGradient)"
                        opacity="0.3"
                      />
                      <defs>
                        <linearGradient id="greenGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#10B981" />
                          <stop offset="100%" stopColor="#10B981" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>

                {/* Avg Time Spent */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-500 uppercase tracking-wide">AVG TIME</span>
                    <span className="text-sm font-semibold text-blue-600">
                      {analytics.timeChange !== 0 ? formatPercentage(analytics.timeChange) : '—'}
                    </span>
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-4">
                    {Math.round(analytics.avgTimeSpent)}s
                  </div>
                  
                  {/* Mini chart placeholder */}
                  <div className="h-12 bg-gradient-to-r from-purple-100 to-purple-200 rounded relative overflow-hidden">
                    <svg className="w-full h-full" viewBox="0 0 100 40">
                      <path
                        d="M 0,25 L 20,20 L 40,28 L 60,15 L 80,22 L 100,18"
                        fill="none"
                        stroke="#8B5CF6"
                        strokeWidth="2"
                      />
                      <path
                        d="M 0,25 L 20,20 L 40,28 L 60,15 L 80,22 L 100,18 L 100,35 L 0,35 Z"
                        fill="url(#purpleGradient)"
                        opacity="0.3"
                      />
                      <defs>
                        <linearGradient id="purpleGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                          <stop offset="0%" stopColor="#8B5CF6" />
                          <stop offset="100%" stopColor="#8B5CF6" stopOpacity="0" />
                        </linearGradient>
                      </defs>
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Additional Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Top Domains */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <Globe size={20} className="mr-2" />
                  Top Domains
                </h4>
                {analytics.topDomains && analytics.topDomains.length > 0 ? (
                  <div className="space-y-3">
                    {analytics.topDomains.map((domain: any, index: number) => (
                      <div key={domain.domain} className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                            <span className="text-xs font-semibold text-blue-600">
                              {index + 1}
                            </span>
                          </div>
                          <span className="text-sm font-medium text-gray-900">
                            {domain.domain}
                          </span>
                        </div>
                        <span className="text-sm text-gray-500">
                          {domain.views} views
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Globe size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No domain data yet</p>
                    <p className="text-gray-400 text-xs mt-1">Domains will appear when users view this post from embedded widgets</p>
                  </div>
                )}
              </div>

              {/* Daily Breakdown */}
              <div className="bg-white rounded-lg border border-gray-200 p-6">
                <h4 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                  <TrendingUp size={20} className="mr-2" />
                  Daily Views (Last 7 Days)
                </h4>
                {analytics.last7Days && analytics.last7Days.some((day: any) => day.views > 0) ? (
                  <div className="space-y-3">
                    {analytics.last7Days.map((day: any) => (
                      <div key={day.date} className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {new Date(day.date).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric' 
                          })}
                        </span>
                        <div className="flex items-center space-x-3">
                          <div className="w-20 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ 
                                width: `${Math.max(5, (day.views / Math.max(...analytics.last7Days.map((d: any) => d.views))) * 100)}%` 
                              }}
                            ></div>
                          </div>
                          <span className="text-sm font-medium text-gray-900 w-8 text-right">
                            {day.views}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <TrendingUp size={32} className="mx-auto text-gray-300 mb-2" />
                    <p className="text-gray-500 text-sm">No view data yet</p>
                    <p className="text-gray-400 text-xs mt-1">Daily views will appear when users interact with this post</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Modal>
  );
};