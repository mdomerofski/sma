import Joi from 'joi';

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
});

export const registerSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().min(6).required(),
  name: Joi.string().optional(),
});

export const contentSourceSchema = Joi.object({
  name: Joi.string().required(),
  url: Joi.string().uri().required(),
  type: Joi.string().valid('RSS', 'API').default('RSS'),
});

export const socialAccountSchema = Joi.object({
  platform: Joi.string().valid('TWITTER', 'FACEBOOK', 'LINKEDIN', 'INSTAGRAM').required(),
  accountName: Joi.string().required(),
  accessToken: Joi.string().optional(),
  accessSecret: Joi.string().optional(),
});

export const generatedPostSchema = Joi.object({
  content: Joi.string().required(),
  platform: Joi.string().valid('TWITTER', 'FACEBOOK', 'LINKEDIN', 'INSTAGRAM').required(),
  discoveredContentId: Joi.string().required(),
  socialAccountId: Joi.string().required(),
  scheduledAt: Joi.date().optional(),
});

export const validate = (schema: Joi.ObjectSchema) => {
  return (req: any, res: any, next: any) => {
    const { error } = schema.validate(req.body);
    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details.map(detail => detail.message),
      });
    }
    next();
  };
};