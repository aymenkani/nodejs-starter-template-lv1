import express from 'express';
import { uploadController } from '../controllers';
import validate from '../middleware/validate';
import * as uploadValidation from '../validations/upload.validation';
import { auth, authorize } from '../middleware/auth.middleware';
import { Role } from '@prisma/client';
import { uploadLimiter } from '../middleware/rateLimiter';

const router = express.Router();

// All routes in this file are protected
router.use(auth, authorize([Role.USER, Role.ADMIN]));

router.post(
  '/generate-signed-url',
  uploadLimiter,
  validate(uploadValidation.generateSignedUrl),
  uploadController.generateSignedUrl,
);

router.post(
  '/confirm',
  uploadLimiter,
  // validation middleware if needed
  uploadController.confirmUpload,
);

export default router;
