import express from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/overview', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const [
      totalSources,
      activeSources,
      totalContent,
      unprocessedContent,
      totalPosts,
      publishedPosts,
      pendingPosts,
      socialAccounts,
    ] = await Promise.all([
      prisma.contentSource.count({
        where: { userId },
      }),
      prisma.contentSource.count({
        where: { userId, isActive: true },
      }),
      prisma.discoveredContent.count({
        where: { userId },
      }),
      prisma.discoveredContent.count({
        where: { userId, isProcessed: false },
      }),
      prisma.generatedPost.count({
        where: { userId },
      }),
      prisma.generatedPost.count({
        where: { userId, status: 'PUBLISHED' },
      }),
      prisma.generatedPost.count({
        where: { userId, status: 'PENDING_APPROVAL' },
      }),
      prisma.socialAccount.count({
        where: { userId, isActive: true },
      }),
    ]);

    const recentActivity = await prisma.generatedPost.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 5,
      include: {
        socialAccount: {
          select: {
            platform: true,
            accountName: true,
          },
        },
        discoveredContent: {
          select: {
            title: true,
          },
        },
      },
    });

    res.json({
      overview: {
        contentSources: {
          total: totalSources,
          active: activeSources,
        },
        discoveredContent: {
          total: totalContent,
          unprocessed: unprocessedContent,
        },
        generatedPosts: {
          total: totalPosts,
          published: publishedPosts,
          pending: pendingPosts,
        },
        socialAccounts,
      },
      recentActivity,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/posts', async (req, res, next) => {
  try {
    const userId = req.user!.userId;
    const days = parseInt(req.query.days as string) || 30;

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const posts = await prisma.generatedPost.findMany({
      where: {
        userId,
        publishedAt: {
          gte: startDate,
        },
        status: 'PUBLISHED',
      },
      include: {
        analytics: true,
        socialAccount: {
          select: {
            platform: true,
          },
        },
      },
    });

    const platformStats = posts.reduce((acc, post) => {
      const platform = post.socialAccount.platform;
      if (!acc[platform]) {
        acc[platform] = {
          count: 0,
          totalLikes: 0,
          totalShares: 0,
          totalComments: 0,
          totalViews: 0,
        };
      }

      acc[platform].count++;
      if (post.analytics.length > 0) {
        const analytics = post.analytics[0];
        acc[platform].totalLikes += analytics.likes;
        acc[platform].totalShares += analytics.shares;
        acc[platform].totalComments += analytics.comments;
        acc[platform].totalViews += analytics.views;
      }

      return acc;
    }, {} as any);

    const dailyStats = posts.reduce((acc, post) => {
      const date = post.publishedAt?.toISOString().split('T')[0];
      if (!date) return acc;

      if (!acc[date]) {
        acc[date] = {
          posts: 0,
          likes: 0,
          shares: 0,
          comments: 0,
          views: 0,
        };
      }

      acc[date].posts++;
      if (post.analytics.length > 0) {
        const analytics = post.analytics[0];
        acc[date].likes += analytics.likes;
        acc[date].shares += analytics.shares;
        acc[date].comments += analytics.comments;
        acc[date].views += analytics.views;
      }

      return acc;
    }, {} as any);

    res.json({
      platformStats,
      dailyStats,
      totalPosts: posts.length,
    });
  } catch (error) {
    next(error);
  }
});

router.get('/content-sources', async (req, res, next) => {
  try {
    const userId = req.user!.userId;

    const sources = await prisma.contentSource.findMany({
      where: { userId },
      include: {
        _count: {
          select: {
            discoveredContent: true,
          },
        },
        discoveredContent: {
          include: {
            _count: {
              select: {
                generatedPosts: true,
              },
            },
          },
        },
      },
    });

    const sourceStats = sources.map(source => {
      const totalContent = source._count.discoveredContent;
      const totalPosts = source.discoveredContent.reduce(
        (sum, content) => sum + content._count.generatedPosts,
        0
      );

      return {
        id: source.id,
        name: source.name,
        url: source.url,
        isActive: source.isActive,
        totalContent,
        totalPosts,
        lastCrawled: source.lastCrawled,
      };
    });

    res.json(sourceStats);
  } catch (error) {
    next(error);
  }
});

export default router;