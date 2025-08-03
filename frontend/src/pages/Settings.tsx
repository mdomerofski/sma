import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useForm } from 'react-hook-form';
import { toast } from 'react-toastify';
import { PlusIcon, TrashIcon, CogIcon } from '@heroicons/react/24/outline';
import api from '../utils/api';
import { ContentSource, SocialAccount } from '../types';

interface ContentSourceForm {
  name: string;
  url: string;
  type: 'RSS' | 'API';
}

const Settings: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'sources' | 'accounts'>('sources');
  const queryClient = useQueryClient();

  const { register, handleSubmit, reset, formState: { errors } } = useForm<ContentSourceForm>();

  const { data: contentSources } = useQuery<ContentSource[]>(
    'content-sources',
    () => api.get('/content-sources').then((res) => res.data)
  );

  const { data: socialAccounts } = useQuery<SocialAccount[]>(
    'social-accounts',
    () => api.get('/social-accounts').then((res) => res.data)
  );

  const createSourceMutation = useMutation(
    (data: ContentSourceForm) => api.post('/content-sources', data),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('content-sources');
        reset();
        toast.success('Content source added successfully');
      },
      onError: () => {
        toast.error('Failed to add content source');
      },
    }
  );

  const deleteSourceMutation = useMutation(
    (id: string) => api.delete(`/content-sources/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('content-sources');
        toast.success('Content source deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete content source');
      },
    }
  );

  const deleteAccountMutation = useMutation(
    (id: string) => api.delete(`/social-accounts/${id}`),
    {
      onSuccess: () => {
        queryClient.invalidateQueries('social-accounts');
        toast.success('Social account deleted successfully');
      },
      onError: () => {
        toast.error('Failed to delete social account');
      },
    }
  );

  const onSubmit = (data: ContentSourceForm) => {
    createSourceMutation.mutate(data);
  };

  const handleDeleteSource = (id: string) => {
    if (window.confirm('Are you sure you want to delete this content source?')) {
      deleteSourceMutation.mutate(id);
    }
  };

  const handleDeleteAccount = (id: string) => {
    if (window.confirm('Are you sure you want to delete this social account?')) {
      deleteAccountMutation.mutate(id);
    }
  };

  const tabs = [
    { id: 'sources', name: 'Content Sources' },
    { id: 'accounts', name: 'Social Accounts' },
  ];

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
        <p className="mt-1 text-sm text-gray-500">
          Manage your content sources and social media accounts
        </p>
      </div>

      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === tab.id
                  ? 'border-primary-500 text-primary-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {activeTab === 'sources' && (
        <div className="space-y-6">
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Add Content Source
            </h3>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Name
                  </label>
                  <input
                    {...register('name', { required: 'Name is required' })}
                    type="text"
                    className="input mt-1"
                    placeholder="e.g., TechCrunch"
                  />
                  {errors.name && (
                    <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Type
                  </label>
                  <select {...register('type')} className="input mt-1">
                    <option value="RSS">RSS Feed</option>
                    <option value="API">API</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">
                  URL
                </label>
                <input
                  {...register('url', { 
                    required: 'URL is required',
                    pattern: {
                      value: /^https?:\/\/.+/,
                      message: 'Please enter a valid URL'
                    }
                  })}
                  type="url"
                  className="input mt-1"
                  placeholder="https://example.com/rss"
                />
                {errors.url && (
                  <p className="mt-1 text-sm text-red-600">{errors.url.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={createSourceMutation.isLoading}
                className="btn-primary flex items-center space-x-1"
              >
                <PlusIcon className="h-4 w-4" />
                <span>
                  {createSourceMutation.isLoading ? 'Adding...' : 'Add Source'}
                </span>
              </button>
            </form>
          </div>

          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Your Content Sources
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {contentSources?.map((source) => (
                <div key={source.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {source.name}
                    </h4>
                    <p className="text-sm text-gray-500">{source.url}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        source.isActive
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}>
                        {source.isActive ? 'Active' : 'Inactive'}
                      </span>
                      <span className="text-xs text-gray-500">
                        {source._count?.discoveredContent || 0} items discovered
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => handleDeleteSource(source.id)}
                    className="p-2 text-red-400 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {contentSources?.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <p className="text-sm text-gray-500">
                    No content sources added yet.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="card">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">
                Social Media Accounts
              </h3>
            </div>
            <div className="divide-y divide-gray-200">
              {socialAccounts?.map((account) => (
                <div key={account.id} className="px-6 py-4 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-medium text-gray-900">
                      {account.platform}
                    </h4>
                    <p className="text-sm text-gray-500">@{account.accountName}</p>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full mt-1 ${
                      account.isActive
                        ? 'bg-green-100 text-green-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.isActive ? 'Connected' : 'Disconnected'}
                    </span>
                  </div>
                  <button
                    onClick={() => handleDeleteAccount(account.id)}
                    className="p-2 text-red-400 hover:text-red-500"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
                </div>
              ))}
              {socialAccounts?.length === 0 && (
                <div className="px-6 py-8 text-center">
                  <CogIcon className="mx-auto h-8 w-8 text-gray-400" />
                  <p className="mt-2 text-sm text-gray-500">
                    No social accounts connected yet.
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    Social account integration is coming soon.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;