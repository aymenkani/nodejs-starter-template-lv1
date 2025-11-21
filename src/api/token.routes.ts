import express from 'express';
import { tokenController } from '../controllers/index';
import validate from '../middleware/validate';
import { authValidation } from '../validations/auth.validation';

const router = express.Router();

router.post('/refresh', validate(authValidation.refreshTokens), tokenController.refreshTokens);

export default router;
