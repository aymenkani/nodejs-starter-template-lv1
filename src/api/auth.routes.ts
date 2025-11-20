import express from 'express';
import validate from '../middleware/validate';
import { authValidation } from '../validations/auth.validation';
import { authController } from '../controllers';
import passport from 'passport';
import { authLimiter } from '../middleware/rateLimiter'; // Import authLimiter
import { auth } from '../middleware/auth.middleware';

const router = express.Router();

/**
 * @swagger
 * /api/v1/auth/register:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/UserCreate'
 *     responses:
 *       201: {
 *         description: User registered successfully
 *       }
 *       400: {
 *         description: Bad request
 *       }
 */
router.post('/register', validate(authValidation.register), authController.register);

/**
 * @swagger
 * /api/v1/auth/login:
 *   post:
 *     summary: Login a user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             $ref: '#/components/schemas/UserLogin'
 *     responses:
 *       200: {
 *         description: User logged in successfully
 *       }
 *       401: {
 *         description: Unauthorized
 *       }
 */
router.post('/login', validate(authValidation.login), authController.login);

/**
 * @swagger
 * /api/v1/auth/logout:
 *   post:
 *     summary: Logout a user (refresh token should be in cookie after succusful login or register)
 *     tags: [Auth]
 *     responses:
 *      204: {
 *        description: User logged out successfully
 *      }
 *     security:
 *      - bearerAuth: []
 */
router.post('/logout', auth, validate(authValidation.logout), authController.logout);

/**
 * @swagger
 * /api/v1/auth/request-password-reset:
 *   post:
 *     summary: Request password reset
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *             example:
 *               email: user@example.com
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Bad request
 */
router.post(
  '/request-password-reset',
  authLimiter, // Apply the rate limiter
  validate(authValidation.requestPasswordReset),
  authController.requestPasswordReset,
);

/**
 * @swagger
 * /api/v1/auth/reset-password:
 *   post:
 *     summary: Reset password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *                 format: password
 *             example:
 *               token: someSecureToken
 *               password: NewSecurePassword123
 *     responses:
 *       200:
 *         description: Password reset successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Invalid or expired token
 */
router.post(
  '/reset-password',
  validate(authValidation.resetPassword),
  authController.resetPassword,
);

/**
 * @swagger
 * /api/v1/auth/google:
 *   get:
 *     summary: Redirect to Google for authentication (refresh token will be saved automaticaly in the browser for the Host localhost:5001 )
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirecting to Google's OAuth 2.0 server.
 */
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

/**
 * @swagger
 * /api/v1/auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: User authenticated successfully. Returns user and tokens.
 *       401:
 *         description: Authentication failed.
 */
router.get(
  '/google/callback',
  passport.authenticate('google', { session: false, failureRedirect: '/login' }),
  authController.googleCallback,
);

/**
 * @swagger
 * /api/v1/auth/verify-reset-token:
 *   get:
 *     summary: Verify password reset token validity
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: token
 *         schema:
 *           type: string
 *         required: true
 *         description: The opaque password reset token
 *     responses:
 *       200:
 *         description: Token is valid
 *       400:
 *         description: Invalid or expired token
 */
router.get(
  '/verify-reset-token',
  validate(authValidation.verifyResetToken),
  authController.checkResetTokenValidity,
);

export default router;
