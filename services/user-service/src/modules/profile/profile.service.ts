import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error.util';
import { UpdateProfileDTO } from './profile.schema';

export class ProfileService {
  static async getMe(userId: string) {
    let user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
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

  static async updateMe(userId: string, data: UpdateProfileDTO) {
    const { fullName, bio, avatarUrl, phone, educationalLevel, learningGoals } = data;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
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
