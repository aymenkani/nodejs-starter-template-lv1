import { Router } from 'express';
import { adminController } from '../controllers/admin.controller';
import { auth, authorize } from '../middleware/auth.middleware';
import validate from '../middleware/validate';
import { adminValidation } from '../validations/admin.validation';
import { notificationValidation } from '../validations/notification.validation';
import { Role } from '../generated/prisma';

const router = Router();

router.use(auth, authorize([Role.ADMIN]));

/**
 * @swagger
 * /api/v1/admin/users:
 *   get:
 *     summary: Get all users
 *     description: Retrieve a list of all users. Requires admin access.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 count:
 *                   type: integer
 *                   example: 1
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/User'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 */
router.get('/users', adminController.getAllUsers);
/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   put:
 *     summary: Update a user by ID
 *     description: Update an existing user's information. Requires admin access.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: User's email address
 *                 example: new.email@example.com
 *               username:
 *                 type: string
 *                 description: User's username
 *                 example: newusername
 *               role:
 *                 type: string
 *                 enum: [USER, ADMIN]
 *                 description: User's role (USER or ADMIN)
 *                 example: USER
 *               password:
 *                 type: string
 *                 format: password
 *                 minLength: 8
 *                 pattern: '^(?=.*[A-Za-z])(?=.*\d).*$'
 *                 description: User's new password (min 8 characters, at least one letter and one number)
 *                 example: NewPassword123
 *             example:
 *               email: new.email@example.com
 *               username: newusername
 *               role: USER
 *               password: NewPassword123
 *     responses:
 *       200:
 *         description: User updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 data:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         $ref: '#/components/responses/BadRequest'
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.put('/users/:userId', validate(adminValidation.updateUser), adminController.updateUser);
/**
 * @swagger
 * /api/v1/admin/users/{userId}:
 *   delete:
 *     summary: Delete a user by ID
 *     description: Delete an existing user. Requires admin access.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         schema:
 *           type: string
 *           format: uuid
 *         required: true
 *         description: ID of the user to delete
 *     responses:
 *       204:
 *         description: User deleted successfully. No content is returned.
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       404:
 *         $ref: '#/components/responses/NotFound'
 */
router.delete('/users/:userId', validate(adminValidation.deleteUser), adminController.deleteUser);
/**
 * @swagger
 * /api/v1/admin/notifications:
 *   post:
 *     summary: Send notification to all users
 *     description: Sends a notification message to all registered users. Requires admin access.
 *     tags:
 *       - Admin
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               message:
 *                 type: string
 *                 description: The notification message to send
 *                 minLength: 1
 *                 example: "Important update for all users!"
 *     responses:
 *       200:
 *         description: Notification sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: "Notification sent to all users."
 *       401:
 *         $ref: '#/components/responses/Unauthorized'
 *       403:
 *         $ref: '#/components/responses/Forbidden'
 *       500:
 *         description: Internal server error
 */
router.post(
  '/notifications',
  validate(notificationValidation.sendNotification),
  adminController.sendNotificationToAll,
);

export const adminRoutes = router;
