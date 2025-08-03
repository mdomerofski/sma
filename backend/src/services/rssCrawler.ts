import Parser from 'rss-parser';
import { prisma } from '../index';

const parser = new Parser();

export class RSSCrawler {
  static async crawlAllSources(): Promise<void> {
    console.log('🕷️ Starting RSS crawl...');
    
    try {
      const activeSources = await prisma.contentSource.findMany({
        where: {
          isActive: true,
          type: 'RSS',
        },
        include: {
          user: true,
        },
      });

      console.log(`📡 Found ${activeSources.length} active RSS sources`);

      for (const source of activeSources) {
        try {
          await this.crawlSource(source);
        } catch (error) {
          console.error(`❌ Error crawling source ${source.name}:`, error);
        }
      }

      console.log('✅ RSS crawl completed');
    } catch (error) {
      console.error('❌ RSS crawl failed:', error);
    }
  }

  static async crawlSource(source: any): Promise<void> {
    try {
      console.log(`🔍 Crawling ${source.name} (${source.url})`);
      
      const feed = await parser.parseURL(source.url);
      
      if (!feed.items || feed.items.length === 0) {
        console.log(`📭 No items found in ${source.name}`);
        return;
      }

      let newItemsCount = 0;

      for (const item of feed.items.slice(0, 10)) {
        if (!item.link || !item.title) continue;

        const existingContent = await prisma.discoveredContent.findFirst({
          where: {
            url: item.link,
            contentSourceId: source.id,
          },
        });

        if (existingContent) continue;

        await prisma.discoveredContent.create({
          data: {
            title: item.title,
            content: item.contentSnippet || item.content || '',
            url: item.link,
            publishedAt: item.pubDate ? new Date(item.pubDate) : null,
            userId: source.userId,
            contentSourceId: source.id,
          },
        });

        newItemsCount++;
      }

      await prisma.contentSource.update({
        where: { id: source.id },
        data: { lastCrawled: new Date() },
      });

      console.log(`📈 Found ${newItemsCount} new items from ${source.name}`);
    } catch (error) {
      console.error(`❌ Failed to crawl ${source.name}:`, error);
      throw error;
    }
  }

  static async crawlSourceById(sourceId: string): Promise<void> {
    const source = await prisma.contentSource.findUnique({
      where: { id: sourceId },
      include: { user: true },
    });

    if (!source) {
      throw new Error('Content source not found');
    }

    if (!source.isActive) {
      throw new Error('Content source is not active');
    }

    await this.crawlSource(source);
  }
}