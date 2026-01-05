import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy, VerifyCallback } from 'passport-google-oauth20';

export type GoogleUserPayload = {
  googleId: string;
  email: string | null;
  name: string | null;
  picture: string | null;
};

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    const clientID = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const callbackURL = process.env.GOOGLE_REDIRECT_URI;

    if (!clientID || !clientSecret || !callbackURL) {
      throw new Error(
        'Missing Google OAuth env vars. Required: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, GOOGLE_REDIRECT_URI',
      );
    }

    super({
      clientID,
      clientSecret,
      callbackURL,
      scope: ['email', 'profile'],
      passReqToCallback: true,
    });
  }

  async validate(
    req: any,
    accessToken: string,
    refreshToken: string,
    profile: Profile,
    done: VerifyCallback,
  ) {
    const email = profile.emails?.[0]?.value ?? null;
    const payload: GoogleUserPayload = {
      googleId: profile.id,
      email,
      name: profile.displayName ?? null,
      picture: profile.photos?.[0]?.value ?? null,
    };

    done(null, payload);
  }
}
