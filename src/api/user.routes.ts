import express from 'express';
import { userController } from '../controllers';
import { auth, authorize } from '../middleware/auth.middleware';
import validate from '../middleware/validate';
import { userValidation } from '../validations/user.validation';
import { Role } from '../generated/prisma';

const router = express.Router();

// All routes in this file are protected
router.use(auth, authorize([Role.USER]));

/**
 * @swagger
 * /api/v1/users/profile:
 *   get:
 *     summary: Get user profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200: {
 *         description: User profile retrieved successfully
 *       }
 *       401: {
 *         description: Unauthorized
 *       }
 */
router.get('/profile', userController.getProfile);

/**
 * @swagger
 * /api/v1/users/profile/email:
 *   put:
 *     summary: Update user's email
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/x-www-form-urlencoded:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *               password:
 *                 type: string
 *                 format: password
 *             minProperties: 1
 *             example:
 *               email: newemail@example.com
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 */
router.put('/profile/email', validate(userValidation.updateEmail), userController.updateEmail);

export default router;
