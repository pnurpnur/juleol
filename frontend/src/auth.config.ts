import Google from "next-auth/providers/google";

const authConfig = {
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],

  callbacks: {
    // 1️⃣ Når brukeren logger inn
    async signIn({ user }) {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_BASE_URL}/register_user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          name: user.name,
        }),
      });

      const dbUser = await response.json();
      if (!dbUser?.id) return false;

      // ⚡ Legg intern ID midlertidig i user-objektet
      user.internalId = dbUser.id;
      return true;
    },

    // 2️⃣ Lagre intern ID i token
    async jwt({ token, user }) {
      if (user?.internalId) {
        token.internalId = user.internalId;
      }
      return token;
    },

    // 3️⃣ Sett session.user.id til intern ID
    async session({ session, token }) {
      session.user.id = token.internalId ?? null;
      return session;
    },
  },

  pages: {
    signIn: "/auth/signin",
  },
};

export default authConfig;
