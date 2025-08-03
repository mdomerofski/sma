import React from 'react';
import { useQuery } from 'react-query';
import { ChartBarIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const Analytics: React.FC = () => {
  const { data: analytics, isLoading } = useQuery(
    'post-analytics',
    () => api.get('/analytics/posts').then((res) => res.data)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500">
          Track your social media performance
        </p>
      </div>

      <div className="text-center py-12">
        <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Analytics Dashboard Coming Soon
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          Detailed analytics and performance metrics are currently under development.
        </p>
      </div>
    </div>
  );
};

export default Analytics;