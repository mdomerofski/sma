import React from 'react';
import { useQuery } from 'react-query';
import {
  DocumentTextIcon,
  CheckCircleIcon,
  CalendarIcon,
  ChartBarIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { AnalyticsOverview } from '../types';

const Dashboard: React.FC = () => {
  const { data: analytics, isLoading } = useQuery<AnalyticsOverview>(
    'analytics-overview',
    () => api.get('/analytics/overview').then((res) => res.data)
  );

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="card p-5">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  const stats = [
    {
      name: 'Content Sources',
      value: analytics?.overview.contentSources.active || 0,
      total: analytics?.overview.contentSources.total || 0,
      icon: DocumentTextIcon,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
    },
    {
      name: 'Unprocessed Content',
      value: analytics?.overview.discoveredContent.unprocessed || 0,
      total: analytics?.overview.discoveredContent.total || 0,
      icon: CheckCircleIcon,
      color: 'text-yellow-600',
      bgColor: 'bg-yellow-50',
    },
    {
      name: 'Pending Posts',
      value: analytics?.overview.generatedPosts.pending || 0,
      total: analytics?.overview.generatedPosts.total || 0,
      icon: CalendarIcon,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
    },
    {
      name: 'Published Posts',
      value: analytics?.overview.generatedPosts.published || 0,
      total: analytics?.overview.generatedPosts.total || 0,
      icon: ChartBarIcon,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
    },
  ];

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        <p className="mt-1 text-sm text-gray-500">
          Overview of your social media automation platform
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.name} className="card p-5">
            <div className="flex items-center">
              <div className={`flex-shrink-0 p-3 rounded-lg ${stat.bgColor}`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
              <div className="ml-4">
                <p className="text-sm font-medium text-gray-500">{stat.name}</p>
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                  {stat.total > 0 && (
                    <span className="text-sm text-gray-500 font-normal">
                      /{stat.total}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {analytics?.recentActivity && analytics.recentActivity.length > 0 && (
        <div className="card">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-medium text-gray-900">Recent Activity</h3>
          </div>
          <div className="divide-y divide-gray-200">
            {analytics.recentActivity.map((post) => (
              <div key={post.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="flex-shrink-0">
                      <div className="h-8 w-8 bg-primary-100 rounded-full flex items-center justify-center">
                        <span className="text-xs font-medium text-primary-800">
                          {post.socialAccount.platform.slice(0, 2)}
                        </span>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">
                        {post.discoveredContent.title}
                      </p>
                      <p className="text-sm text-gray-500">
                        {post.socialAccount.platform} • {post.socialAccount.accountName}
                      </p>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        post.status === 'PUBLISHED'
                          ? 'bg-green-100 text-green-800'
                          : post.status === 'PENDING_APPROVAL'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {post.status.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>
                </div>
                <div className="mt-2">
                  <p className="text-sm text-gray-600 truncate">{post.content}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;