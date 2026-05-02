import NextAuth from 'next-auth';
import Google from 'next-auth/providers/google';
import { getUserByGoogleId, getUserByEmail, createUser } from './db/queries';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  secret: process.env.AUTH_SECRET,
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider !== 'google') return false;
      if (!user.email) return false;

      try {
        let dbUser = await getUserByGoogleId(account.providerAccountId);

        if (!dbUser) {
          dbUser = await getUserByEmail(user.email);
        }

        if (!dbUser) {
          dbUser = await createUser({
            email:     user.email,
            name:      user.name ?? user.email.split('@')[0],
            googleId:  account.providerAccountId,
            avatarUrl: user.image ?? null,
          });
        }

        return true;
      } catch (err) {
        console.error('SignIn error:', err);
        return false;
      }
    },

    async session({ session }) {
      if (session.user?.email) {
        const dbUser = await getUserByEmail(session.user.email);
        if (dbUser) {
          (session.user as typeof session.user & { id: string }).id = dbUser.id;
        }
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/sign-in',
    error:  '/auth/sign-in',
  },
});
