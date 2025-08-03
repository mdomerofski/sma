import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import {
  EyeIcon,
  PencilIcon,
  TrashIcon,
  CheckIcon,
  XMarkIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { DiscoveredContent as DiscoveredContentType, PaginationResponse } from '../types';

const DiscoveredContent: React.FC = () => {
  const [page, setPage] = useState(1);
  const [filter, setFilter] = useState<'all' | 'unprocessed' | 'processed'>('all');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginationResponse<DiscoveredContentType>>(
    ['discovered-content', page, filter],
    () => {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
      });
      
      if (filter !== 'all') {
        params.append('isProcessed', (filter === 'processed').toString());
      }

      return api.get(`/discovered-content?${params}`).then((res) => res.data);
    }
  );

  const updateContentMutation = useMutation(
    ({ id, isProcessed }: { id: string; isProcessed: boolean }) =>
      api.patch(`/discovered-content/${id}`, { isProcessed }),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('discovered-content');
        toast.success('Content updated successfully');
      },
      onError: () => {
        toast.error('Failed to update content');
      },
    }
  );

  const deleteContentMutation = useMutation(
    (id: string) => api.delete(`/discovered-content/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('discovered-content');
        toast.success('Content deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete content');
      },
    }
  );

  const handleMarkProcessed = (id: string, isProcessed: boolean) => {
    updateContentMutation.mutate({ id, isProcessed });
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Are you sure you want to delete this content?')) {
      deleteContentMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="space-y-4">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="sm:flex sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discovered Content</h1>
          <p className="mt-1 text-sm text-gray-500">
            Content discovered from your RSS feeds
          </p>
        </div>
        <div className="mt-4 sm:mt-0">
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value as any);
              setPage(1);
            }}
            className="input"
          >
            <option value="all">All Content</option>
            <option value="unprocessed">Unprocessed</option>
            <option value="processed">Processed</option>
          </select>
        </div>
      </div>

      <div className="space-y-4">
        {data?.data.map((content) => (
          <div key={content.id} className="card p-6">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <h3 className="text-lg font-medium text-gray-900">
                    {content.title}
                  </h3>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      content.isProcessed
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {content.isProcessed ? 'Processed' : 'Unprocessed'}
                  </span>
                </div>
                
                <p className="text-sm text-gray-600 mb-3 line-clamp-3">
                  {content.content || 'No content preview available'}
                </p>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>Source: {content.contentSource.name}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(content.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                  {content.generatedPosts.length > 0 && (
                    <>
                      <span>•</span>
                      <span>{content.generatedPosts.length} posts generated</span>
                    </>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                <a
                  href={content.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title="View original"
                >
                  <EyeIcon className="h-4 w-4" />
                </a>
                
                <button
                  onClick={() => handleMarkProcessed(content.id, !content.isProcessed)}
                  className="p-2 text-gray-400 hover:text-gray-500"
                  title={content.isProcessed ? 'Mark unprocessed' : 'Mark processed'}
                >
                  {content.isProcessed ? (
                    <XMarkIcon className="h-4 w-4" />
                  ) : (
                    <CheckIcon className="h-4 w-4" />
                  )}
                </button>
                
                <button
                  onClick={() => handleDelete(content.id)}
                  className="p-2 text-red-400 hover:text-red-500"
                  title="Delete content"
                >
                  <TrashIcon className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {data?.pagination && data.pagination.pages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Showing {data.pagination.page} of {data.pagination.pages} pages
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="btn-secondary disabled:opacity-50"
            >
              Previous
            </button>
            <button
              onClick={() => setPage(Math.min(data.pagination.pages, page + 1))}
              disabled={page === data.pagination.pages}
              className="btn-secondary disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DiscoveredContent;