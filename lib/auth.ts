import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import { db } from "./db";

export const auth = betterAuth({
    database: prismaAdapter(db, {
        provider: "sqlite",
    }),
    emailAndPassword: {
        enabled: true,
    },
    trustedOrigins: [
        "http://localhost:3000",
        "http://172.22.124.119:3000",
        process.env.NEXT_PUBLIC_APP_URL || "",
        process.env.BETTER_AUTH_URL || ""
    ].filter(Boolean),
    advanced: {
        trustedProxyHeaders: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7, // Session expires after 7 days
        updateAge: 60 * 60 * 24,     // Refresh session expiration if active within 24 hours (sliding window)
    }
});
