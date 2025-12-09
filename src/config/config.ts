import { z } from 'zod';

const envVarsSchema = z
  .object({
    NODE_ENV: z.enum(['production', 'development', 'test']),
    PORT: z.coerce.number().default(3000),
    ADMIN_EMAIL: z.email('Admin email must be a valid email address'),
    ADMIN_PASSWORD: z
      .string()
      .min(8, { message: 'Password must be at least 8 characters' })
      .regex(/^(?=.*[A-Za-z])(?=.*\d).*$/, {
        message: 'Password must contain at least one letter and one number',
      }),
    JWT_SECRET: z.string().min(1, 'JWT secret key is required'),
    JWT_ACCESS_EXPIRATION_MINUTES: z.coerce.number().default(30),
    JWT_REFRESH_EXPIRATION_DAYS: z.coerce.number().default(30),
    JWT_RESET_PASSWORD_SECRET: z.string().min(1, 'JWT reset password secret key is required'),
    JWT_RESET_PASSWORD_EXPIRATION_MINUTES: z.coerce.number().default(10),
    JWT_VERIFY_EMAIL_EXPIRATION_MINUTES: z.coerce.number().default(10),
    AWS_ACCESS_KEY_ID: z.string().min(1, 'AWS access key is required'),
    AWS_SECRET_ACCESS_KEY: z.string().min(1, 'AWS secret key is required'),
    AWS_REGION: z.string().min(1, 'AWS region is required'),
    AWS_S3_BUCKET: z.string().min(1, 'AWS S3 bucket is required'),
    GOOGLE_CLIENT_ID: z.string().min(1, 'Google client ID is required'),
    GOOGLE_CLIENT_SECRET: z.string().min(1, 'Google client secret is required'),
    CLIENT_URL: z.url('Client URL must be a valid URL'),
    EMAIL_PROVIDER: z.enum(['NODEMAILER', 'SENDGRID']),
    EMAIL_FROM: z.email('Email FROM must be a valid email address'),
    SMTP_HOST: z.string().optional(),
    SMTP_PORT: z.coerce.number().optional(),
    SMTP_USER: z.string().optional(),
    SMTP_PASS: z.string().optional(),
    SENDGRID_API_KEY: z.string().optional(),
    REDIS_HOST: z.string().min(1, 'Redis host is required'),
    REDIS_PORT: z.coerce.number().min(1, 'Redis port is required'),
    SOCKET_CORS_ORIGIN: z.string().default('http://localhost:3000'),
    AWS_ENDPOINT: z.string().min(1, 'AWS endpoint is required'),
  })
  .loose();

export type Config = {
  env: 'production' | 'development' | 'test';
  port: number;
  admin: {
    email: string;
    password: string;
  };
  jwt: {
    secret: string;
    accessExpirationMinutes: number;
    refreshExpirationDays: number;
    resetPasswordSecret: string;
    resetPasswordExpirationMinutes: number; // This line was missing
    verifyEmailExpirationMinutes: number;
  };
  aws: {
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    s3: {
      bucket: string;
    };
    endpoint: string;
  };
  google: {
    clientId: string;
    clientSecret: string;
  };
  clientUrl: string;
  email: {
    provider: 'NODEMAILER' | 'SENDGRID';
    from: string;
    smtp: {
      host?: string;
      port?: number;
      secure: boolean;
      auth: {
        user?: string;
        pass?: string;
      };
    };
    sendgridApiKey?: string;
  };
  redis: {
    host: string;
    port: number;
  };
  socket: {
    cors: {
      origin: string[];
    };
  };
};

export function getConfig(processEnv: NodeJS.ProcessEnv): Config {
  let envVars;
  try {
    envVars = envVarsSchema.parse(processEnv);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new Error(`Config validation error: ${error.message}`);
    }
    throw new Error(`Config validation error: ${error}`);
  }

  return {
    env: envVars.NODE_ENV,
    port: envVars.PORT,
    admin: {
      email: envVars.ADMIN_EMAIL,
      password: envVars.ADMIN_PASSWORD,
    },
    jwt: {
      secret: envVars.JWT_SECRET,
      accessExpirationMinutes: envVars.JWT_ACCESS_EXPIRATION_MINUTES,
      refreshExpirationDays: envVars.JWT_REFRESH_EXPIRATION_DAYS,
      resetPasswordSecret: envVars.JWT_RESET_PASSWORD_SECRET,
      resetPasswordExpirationMinutes: envVars.JWT_RESET_PASSWORD_EXPIRATION_MINUTES, // This line was missing
      verifyEmailExpirationMinutes: envVars.JWT_VERIFY_EMAIL_EXPIRATION_MINUTES,
    },
    aws: {
      accessKeyId: envVars.AWS_ACCESS_KEY_ID,
      secretAccessKey: envVars.AWS_SECRET_ACCESS_KEY,
      region: envVars.AWS_REGION,
      s3: {
        bucket: envVars.AWS_S3_BUCKET,
      },
      endpoint: envVars.AWS_ENDPOINT,
    },
    google: {
      clientId: envVars.GOOGLE_CLIENT_ID,
      clientSecret: envVars.GOOGLE_CLIENT_SECRET,
    },
    clientUrl: envVars.CLIENT_URL,
    email: {
      provider: envVars.EMAIL_PROVIDER,
      from: envVars.EMAIL_FROM,
      smtp: {
        host: envVars.SMTP_HOST,
        port: envVars.SMTP_PORT,
        secure: envVars.SMTP_PORT === 465, // Use secure for port 465
        auth: {
          user: envVars.SMTP_USER,
          pass: envVars.SMTP_PASS,
        },
      },
      sendgridApiKey: envVars.SENDGRID_API_KEY,
    },
    redis: {
      host: envVars.REDIS_HOST,
      port: envVars.REDIS_PORT,
    },
    socket: {
      cors: {
        origin: envVars.SOCKET_CORS_ORIGIN.split(','),
      },
    },
  };
}
