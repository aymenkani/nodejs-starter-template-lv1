import { createUploadService } from './upload.service';
import { getConfig } from '../config/config';
import { createAuthService } from './auth.service';
import { createTokenService } from './token.service';
import { createEmailService } from './email.service';

const config = getConfig(process.env);

export const uploadService = createUploadService(config);
export const authService = createAuthService(config);
export const tokenService = createTokenService(config);
export const emailService = createEmailService(config);

export * from './user.service';
export * from './socket.service';
export * from './admin.service';
export * from './notification.service';
// export * from './upload.service'; // Replaced by instance export
export * from './ingestion.service';
