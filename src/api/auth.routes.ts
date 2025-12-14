import express from 'express';
import validate from '../middleware/validate';
import { authValidation } from '../validations/auth.validation';
import { authController } from '../controllers';
import passport from 'passport';
import { emailLimiter } from '../middleware/rateLimiter'; // Import authLimiter
import { auth } from '../middleware/auth.middleware';

const router = express.Router();

router.post('/register', validate(authValidation.register), authController.register);

router.post('/login', validate(authValidation.login), authController.login);

router.post('/logout', auth, validate(authValidation.logout), authController.logout);

router.post(
  '/request-password-reset',
  emailLimiter, // Apply the rate limiter
  validate(authValidation.requestPasswordReset),
  authController.requestPasswordReset,
);

router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword,
);

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback,
);

router.get(
  '/verify-reset-token',
  validate(authValidation.verifyResetToken),
  authController.checkResetTokenValidity,
);

export default router;
