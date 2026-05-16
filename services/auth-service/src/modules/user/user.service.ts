import { User } from '@prisma/client';
import { prismaClient } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error.util';
import { UpdateProfileDTO } from './user.schema';

export class UserService {
  /**
   * Utility: Remove sensitive fields from user object before sending to client
   * Technique: "Rest parameters" to exclude fields like password, createdAt, updatedAt
   * Only keep the safe fields that can be sent to the client
   */
  private static excludeSensitiveData(user: User) {
    const { passwordHash, phoneHash, ...safeUser } = user;
    return safeUser;
  }

  /**
   * [PROFILE-1] Take infomation of logged user
   * @param userId ID of the user (fron jwt token)
   * @returns User object without sensitive fields
   */
  static async getMe(userId: string) {
    const user = await prismaClient.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return this.excludeSensitiveData(user);
  }

  /**
   * [PROFILE-2] Update profile of logged user
   * @param userId ID of the user (from jwt token)
   * @param data UpdateProfileDTO containing fields to update
   * @returns Updated user object without sensitive fields
   */
  static async updateMe(userId: string, data: UpdateProfileDTO) {
    const { fullName, bio, avatarUrl, educationalLevel, learningGoals } = data;

    // Upsert for 1-to-1 relation
    const updatedUser = await prismaClient.user.update({
      where: { id: userId },
      data: {
        // 1. Update user table
        // only update fullName if it's provided in the request
        ...(fullName && { fullName }),

        // 2. Upsert user profile (if exists, update; if not, create)
        userProfile: {
          upsert: {
            create: { bio, avatarUrl, educationalLevel, learningGoals },
            update: { bio, avatarUrl, educationalLevel, learningGoals },
          },
        },
      },
      // include: also return the user profile data in the response
      include: { userProfile: true },
    });

    return this.excludeSensitiveData(updatedUser);
  }

  /**
   * [PROFILE-3] Take any user information by user id (for admin use)
   * @param userId ID of the user to retrieve
   * @returns User object without sensitive fields
   */
  static async getUserById(targetUserId: string) {
    const user = await prismaClient.user.findUnique({
      where: { id: targetUserId },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return this.excludeSensitiveData(user);
  }
}
