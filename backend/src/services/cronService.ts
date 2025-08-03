import { CronJob } from 'cron';
import { RSSCrawler } from './rssCrawler';
import { prisma } from '../index';

export const startCronJobs = (): void => {
  console.log('⏰ Starting cron jobs...');

  const rssCrawlJob = new CronJob(
    '0 * * * *',
    async () => {
      console.log('🕷️ Hourly RSS crawl starting...');
      try {
        await RSSCrawler.crawlAllSources();
      } catch (error) {
        console.error('❌ Hourly RSS crawl failed:', error);
      }
    },
    null,
    true,
    'UTC'
  );

  const cleanupJob = new CronJob(
    '0 2 * * *',
    async () => {
      console.log('🧹 Daily cleanup starting...');
      try {
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const { count } = await prisma.discoveredContent.deleteMany({
          where: {
            isProcessed: true,
            createdAt: {
              lt: threeDaysAgo,
            },
          },
        });

        console.log(`🗑️ Cleaned up ${count} processed content items`);
      } catch (error) {
        console.error('❌ Daily cleanup failed:', error);
      }
    },
    null,
    true,
    'UTC'
  );

  console.log('✅ Cron jobs started successfully');
  console.log('📋 Scheduled jobs:');
  console.log('  - RSS crawl: Every hour');
  console.log('  - Cleanup: Daily at 2 AM UTC');
};