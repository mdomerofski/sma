import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { toast } from 'react-toastify';
import { formatDistanceToNow } from 'date-fns';
import {
  CheckIcon,
  XMarkIcon,
  PencilIcon,
  EyeIcon,
  PaperAirplaneIcon,
} from '@heroicons/react/24/outline';
import api from '../utils/api';
import { GeneratedPost, PaginationResponse } from '../types';

const ApprovalQueue: React.FC = () => {
  const [page, setPage] = useState(1);
  const [editingPost, setEditingPost] = useState<string | null>(null);
  const [editContent, setEditContent] = useState('');
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery<PaginationResponse<GeneratedPost>>(
    ['generated-posts', page, 'PENDING_APPROVAL'],
    () =>
      api
        .get(`/generated-posts?page=${page}&limit=10&status=PENDING_APPROVAL`)
        .then((res) => res.data)
  );

  const updatePostMutation = useMutation(
    ({ id, data }: { id: string; data: any }) =>
      api.put(`/generated-posts/${id}`, data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generated-posts');
        setEditingPost(null);
        toast.success('Post updated successfully');
      },
      onError: () => {
        toast.error('Failed to update post');
      },
    }
  );

  const publishPostMutation = useMutation(
    (id: string) => api.post(`/generated-posts/${id}/publish`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generated-posts');
        toast.success('Post published successfully');
      },
      onError: (error: any) => {
        toast.error(error.response?.data?.error || 'Failed to publish post');
      },
    }
  );

  const handleApprove = (id: string) => {
    updatePostMutation.mutate({
      id,
      data: { status: 'APPROVED' },
    });
  };

  const handleReject = (id: string) => {
    updatePostMutation.mutate({
      id,
      data: { status: 'DRAFT' },
    });
  };

  const handleEdit = (post: GeneratedPost) => {
    setEditingPost(post.id);
    setEditContent(post.content);
  };

  const handleSaveEdit = (id: string) => {
    updatePostMutation.mutate({
      id,
      data: { content: editContent },
    });
  };

  const handlePublish = (id: string) => {
    publishPostMutation.mutate(id);
  };

  const getPlatformPreview = (post: GeneratedPost) => {
    const maxLengths = {
      TWITTER: 280,
      FACEBOOK: 500,
      LINKEDIN: 1300,
      INSTAGRAM: 2200,
    };

    const isOverLimit = post.content.length > maxLengths[post.platform];

    return (
      <div className="mt-4 p-4 border rounded-lg bg-gray-50">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">
            {post.platform} Preview
          </span>
          <span
            className={`text-sm ${
              isOverLimit ? 'text-red-500' : 'text-gray-500'
            }`}
          >
            {post.content.length}/{maxLengths[post.platform]}
          </span>
        </div>
        <div className="text-sm text-gray-900 whitespace-pre-wrap">
          {post.content}
        </div>
        {isOverLimit && (
          <p className="mt-2 text-sm text-red-500">
            Content exceeds platform limit
          </p>
        )}
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
        <div className="space-y-6">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6">
              <div className="h-6 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Approval Queue</h1>
        <p className="mt-1 text-sm text-gray-500">
          Review and approve AI-generated posts before publishing
        </p>
      </div>

      <div className="space-y-6">
        {data?.data.map((post) => (
          <div key={post.id} className="card p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  {post.discoveredContent.title}
                </h3>
                <div className="flex items-center space-x-2 mt-1 text-sm text-gray-500">
                  <span>{post.socialAccount.platform}</span>
                  <span>•</span>
                  <span>{post.socialAccount.accountName}</span>
                  <span>•</span>
                  <span>
                    {formatDistanceToNow(new Date(post.createdAt), {
                      addSuffix: true,
                    })}
                  </span>
                </div>
              </div>
              <a
                href={post.discoveredContent.url}
                target="_blank"
                rel="noopener noreferrer"
                className="p-2 text-gray-400 hover:text-gray-500"
                title="View original content"
              >
                <EyeIcon className="h-4 w-4" />
              </a>
            </div>

            {editingPost === post.id ? (
              <div className="space-y-4">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  className="input w-full h-32"
                  placeholder="Edit post content..."
                />
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleSaveEdit(post.id)}
                    className="btn-primary"
                  >
                    Save Changes
                  </button>
                  <button
                    onClick={() => setEditingPost(null)}
                    className="btn-secondary"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                {getPlatformPreview(post)}
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(post.id)}
                      className="btn-primary flex items-center space-x-1"
                    >
                      <CheckIcon className="h-4 w-4" />
                      <span>Approve</span>
                    </button>
                    <button
                      onClick={() => handleReject(post.id)}
                      className="btn-danger flex items-center space-x-1"
                    >
                      <XMarkIcon className="h-4 w-4" />
                      <span>Reject</span>
                    </button>
                    <button
                      onClick={() => handleEdit(post)}
                      className="btn-secondary flex items-center space-x-1"
                    >
                      <PencilIcon className="h-4 w-4" />
                      <span>Edit</span>
                    </button>
                  </div>
                  <button
                    onClick={() => handlePublish(post.id)}
                    className="btn-primary flex items-center space-x-1"
                  >
                    <PaperAirplaneIcon className="h-4 w-4" />
                    <span>Publish Now</span>
                  </button>
                </div>
              </>
            )}
          </div>
        ))}

        {data?.data.length === 0 && (
          <div className="text-center py-12">
            <CheckIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No posts pending approval
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              All posts have been reviewed or no posts have been generated yet.
            </p>
          </div>
        )}
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

export default ApprovalQueue;