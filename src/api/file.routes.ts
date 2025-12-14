import express from 'express';
import { fileController } from '../controllers';
import { auth } from '../middleware/auth.middleware';
import validate from '../middleware/validate';
import { listFiles } from '../validations/file.validation';

const router = express.Router();

router.get('/', auth, validate(listFiles), fileController.listFiles);

export default router;
