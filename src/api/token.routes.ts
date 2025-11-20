import express from 'express';
import { tokenController } from '../controllers/index';
import validate from '../middleware/validate';
import { authValidation } from '../validations/auth.validation';

const router = express.Router();

/**
 * @swagger
 * /api/v1/token/refresh:
 *   post:
 *     summary: Refresh auth tokens
 *     tags: [Token]
 *     responses:
 *       200:
 *         description: Tokens refreshed successfully
 *       401:
 *         description: Unauthorized
 */
router.post('/refresh', validate(authValidation.refreshTokens), tokenController.refreshTokens);

export default router;
