import { createUploadService } from './upload.service';
import { createIngestionService } from './ingestion.service';
import { ingestionQueue } from '../jobs/queue';
import { getConfig } from '../config/config';
import { createAuthService } from './auth.service';
import { createTokenService } from './token.service';
import { createEmailService } from './email.service';
import { createAgentService } from './agent.service';

const config = getConfig(process.env);

export const authService = createAuthService(config);
export const tokenService = createTokenService(config);
export const emailService = createEmailService(config);
export const ingestionService = createIngestionService(ingestionQueue);
export const uploadService = createUploadService(config, ingestionService);
export const agentService = createAgentService(config);

export * from './file.service';
export * from './user.service';
export * from './socket.service';
export * from './admin.service';
export * from './notification.service';
