import { prisma } from '../../lib/prisma';
import { ApiError } from '../../utils/api-error.util';

export class UserService {
  static async getUserById(targetUserId: string) {
    const user = await prisma.user.findUnique({
      where: { id: targetUserId },
      include: { profile: true },
    });

    if (!user) {
      throw new ApiError(404, 'User not found', 'USER_NOT_FOUND');
    }

    return user;
  }

  static async listUsers(params: {
    page?: number;
    limit?: number;
    search?: string;
    role?: string;
    status?: string;
  }) {
    const page = params.page || 1;
    const limit = params.limit || 20;
    const skip = (page - 1) * limit;

    const where: any = {};

    if (params.search) {
      where.OR = [
        { email: { contains: params.search, mode: 'insensitive' } },
        { profile: { fullName: { contains: params.search, mode: 'insensitive' } } },
      ];
    }

    where.AND = [];
    if (params.role) where.AND.push({ role: params.role });
    if (params.status) where.AND.push({ status: params.status });

    if (where.AND && where.AND.length === 0) delete where.AND;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        include: { profile: true },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      data: users,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  static async syncUser(data: { id: string; email: string; role?: string; status?: string }) {
    const user = await prisma.user.upsert({
      where: { id: data.id },
      create: {
        id: data.id,
        email: data.email,
        role: data.role || 'STUDENT',
        status: data.status || 'ACTIVE',
        profile: { create: {} },
      },
      update: {
        email: data.email,
        ...(data.role && { role: data.role }),
        ...(data.status && { status: data.status }),
      },
      include: { profile: true },
    });

    return user;
  }
}
