import { TwitterApi } from 'twitter-api-v2';
import { prisma } from '../index';

export class TwitterService {
  private static getClient(accessToken?: string, accessSecret?: string): TwitterApi {
    const apiKey = process.env.TWITTER_API_KEY;
    const apiSecret = process.env.TWITTER_API_SECRET;

    if (!apiKey || !apiSecret) {
      throw new Error('Twitter API credentials not configured');
    }

    if (accessToken && accessSecret) {
      return new TwitterApi({
        appKey: apiKey,
        appSecret: apiSecret,
        accessToken,
        accessSecret,
      });
    }

    return new TwitterApi({
      appKey: apiKey,
      appSecret: apiSecret,
    });
  }

  static async publishTweet(
    content: string,
    socialAccountId: string
  ): Promise<{ success: boolean; tweetId?: string; error?: string }> {
    try {
      const socialAccount = await prisma.socialAccount.findUnique({
        where: { id: socialAccountId },
      });

      if (!socialAccount) {
        throw new Error('Social account not found');
      }

      if (socialAccount.platform !== 'TWITTER') {
        throw new Error('Account is not a Twitter account');
      }

      if (!socialAccount.accessToken || !socialAccount.accessSecret) {
        throw new Error('Twitter account not properly configured');
      }

      const client = this.getClient(socialAccount.accessToken, socialAccount.accessSecret);
      const tweet = await client.v2.tweet(content);

      console.log('✅ Tweet published successfully:', tweet.data.id);

      return {
        success: true,
        tweetId: tweet.data.id,
      };
    } catch (error) {
      console.error('❌ Failed to publish tweet:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      };
    }
  }

  static async verifyCredentials(
    accessToken: string,
    accessSecret: string
  ): Promise<{ valid: boolean; user?: any; error?: string }> {
    try {
      const client = this.getClient(accessToken, accessSecret);
      const user = await client.v2.me();

      return {
        valid: true,
        user: user.data,
      };
    } catch (error) {
      console.error('❌ Twitter credentials verification failed:', error);
      return {
        valid: false,
        error: error instanceof Error ? error.message : 'Invalid credentials',
      };
    }
  }

  static async getTweetAnalytics(tweetId: string, accessToken: string, accessSecret: string) {
    try {
      const client = this.getClient(accessToken, accessSecret);
      
      const tweet = await client.v2.singleTweet(tweetId, {
        'tweet.fields': ['public_metrics', 'created_at'],
      });

      if (!tweet.data?.public_metrics) {
        return null;
      }

      return {
        likes: tweet.data.public_metrics.like_count || 0,
        retweets: tweet.data.public_metrics.retweet_count || 0,
        replies: tweet.data.public_metrics.reply_count || 0,
        views: tweet.data.public_metrics.impression_count || 0,
      };
    } catch (error) {
      console.error('❌ Failed to get tweet analytics:', error);
      return null;
    }
  }

  static async getAuthUrl(): Promise<{ url: string; oauth_token: string; oauth_token_secret: string }> {
    try {
      const client = this.getClient();
      const authLink = await client.generateAuthLink('http://localhost:3001/api/auth/twitter/callback');
      
      return {
        url: authLink.url,
        oauth_token: authLink.oauth_token,
        oauth_token_secret: authLink.oauth_token_secret,
      };
    } catch (error) {
      console.error('❌ Failed to generate Twitter auth URL:', error);
      throw new Error('Failed to generate Twitter authorization URL');
    }
  }

  static async handleCallback(
    oauth_token: string,
    oauth_verifier: string,
    oauth_token_secret: string
  ): Promise<{ accessToken: string; accessSecret: string; user: any }> {
    try {
      const client = new TwitterApi({
        appKey: process.env.TWITTER_API_KEY!,
        appSecret: process.env.TWITTER_API_SECRET!,
        accessToken: oauth_token,
        accessSecret: oauth_token_secret,
      });

      const { client: loggedClient, accessToken, accessSecret } = await client.login(oauth_verifier);
      const user = await loggedClient.v2.me();

      return {
        accessToken,
        accessSecret,
        user: user.data,
      };
    } catch (error) {
      console.error('❌ Twitter OAuth callback failed:', error);
      throw new Error('Failed to complete Twitter authorization');
    }
  }
}