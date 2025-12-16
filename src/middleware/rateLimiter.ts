import rateLimit from 'express-rate-limit';

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Max 5 requests per 15 minutes per IP
  message: 'Too many authentication attempts from this IP, please try again after 15 minutes',
  standardHeaders: true, // ALLWAYS KEEP THIS AS TRUE
  legacyHeaders: false, // ALLWAYS KEEP THIS AS FALSE
});

const chatLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 5, // Max 5 requests per 24 hours per IP
  message: 'Daily chat limit reached. You can only send 5 messages per day.',
  standardHeaders: true, // ALLWAYS KEEP THIS AS TRUE
  legacyHeaders: false, // ALLWAYS KEEP THIS AS FALSE
  skip: (req) => {
    return req.user?.email === 'aymenkani554@gmail.com';
  },
});

const uploadLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 3, // Max 2 requests per 24 hours per IP
  message: 'Daily upload limit reached. You can only upload 3 files per day.',
  standardHeaders: true, // ALLWAYS KEEP THIS AS TRUE
  legacyHeaders: false, // ALLWAYS KEEP THIS AS FALSE
  skip: (req) => {
    return req.user?.email === 'aymenkani554@gmail.com';
  },
});

const emailLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, //  24 hours
  max: 1, // Max 1 requests per 24 hours per IP
  message: 'Daily email limit reached. You can only send 1 email per day.',
  standardHeaders: true, // ALLWAYS KEEP THIS AS TRUE
  legacyHeaders: false, // ALLWAYS KEEP THIS AS FALSE
  skip: (req) => {
    return req.user?.email === 'aymenkani554@gmail.com';
  },
});

export { authLimiter, chatLimiter, uploadLimiter, emailLimiter };
