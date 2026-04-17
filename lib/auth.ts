import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { getDb } from "./db";

function createAuth() {
  return betterAuth({
    baseURL: process.env.BETTER_AUTH_URL, // ✅ REQUIRED

    trustProxy: true, // 🔥 CRITICAL for Render

    database: prismaAdapter(getDb(), {
      provider: "postgresql",
    }),

    emailAndPassword: {
      enabled: true,
    },

    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID as string,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      },
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
    },

    cookies: {
      session_token: {
        attributes: {
          httpOnly: true,
          secure: true,
          sameSite: "lax",
          path: "/",
        },
      },
    },
  });
}

type AuthInstance = ReturnType<typeof createAuth>;
type AuthApi = AuthInstance["api"];

let authInstance: AuthInstance | undefined;

export function getAuth(): AuthInstance {
  if (!authInstance) {
    authInstance = createAuth();
  }

  return authInstance;
}

export const auth = {
  get api(): AuthApi {
    return getAuth().api;
  },
};
