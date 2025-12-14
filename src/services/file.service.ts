import { Prisma, Role, User } from '@prisma/client';
import { prisma } from '../config/db';

const listFiles = async (user: User, filter: string) => {
  let where: Prisma.FileWhereInput = {};

  // Logic:
  // 'mine': only my files
  // 'public': only public files
  // 'all' (default): my files OR public files

  if (filter === 'mine') {
    where = { userId: user.id };
  } else if (filter === 'public') {
    where = { isPublic: true };
  } else {
    // 'all' or undefined
    where = {
      OR: [{ userId: user.id }, { isPublic: true }],
    };
  }

  const files = await prisma.file.findMany({
    where,
    select: {
      id: true,
      originalName: true,
      mimeType: true,
      status: true,
      isPublic: true,
      createdAt: true,
      fileKey: true,
      user: {
        select: {
          email: true,
          role: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  // Mask Admin Emails
  return files.map((file) => {
    if (file.user.role === Role.ADMIN) {
      return {
        ...file,
        user: {
          ...file.user,
          email: 'Admin',
        },
      };
    }
    return file;
  });
};

export const fileService = {
  listFiles,
};
