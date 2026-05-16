import z from 'zod';

export const updateProfileSchema = z.object({
  // user table
  fullName: z
    .string()
    .min(2, 'Full name must be at least 2 characters')
    .max(100, 'Full name must be at most 100 characters')
    .optional(),

  // UserProfile table
  bio: z.string().max(2000, 'Bio must be at most 2000 characters').optional(),

  avatarUrl: z.url('Invalid URL format for avatar').optional(),

  educationalLevel: z
    .string()
    .max(100, 'Education level must be at most 100 characters')
    .optional(),

  learningGoals: z.string().optional(),
});

export type UpdateProfileDTO = z.infer<typeof updateProfileSchema>;
