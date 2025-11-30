import { PrismaClient, Role } from '@prisma/client';
import bcrypt from 'bcryptjs';
import { getConfig } from '../src/config/config';

const prisma = new PrismaClient();
const config = getConfig(process.env);

async function main() {
  // Use Environment variables with fallbacks for local dev
  const adminEmail = config.admin.email || 'admin@example.com';
  const adminPassword = config.admin.password || 'adminpassword123';


  // Safety Check: Warn if using default password in production
  if (process.env.NODE_ENV === 'production' && adminPassword === 'adminpassword123') {
    console.warn('⚠️  WARNING: You are seeding the default "adminpassword123" in production. Please set ADMIN_PASSWORD env var.');
  }

  const existingAdmin = await prisma.user.findUnique({
    where: { email: adminEmail },
  });

  if (!existingAdmin) {
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    await prisma.user.create({
      data: {
        username: 'admin',
        email: adminEmail,
        password: hashedPassword,
        role: Role.ADMIN,
        passwordHistory: [hashedPassword],
      },
    });
    
    console.log(`Admin user (${adminEmail}) created successfully!`);
  } else {
    console.log('Admin user already exists.');
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
