import OpenAI from 'openai';
import { Platform } from '@prisma/client';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface PostGenerationOptions {
  platform: Platform;
  title: string;
  content: string;
  url: string;
  tone?: 'professional' | 'casual' | 'engaging' | 'informative';
  includeHashtags?: boolean;
  includeUrl?: boolean;
}

export class OpenAIService {
  static async generatePost(options: PostGenerationOptions): Promise<string> {
    const {
      platform,
      title,
      content,
      url,
      tone = 'engaging',
      includeHashtags = true,
      includeUrl = true,
    } = options;

    const platformLimits = this.getPlatformLimits(platform);
    const platformSpecific = this.getPlatformSpecificInstructions(platform);

    const prompt = `
Create a ${tone} social media post for ${platform} based on this content:

Title: ${title}
Content: ${content.substring(0, 500)}...
URL: ${url}

Requirements:
- Maximum ${platformLimits.maxLength} characters
- ${platformSpecific}
- Tone: ${tone}
- ${includeHashtags ? 'Include relevant hashtags' : 'Do not include hashtags'}
- ${includeUrl ? 'Include the URL at the end' : 'Do not include the URL'}
- Make it engaging and encourage interaction
- Focus on the key insights or value from the content

Generate only the post text, nothing else.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a social media expert who creates engaging posts that drive engagement and clicks. Keep posts concise, valuable, and platform-appropriate.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 200,
        temperature: 0.7,
      });

      const generatedPost = completion.choices[0]?.message?.content?.trim() || '';
      
      return this.ensurePlatformCompliance(generatedPost, platform);
    } catch (error) {
      console.error('❌ OpenAI post generation failed:', error);
      throw new Error('Failed to generate post with AI');
    }
  }

  static async generateMultiplePosts(
    options: PostGenerationOptions,
    count: number = 3
  ): Promise<string[]> {
    const posts: string[] = [];
    
    for (let i = 0; i < count; i++) {
      try {
        const post = await this.generatePost({
          ...options,
          tone: this.getRandomTone(),
        });
        posts.push(post);
      } catch (error) {
        console.error(`❌ Failed to generate post ${i + 1}:`, error);
      }
    }

    return posts;
  }

  private static getPlatformLimits(platform: Platform) {
    switch (platform) {
      case 'TWITTER':
        return { maxLength: 280 };
      case 'FACEBOOK':
        return { maxLength: 500 };
      case 'LINKEDIN':
        return { maxLength: 1300 };
      case 'INSTAGRAM':
        return { maxLength: 2200 };
      default:
        return { maxLength: 280 };
    }
  }

  private static getPlatformSpecificInstructions(platform: Platform): string {
    switch (platform) {
      case 'TWITTER':
        return 'Use Twitter-style format with mentions and hashtags. Be concise and punchy.';
      case 'FACEBOOK':
        return 'Use Facebook-style format. Can be more conversational and include emojis.';
      case 'LINKEDIN':
        return 'Use professional LinkedIn tone. Focus on insights and professional value.';
      case 'INSTAGRAM':
        return 'Use Instagram-style with emojis and engaging language. Include relevant hashtags.';
      default:
        return 'Use engaging social media format.';
    }
  }

  private static ensurePlatformCompliance(post: string, platform: Platform): string {
    const limits = this.getPlatformLimits(platform);
    
    if (post.length <= limits.maxLength) {
      return post;
    }

    const truncated = post.substring(0, limits.maxLength - 3) + '...';
    return truncated;
  }

  private static getRandomTone(): 'professional' | 'casual' | 'engaging' | 'informative' {
    const tones = ['professional', 'casual', 'engaging', 'informative'] as const;
    return tones[Math.floor(Math.random() * tones.length)];
  }

  static async summarizeContent(title: string, content: string): Promise<string> {
    const prompt = `
Summarize this content in 2-3 sentences, focusing on the key insights and value:

Title: ${title}
Content: ${content.substring(0, 1000)}...

Provide a concise summary that captures the essence and main points.
`;

    try {
      const completion = await openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are an expert at summarizing content and extracting key insights.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        max_tokens: 150,
        temperature: 0.3,
      });

      return completion.choices[0]?.message?.content?.trim() || 'Unable to generate summary';
    } catch (error) {
      console.error('❌ OpenAI summarization failed:', error);
      throw new Error('Failed to summarize content');
    }
  }
}