import express from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const isProcessed = req.query.isProcessed === 'true';
    const sourceId = req.query.sourceId as string;

    const skip = (page - 1) * limit;

    const where: any = {
      userId: req.user!.userId,
    };

    if (typeof isProcessed === 'boolean') {
      where.isProcessed = isProcessed;
    }

    if (sourceId) {
      where.contentSourceId = sourceId;
    }

    const [content, total] = await Promise.all([
      prisma.discoveredContent.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          contentSource: {
            select: {
              id: true,
              name: true,
            },
          },
          generatedPosts: {
            select: {
              id: true,
              status: true,
              platform: true,
            },
          },
        },
      }),
      prisma.discoveredContent.count({ where }),
    ]);

    res.json({
      data: content,
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

router.get('/:id', async (req, res, next) => {
  try {
    const content = await prisma.discoveredContent.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        contentSource: true,
        generatedPosts: {
          include: {
            socialAccount: {
              select: {
                id: true,
                platform: true,
                accountName: true,
              },
            },
          },
        },
      },
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    res.json(content);
  } catch (error) {
    next(error);
  }
});

router.patch('/:id', async (req, res, next) => {
  try {
    const { isProcessed } = req.body;

    const content = await prisma.discoveredContent.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    const updatedContent = await prisma.discoveredContent.update({
      where: { id: req.params.id },
      data: { isProcessed },
    });

    res.json(updatedContent);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const content = await prisma.discoveredContent.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!content) {
      return res.status(404).json({ error: 'Content not found' });
    }

    await prisma.discoveredContent.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

export default router;