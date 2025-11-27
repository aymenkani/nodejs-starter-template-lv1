import express from 'express';
import { uploadController } from '../controllers';
import validate from '../middleware/validate';
import * as uploadValidation from '../validations/upload.validation';
import { auth, authorize } from '../middleware/auth.middleware';
import { Role } from '@/generated/prisma';

const router = express.Router();

// All routes in this file are protected
router.use(auth, authorize([Role.USER]));

router.post(
  '/generate-signed-url',
  validate(uploadValidation.generateSignedUrl),
  uploadController.generateSignedUrl,
);

export default router;
