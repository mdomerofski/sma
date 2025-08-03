import express from 'express';
import { prisma } from '../index';
import { authenticateToken } from '../middleware/auth';
import { validate, socialAccountSchema } from '../utils/validation';
import { TwitterService } from '../services/twitterService';

const router = express.Router();

router.use(authenticateToken);

router.get('/', async (req, res, next) => {
  try {
    const accounts = await prisma.socialAccount.findMany({
      where: { userId: req.user!.userId },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        platform: true,
        accountName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(accounts);
  } catch (error) {
    next(error);
  }
});

router.post('/', validate(socialAccountSchema), async (req, res, next) => {
  try {
    const { platform, accountName, accessToken, accessSecret } = req.body;

    if (platform === 'TWITTER' && accessToken && accessSecret) {
      const verification = await TwitterService.verifyCredentials(accessToken, accessSecret);
      if (!verification.valid) {
        return res.status(400).json({ error: 'Invalid Twitter credentials' });
      }
    }

    const existingAccount = await prisma.socialAccount.findFirst({
      where: {
        userId: req.user!.userId,
        platform,
      },
    });

    if (existingAccount) {
      return res.status(409).json({ error: 'Account for this platform already exists' });
    }

    const account = await prisma.socialAccount.create({
      data: {
        platform,
        accountName,
        accessToken,
        accessSecret,
        userId: req.user!.userId,
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.status(201).json(account);
  } catch (error) {
    next(error);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    res.json(account);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const { accountName, isActive, accessToken, accessSecret } = req.body;

    const account = await prisma.socialAccount.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    if (account.platform === 'TWITTER' && accessToken && accessSecret) {
      const verification = await TwitterService.verifyCredentials(accessToken, accessSecret);
      if (!verification.valid) {
        return res.status(400).json({ error: 'Invalid Twitter credentials' });
      }
    }

    const updatedAccount = await prisma.socialAccount.update({
      where: { id: req.params.id },
      data: {
        accountName,
        isActive,
        accessToken,
        accessSecret,
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(updatedAccount);
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const account = await prisma.socialAccount.findFirst({
      where: {
        id: req.params.id,
        userId: req.user!.userId,
      },
    });

    if (!account) {
      return res.status(404).json({ error: 'Social account not found' });
    }

    await prisma.socialAccount.delete({
      where: { id: req.params.id },
    });

    res.status(204).send();
  } catch (error) {
    next(error);
  }
});

router.get('/twitter/auth-url', async (req, res, next) => {
  try {
    const authData = await TwitterService.getAuthUrl();
    res.json(authData);
  } catch (error) {
    next(error);
  }
});

router.post('/twitter/callback', async (req, res, next) => {
  try {
    const { oauth_token, oauth_verifier, oauth_token_secret } = req.body;

    if (!oauth_token || !oauth_verifier || !oauth_token_secret) {
      return res.status(400).json({ error: 'Missing OAuth parameters' });
    }

    const result = await TwitterService.handleCallback(oauth_token, oauth_verifier, oauth_token_secret);

    const account = await prisma.socialAccount.upsert({
      where: {
        userId_platform: {
          userId: req.user!.userId,
          platform: 'TWITTER',
        },
      },
      update: {
        accountName: result.user.username,
        accessToken: result.accessToken,
        accessSecret: result.accessSecret,
        isActive: true,
      },
      create: {
        platform: 'TWITTER',
        accountName: result.user.username,
        accessToken: result.accessToken,
        accessSecret: result.accessSecret,
        userId: req.user!.userId,
      },
      select: {
        id: true,
        platform: true,
        accountName: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    res.json(account);
  } catch (error) {
    next(error);
  }
});

export default router;