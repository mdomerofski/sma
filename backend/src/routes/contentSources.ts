import express from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { validate, contentSourceSchema } from '../utils/validation';
import { RSSCrawler } from '../services/rssCrawler';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const sources = await prisma.contentSource.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            discoveredContent: true,
          },
        },
      },
    });

    res.json(sources);
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(contentSourceSchema), async (req, res, next) => {
  try {
    const { name, url, type = 'RSS' } = req.body;

    const source = await prisma.contentSource.create({
      data: {
        name,
        url,
        type,
        userId: req.user!.userId,
      },
    });

    res.status(201).json(source);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const source = await prisma.contentSource.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      include: {
        discoveredContent: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
        _count: {
          select: {
            discoveredContent: true,
          },
        },
      },
    });

    if (!source) {
      return res.status(404).json({ error: 'Content source not found' });
    }

    res.json(source);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', validate(contentSourceSchema), async (req, res, next) => {
  try {
    const { name, url, type, isActive } = req.body;

    const source = await prisma.contentSource.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!source) {
      return res.status(404).json({ error: 'Content source not found' });
    }

    const updatedSource = await prisma.contentSource.update({
      where: { id: req.params.id },
      data: {
        name,
        url,
        type,
        isActive,
      },
    });

    res.json(updatedSource);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const source = await prisma.contentSource.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!source) {
      return res.status(404).json({ error: 'Content source not found' });
    }

    await prisma.contentSource.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.post('/:id/crawl', async (req, res, next) => {
  try {
    const source = await prisma.contentSource.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!source) {
      return res.status(404).json({ error: 'Content source not found' });
    }

    await RSSCrawler.crawlSourceById(req.params.id);

    res.json({ message: 'Crawl initiated successfully' });
  } catch (error) {
    next(error);
  }
});

export default router;