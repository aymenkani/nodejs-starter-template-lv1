import { Strategy as JwtStrategy, ExtractJwt } from 'passport-jwt';
import { User } from '@prisma/client';
import passport from 'passport';
import { Strategy as GoogleStrategy, Profile } from 'passport-google-oauth20';
import { prisma } from './db';
import { getConfig } from './config';
import { AuthProvider } from '@prisma/client';

const config = getConfig(process.env);

// JWT strategy for authentication
const jwtStrategy = new JwtStrategy(
  {
    jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
    secretOrKey: config.jwt.secret,
  },
  async (payload: { sub: string }, done) => {
    try {
      const user: User | null = await prisma.user.findUnique({ where: { id: payload.sub } });
      if (!user) {
        return done(null, false);
      }
      return done(null, user);
    } catch (error) {
      return done(error, false);
    }
  },
);

const googleStrategy = new GoogleStrategy(
  {
    clientID: config.google.clientId,
    clientSecret: config.google.clientSecret,
    callbackURL: '/api/v1/auth/google/callback',
    scope: ['profile', 'email'],
  },
  async (
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: (error: any, user?: any, info?: any) => void,
  ) => {
    try {
      const email = profile.emails?.[0]?.value;
      if (!email) {
        return done(new Error('Google account must have an email'), null);
      }

      let user = await prisma.user.findUnique({ where: { email } });

      if (user) {
        // If user exists, ensure their googleId is updated
        if (!user.googleId) {
          user = await prisma.user.update({
            where: { id: user.id },
            data: { googleId: profile.id, provider: AuthProvider.GOOGLE },
          });
        }
        return done(null, user);
      } else {
        // If user does not exist, create a new one
        const newUser = await prisma.user.create({
          data: {
            googleId: profile.id,
            email,
            username: profile.displayName,
            provider: AuthProvider.GOOGLE,
          },
        });
        return done(null, newUser);
      }
    } catch (error) {
      return done(error, null);
    }
  },
);

passport.use(jwtStrategy);
passport.use(googleStrategy);

export default passport;
