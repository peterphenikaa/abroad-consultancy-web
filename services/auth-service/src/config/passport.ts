import passport from 'passport';
import { Strategy as GoogleStraegy, Profile, VerifyCallback } from 'passport-google-oauth20';
import { env } from './env';
import { prismaClient } from '../lib/prisma';

passport.use(
  new GoogleStraegy(
    {
      clientID: env.GOOGLE_CLIENT_ID as string,
      clientSecret: env.GOOGLE_CLIENT_SECRET as string,
      callbackURL: env.GOOGLE_CALLBACK_URL as string,
    },
    async (accessToken: string, refreshToken: string, profile: Profile, done: VerifyCallback) => {
      try {
        const email = profile.emails?.[0]?.value;
        if (!email) {
          return done(new Error('No email found in Google profile'), false);
        }

        // 1. find user by email
        let user = await prismaClient.user.findUnique({
          where: { email },
        });

        if (user) {
          // 2. Handle GOOGLE user login lần 2+ khi provider_id thay đổi hoặc acc LOCAL -> link
          if (user.providerId !== profile.id || user.AuthProvider !== 'Google') {
            user = await prismaClient.user.update({
              where: { id: user.id },
              data: {
                AuthProvider: 'Google',
                providerId: profile.id,
                emailVerified: true, // Google emails are verified
              },
            });
          }
        } else {
          // 3. Create new user with Race Condition Guard
          try {
            user = await prismaClient.user.create({
              data: {
                email,
                fullName: profile.displayName,
                AuthProvider: 'Google',
                providerId: profile.id,
                emailVerified: true,
              },
            });
          } catch (createError: any) {
            // Race condition guard: User was created by another concurrent request
            // P2002 = Unique constraint failed on the fields: (`email`)
            if (createError.code === 'P2002') {
              user = await prismaClient.user.update({
                where: { email },
                data: {
                  AuthProvider: 'Google',
                  providerId: profile.id,
                  emailVerified: true,
                },
              });
            } else {
              throw createError;
            }
          }
        }

        return done(null, user as any);
      } catch (error) {
        return done(error as Error, false);
      }
    },
  ),
);

export default passport;
