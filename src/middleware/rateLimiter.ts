import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per 15 minutes per IP
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
});

export { authLimiter };
