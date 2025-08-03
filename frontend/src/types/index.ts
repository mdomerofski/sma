export interface User {
  id: string;
  email: string;
  name: string | null;
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface ContentSource {
  id: string;
  name: string;
  url: string;
  type: 'RSS' | 'API';
  isActive: boolean;
  lastCrawled: string | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    discoveredContent: number;
  };
}

export interface DiscoveredContent {
  id: string;
  title: string;
  content: string | null;
  url: string;
  publishedAt: string | null;
  isProcessed: boolean;
  createdAt: string;
  updatedAt: string;
  contentSource: {
    id: string;
    name: string;
  };
  generatedPosts: {
    id: string;
    status: PostStatus;
    platform: Platform;
  }[];
}

export interface SocialAccount {
  id: string;
  platform: Platform;
  accountName: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface GeneratedPost {
  id: string;
  content: string;
  status: PostStatus;
  platform: Platform;
  scheduledAt: string | null;
  publishedAt: string | null;
  metadata?: any;
  createdAt: string;
  updatedAt: string;
  discoveredContent: {
    id: string;
    title: string;
    url: string;
  };
  socialAccount: {
    id: string;
    platform: Platform;
    accountName: string;
  };
  analytics?: PostAnalytics[];
}

export interface PostAnalytics {
  id: string;
  likes: number;
  shares: number;
  comments: number;
  views: number;
  createdAt: string;
  updatedAt: string;
}

export type Platform = 'TWITTER' | 'FACEBOOK' | 'LINKEDIN' | 'INSTAGRAM';

export type PostStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'SCHEDULED' | 'PUBLISHED' | 'FAILED';

export interface PaginationResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface AnalyticsOverview {
  overview: {
    contentSources: {
      total: number;
      active: number;
    };
    discoveredContent: {
      total: number;
      unprocessed: number;
    };
    generatedPosts: {
      total: number;
      published: number;
      pending: number;
    };
    socialAccounts: number;
  };
  recentActivity: GeneratedPost[];
}