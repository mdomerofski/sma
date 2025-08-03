import express from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { validate, generatedPostSchema } from '../utils/validation';
import { OpenAIService } from '../services/openaiService';
import { TwitterService } from '../services/twitterService';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const status = req.query.status as string;
    const platform = req.query.platform as string;

    const skip = (page - 1) * limit;

    const where: any = {
      userId: req.user!.userId,
    };

    if (status) {
      where.status = status;
    }

    if (platform) {
      where.platform = platform;
    }

    const [posts, total] = await Promise.all([
      prisma.generatedPost.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          discoveredContent: {
            select: {
              id: true,
              title: true,
              url: true,
            },
          },
          socialAccount: {
            select: {
              id: true,
              platform: true,
              accountName: true,
            },
          },
          analytics: true,
        },
      }),
      prisma.generatedPost.count({ where }),
    ]);

    res.json({
      data: posts,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(generatedPostSchema), async (req, res, next) => {
  try {
    const { content, platform, discoveredContentId, socialAccountId, scheduledAt } = req.body;

    const [discoveredContent, socialAccount] = await Promise.all([
      prisma.discoveredContent.findFirst({
        where: {
          id: discoveredContentId,
          userId: req.user!.userId,
        },
      }),
      prisma.socialAccount.findFirst({
        where: {
          id: socialAccountId,
          userId: req.user!.userId,
        },
      }),
    ]);

    if (!discoveredContent) {
      return res.status(404).json({ error: 'Discovered content not found' });
    }

    if (!socialAccount) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    const post = await prisma.generatedPost.create({
      data: {
        content,
        platform,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
        status: 'DRAFT',
        userId: req.user!.userId,
        discoveredContentId,
        socialAccountId,
      },
      include: {
        discoveredContent: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            accountName: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

router.post('/generate', async (req, res, next) => {
  try {
    const { discoveredContentId, platform, socialAccountId, options = {} } = req.body;

    const [discoveredContent, socialAccount] = await Promise.all([
      prisma.discoveredContent.findFirst({
        where: {
          id: discoveredContentId,
          userId: req.user!.userId,
        },
      }),
      prisma.socialAccount.findFirst({
        where: {
          id: socialAccountId,
          userId: req.user!.userId,
        },
      }),
    ]);

    if (!discoveredContent) {
      return res.status(404).json({ error: 'Discovered content not found' });
    }

    if (!socialAccount) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    const generatedContent = await OpenAIService.generatePost({
      platform,
      title: discoveredContent.title,
      content: discoveredContent.content || '',
      url: discoveredContent.url,
      ...options,
    });

    const post = await prisma.generatedPost.create({
      data: {
        content: generatedContent,
        platform,
        status: 'PENDING_APPROVAL',
        userId: req.user!.userId,
        discoveredContentId,
        socialAccountId,
      },
      include: {
        discoveredContent: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            accountName: true,
          },
        },
      },
    });

    res.status(201).json(post);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const post = await prisma.generatedPost.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        discoveredContent: true,
        socialAccount: {
          select: {
            id: true,
            platform: true,
            accountName: true,
          },
        },
        analytics: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { content, status, scheduledAt } = req.body;

    const post = await prisma.generatedPost.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    const updatedPost = await prisma.generatedPost.update({
      where: { id: req.params.id },
      data: {
        content,
        status,
        scheduledAt: scheduledAt ? new Date(scheduledAt) : null,
      },
      include: {
        discoveredContent: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            accountName: true,
          },
        },
      },
    });

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/publish', async (req, res, next) => {
  try {
    const post = await prisma.generatedPost.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        socialAccount: true,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    if (post.status !== 'APPROVED' && post.status !== 'DRAFT') {
      return res.status(400).json({ error: 'Post must be approved before publishing' });
    }

    let publishResult;

    if (post.platform === 'TWITTER') {
      publishResult = await TwitterService.publishTweet(post.content, post.socialAccountId);
    } else {
      return res.status(400).json({ error: 'Platform not supported yet' });
    }

    if (!publishResult.success) {
      await prisma.generatedPost.update({
        where: { id: req.params.id },
        data: { status: 'FAILED' },
      });

      return res.status(400).json({ error: publishResult.error });
    }

    const updatedPost = await prisma.generatedPost.update({
      where: { id: req.params.id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
        metadata: publishResult.tweetId ? { tweetId: publishResult.tweetId } : null,
      },
      include: {
        discoveredContent: {
          select: {
            id: true,
            title: true,
            url: true,
          },
        },
        socialAccount: {
          select: {
            id: true,
            platform: true,
            accountName: true,
          },
        },
      },
    });

    res.json(updatedPost);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const post = await prisma.generatedPost.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    await prisma.generatedPost.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;