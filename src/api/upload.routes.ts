import express from 'express';
import { uploadController } from '../controllers';
import validate from '../middleware/validate';
import * as uploadValidation from '../validations/upload.validation';

const router = express.Router();

/**
 * @swagger
 * /api/v1/upload/generate-signed-url:
 *   post:
 *     summary: Generate a signed URL for file upload
 *     tags: [Upload]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               fileName: {
 *                 type: string
 *               }
 *               fileType: {
 *                 type: string
 *               }
 *     responses:
 *       200: {
 *         description: Signed URL generated successfully
 *       }
 *       400: {
 *         description: Bad request
 *       }
 */
router.post(
  '/generate-signed-url',
  validate(uploadValidation.generateSignedUrl),
  uploadController.generateSignedUrl,
);

export default router;
