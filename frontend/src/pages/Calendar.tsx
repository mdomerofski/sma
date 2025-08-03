import React from 'react';
import { useQuery } from 'react-query';
import { CalendarIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';

const Calendar: React.FC = () => {
  const { data: posts, isLoading } = useQuery(
    'scheduled-posts',
    () => api.get('/generated-posts?status=SCHEDULED').then((res) => res.data.data)
  );

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
        <p className="mt-1 text-sm text-gray-500">
          View and manage your scheduled posts
        </p>
      </div>

      <div className="text-center py-12">
        <CalendarIcon className="mx-auto h-12 w-12 text-gray-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">
          Calendar View Coming Soon
        </h3>
        <p className="mt-1 text-sm text-gray-500">
          The calendar view is currently under development. For now, you can manage scheduled posts from the approval queue.
        </p>
      </div>
    </div>
  );
};

export default Calendar;