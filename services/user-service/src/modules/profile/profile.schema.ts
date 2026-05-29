import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z.string().max(255).optional(),
  bio: z.string().optional(),
  avatarUrl: z.string().url().optional().or(z.literal('')),
  phone: z.string().max(20).optional(),
  educationalLevel: z.string().max(100).optional(),
  learningGoals: z.string().optional(),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
