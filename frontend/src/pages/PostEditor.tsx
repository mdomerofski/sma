import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { PaperAirplaneIcon, SparklesIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { DiscoveredContent, SocialAccount, Platform } from '../types';

interface PostForm {
  discoveredContentId: string;
  socialAccountId: string;
  platform: Platform;
  content: string;
  scheduledAt?: string;
}

const PostEditor: React.FC = () => {
  const [selectedContent, setSelectedContent] = useState<DiscoveredContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const queryClient = useQueryClient();

  const { register, handleSubmit, watch, setValue, formState: { errors } } = useForm<PostForm>();

  const watchedPlatform = watch('platform');
  const watchedContent = watch('content');

  const { data: discoveredContent } = useQuery(
    'discovered-content-unprocessed',
    () => api.get('/discovered-content?isProcessed=false&limit=50').then((res) => res.data.data)
  );

  const { data: socialAccounts } = useQuery<SocialAccount[]>(
    'social-accounts',
    () => api.get('/social-accounts').then((res) => res.data)
  );

  const createPostMutation = useMutation(
    (data: any) => api.post('/generated-posts', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('generated-posts');
        toast.success('Post created successfully');
        setValue('content', '');
        setSelectedContent(null);
      },
      onError: () => {
        toast.error('Failed to create post');
      },
    }
  );

  const generatePostMutation = useMutation(
    (data: any) => api.post('/generated-posts/generate', data),
    {
      onSuccess: (response) => {
        setValue('content', response.data.content);
        toast.success('Post generated successfully');
      },
      onError: () => {
        toast.error('Failed to generate post');
      },
    }
  );

  const handleGeneratePost = async () => {
    const discoveredContentId = watch('discoveredContentId');
    const socialAccountId = watch('socialAccountId');
    const platform = watch('platform');

    if (!discoveredContentId || !socialAccountId || !platform) {
      toast.error('Please select content, social account, and platform');
      return;
    }

    setIsGenerating(true);
    try {
      await generatePostMutation.mutateAsync({
        discoveredContentId,
        socialAccountId,
        platform,
        options: {
          tone: 'engaging',
          includeHashtags: true,
          includeUrl: true,
        },
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const onSubmit = async (data: PostForm) => {
    createPostMutation.mutate({
      ...data,
      scheduledAt: data.scheduledAt || null,
    });
  };

  const getPlatformLimits = (platform: Platform) => {
    const limits = {
      TWITTER: 280,
      FACEBOOK: 500,
      LINKEDIN: 1300,
      INSTAGRAM: 2200,
    };
    return limits[platform] || 280;
  };

  const isOverLimit = watchedPlatform && watchedContent
    ? watchedContent.length > getPlatformLimits(watchedPlatform)
    : false;

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Post Editor</h1>
        <p className="mt-1 text-sm text-gray-500">
          Create and edit social media posts
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="space-y-6">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Select Content
              </label>
              <select
                {...register('discoveredContentId', { required: 'Content is required' })}
                className="input mt-1"
                onChange={(e) => {
                  const content = discoveredContent?.find(c => c.id === e.target.value);
                  setSelectedContent(content || null);
                }}
              >
                <option value="">Choose content to post about...</option>
                {discoveredContent?.map((content) => (
                  <option key={content.id} value={content.id}>
                    {content.title}
                  </option>
                ))}
              </select>
              {errors.discoveredContentId && (
                <p className="mt-1 text-sm text-red-600">{errors.discoveredContentId.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Social Account
              </label>
              <select
                {...register('socialAccountId', { required: 'Social account is required' })}
                className="input mt-1"
                onChange={(e) => {
                  const account = socialAccounts?.find(a => a.id === e.target.value);
                  if (account) {
                    setValue('platform', account.platform);
                  }
                }}
              >
                <option value="">Choose social account...</option>
                {socialAccounts?.map((account) => (
                  <option key={account.id} value={account.id}>
                    {account.platform} - {account.accountName}
                  </option>
                ))}
              </select>
              {errors.socialAccountId && (
                <p className="mt-1 text-sm text-red-600">{errors.socialAccountId.message}</p>
              )}
            </div>

            <input
              {...register('platform')}
              type="hidden"
            />

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-gray-700">
                  Post Content
                </label>
                <button
                  type="button"
                  onClick={handleGeneratePost}
                  disabled={isGenerating}
                  className="btn-secondary flex items-center space-x-1 text-sm"
                >
                  <SparklesIcon className="h-4 w-4" />
                  <span>{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
                </button>
              </div>
              <textarea
                {...register('content', { required: 'Content is required' })}
                className="input mt-1 h-32"
                placeholder="Write your post content or generate with AI..."
              />
              {watchedPlatform && (
                <div className="mt-1 flex items-center justify-between text-sm">
                  <span className={isOverLimit ? 'text-red-500' : 'text-gray-500'}>
                    {watchedContent?.length || 0}/{getPlatformLimits(watchedPlatform)}
                  </span>
                  {isOverLimit && (
                    <span className="text-red-500">Exceeds platform limit</span>
                  )}
                </div>
              )}
              {errors.content && (
                <p className="mt-1 text-sm text-red-600">{errors.content.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Schedule for Later (Optional)
              </label>
              <input
                {...register('scheduledAt')}
                type="datetime-local"
                className="input mt-1"
                min={new Date().toISOString().slice(0, 16)}
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={createPostMutation.isLoading || isOverLimit}
                className="btn-primary flex items-center space-x-1"
              >
                <PaperAirplaneIcon className="h-4 w-4" />
                <span>
                  {createPostMutation.isLoading ? 'Creating...' : 'Create Post'}
                </span>
              </button>
            </div>
          </form>
        </div>

        <div>
          {selectedContent && (
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Content Preview
              </h3>
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-700">{selectedContent.title}</h4>
                  <p className="text-sm text-gray-500 mt-1">
                    From: {selectedContent.contentSource.name}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600 line-clamp-6">
                    {selectedContent.content || 'No content preview available'}
                  </p>
                </div>
                <div>
                  <a
                    href={selectedContent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-primary-600 hover:text-primary-500"
                  >
                    View original article →
                  </a>
                </div>
              </div>
            </div>
          )}

          {watchedContent && watchedPlatform && (
            <div className="card p-6 mt-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {watchedPlatform} Preview
              </h3>
              <div className="p-4 border rounded-lg bg-gray-50">
                <div className="text-sm text-gray-900 whitespace-pre-wrap">
                  {watchedContent}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PostEditor;