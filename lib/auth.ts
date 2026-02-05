import { betterAuth } from "better-auth";
import { Pool } from "pg";

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false,
  },
});

export const auth = betterAuth({
  baseURL: process.env.BETTER_AUTH_URL,
  database: pool,
  emailAndPassword: {
    enabled: true,
    minPasswordLength: 8,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
      prompt: "select_account",
    },
  },
  session: {
    expiresIn: 60 * 60 * 24 * 7,
    updateAge: 60 * 60 * 24,
  },
  user: {
    additionalFields: {
      avatar_url: {
        type: "string",
        required: false,
      },
    },
  },
  trustedOrigins: [
    "http://localhost:3000",
    "http://localhost:3001",
    "https://schedule-movies-app.vercel.app",
    process.env.NEXT_PUBLIC_APP_URL || "",
  ],
  databaseHooks: {
    user: {
      create: {
        after: async (user) => {
          try {
            await pool.query(
              `INSERT INTO profiles (id, email, full_name, avatar_url, updated_at, created_at)
               VALUES ($1, $2, $3, $4, NOW(), NOW())
               ON CONFLICT (id) DO UPDATE SET
                 email = COALESCE($2, profiles.email),
                 full_name = COALESCE($3, profiles.full_name),
                 avatar_url = COALESCE($4, profiles.avatar_url),
                 updated_at = NOW()`,
              [user.id, user.email, user.name, user.image],
            );
          } catch (error) {
            console.error("Error creating profile:", error);
          }
        },
      },
    },
  },
});

export type Session = typeof auth.$Infer.Session;
export type User = typeof auth.$Infer.Session.user;
