import express from 'express';
import { uploadController } from '../controllers';
import validate from '../middleware/validate';
import * as uploadValidation from '../validations/upload.validation';

const router = express.Router();

router.post(
  '/generate-signed-url',
  validate(uploadValidation.generateSignedUrl),
  uploadController.generateSignedUrl,
);

export default router;
