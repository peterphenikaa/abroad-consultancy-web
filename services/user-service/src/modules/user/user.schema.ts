import { z } from 'zod';

export const updateUserRoleSchema = z.object({
  role: z.enum(['STUDENT', 'TEACHER', 'ORG_ADMIN', 'CONTENT_CREATOR', 'SUPER_ADMIN']),
});

export const updateUserStatusSchema = z.object({
  status: z.enum(['ACTIVE', 'INACTIVE', 'LOCKED', 'BANNED']),
});

export type UpdateUserRoleDTO = z.infer<typeof updateUserRoleSchema>;
export type UpdateUserStatusDTO = z.infer<typeof updateUserStatusSchema>;
