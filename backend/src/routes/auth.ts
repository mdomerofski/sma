import express from 'express';
import { prisma } from '../index';
import { hashPassword, comparePassword } from '../utils/password';
import { generateToken } from '../utils/jwt';
import { validate, loginSchema, registerSchema } from '../utils/validation';
import { LoginRequest, RegisterRequest, AuthResponse } from '../types/auth';

const router = express.Router();

router.post('/register', validate(registerSchema), async (req, res, next) => {
  try {
    const { email, password, name }: RegisterRequest = req.body;

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return res.status(409).json({ error: 'User already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const token = generateToken({ userId: user.id, email: user.email });

    const response: AuthResponse = {
      user,
      token,
    };

    res.status(201).json(response);
  } catch (error) {
    next(error);
  }
});

router.post('/login', validate(loginSchema), async (req, res, next) => {
  try {
    const { email, password }: LoginRequest = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isPasswordValid = await comparePassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = generateToken({ userId: user.id, email: user.email });

    const response: AuthResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      token,
    };

    res.json(response);
  } catch (error) {
    next(error);
  }
});

export default router;