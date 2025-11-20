import { createAuthService } from './auth.service';
import { createTokenService } from './token.service';
import { userService } from './user.service';
import { adminService } from './admin.service'; // Added adminService import
import { createUploadService } from './upload.service';
import { getConfig } from '../config/config';
import { socketService } from './socket.service';
import { notificationService } from './notification.service';

const config = getConfig(process.env);

const authService = createAuthService(config);
const tokenService = createTokenService(config);
const uploadService = createUploadService(config);

export {
  authService,
  tokenService,
  userService,
  adminService, // Added adminService to exports
  uploadService,
  socketService,
  notificationService,
};
