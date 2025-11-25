import Google from "next-auth/providers/google";
import type { NextAuthConfig } from "next-auth";

export default {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    })
  ],

  callbacks: {
    async signIn({ user }) {
      // Kall Go-backend for å registrere bruker:
      await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/register_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user.id,
          name: user.name,
          email: user.email
        })
      });

      return true;
    },

    async session({ session, token }) {
      session.user.id = token.sub; // Google user ID
      return session;
    }
  }
} satisfies NextAuthConfig;
