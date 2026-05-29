import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error.util';
import { UpdateProfileDTO } from './profile.schema';

export class ProfileService {
  static async getMe(userId: string, email?: string, role?: string) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email ?? 'unknown@unknown.com',
          role: role ?? 'STUDENT',
          profile: { create: {} },
        },
        include: { profile: true },
      });
      return user;
    }

    if (!user.profile) {
      user = await prisma.user.update({
        where: { id: userId },
        data: {
          profile: {
            create: {},
          },
        },
        include: { profile: true },
      });
    }

    return user;
  }

  static async updateMe(userId: string, data: UpdateProfileDTO, email?: string, role?: string) {
    const { fullName, bio, avatarUrl, phone, educationalLevel, learningGoals } = data;

    let user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          id: userId,
          email: email ?? 'unknown@unknown.com',
          role: role ?? 'STUDENT',
        },
      });
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        profile: {
          upsert: {
            create: { fullName, bio, avatarUrl, phone, educationalLevel, learningGoals },
            update: { fullName, bio, avatarUrl, phone, educationalLevel, learningGoals },
          },
        },
      },
      include: { profile: true },
    });

    return updated;
  }
}
