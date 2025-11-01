// src/services/googleAuth.ts
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export interface GoogleProfile {
  sub: string; // Google user ID
  email: string;
  name: string;
  picture?: string;
  email_verified?: boolean;
}

/**
 * Verify Google ID token and extract user profile
 * @param idToken - The ID token from Google
 * @returns Google user profile
 */
export async function verifyGoogleIdToken(idToken: string): Promise<GoogleProfile> {
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    if (!payload) {
      throw new Error('No payload in ID token');
    }

    // Verify issuer
    const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
    if (!payload.iss || !validIssuers.includes(payload.iss)) {
      throw new Error(`Invalid issuer: ${payload.iss}`);
    }

    // Verify audience
    if (payload.aud !== process.env.GOOGLE_CLIENT_ID) {
      throw new Error('Invalid audience');
    }

    // Verify expiration
    const now = Math.floor(Date.now() / 1000);
    if (!payload.exp || payload.exp < now) {
      throw new Error('Token expired');
    }

    // Verify issued at time
    if (!payload.iat || payload.iat > now) {
      throw new Error('Invalid issued at time');
    }

    return {
      sub: payload.sub!,
      email: payload.email!,
      name: payload.name || payload.email!.split('@')[0],
      picture: payload.picture,
      email_verified: payload.email_verified,
    };
  } catch (error) {
    console.error('Error verifying Google ID token:', error);
    throw new Error('Invalid Google ID token');
  }
}

/**
 * Exchange authorization code for tokens
 * Note: This requires GOOGLE_CLIENT_SECRET for the Authorization Code Flow
 * If you only use ID Token flow (Google One Tap), you don't need this
 * @param code - Authorization code from Google
 * @returns Google user profile
 */
export async function exchangeCodeForTokens(code: string): Promise<GoogleProfile> {
  try {
    if (!process.env.GOOGLE_CLIENT_SECRET) {
      throw new Error('GOOGLE_CLIENT_SECRET is required for Authorization Code Flow');
    }

    // Create a new client with secret for token exchange
    const clientWithSecret = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.BACKEND_URL}/api/auth/google/callback`
    );

    const { tokens } = await clientWithSecret.getToken(code);
    
    if (!tokens.id_token) {
      throw new Error('No ID token received from Google');
    }

    // Verify and extract profile from the ID token
    return await verifyGoogleIdToken(tokens.id_token);
  } catch (error) {
    console.error('Error exchanging code for tokens:', error);
    throw new Error('Failed to exchange authorization code');
  }
}

/**
 * Generate Google OAuth authorization URL
 * Note: This requires GOOGLE_CLIENT_SECRET for the Authorization Code Flow
 * If you only use ID Token flow (Google One Tap), you don't need this
 * @param state - Anti-CSRF state parameter
 * @returns Authorization URL
 */
export function getGoogleAuthUrl(state: string): string {
  if (!process.env.GOOGLE_CLIENT_SECRET) {
    throw new Error('GOOGLE_CLIENT_SECRET is required for Authorization Code Flow');
  }

  const clientWithSecret = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.BACKEND_URL}/api/auth/google/callback`
  );

  const scopes = [
    'openid',
    'https://www.googleapis.com/auth/userinfo.email',
    'https://www.googleapis.com/auth/userinfo.profile',
  ];

  return clientWithSecret.generateAuthUrl({
    access_type: 'offline',
    scope: scopes,
    state,
    prompt: 'consent',
  });
}
