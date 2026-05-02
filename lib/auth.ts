import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import bcrypt from 'bcryptjs';
import { getUserByEmail, createUser } from './db/queries';
import { db } from './db';
import { users } from './db/schema';
import { eq } from 'drizzle-orm';

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Credentials({
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
        name:     { label: 'Name',     type: 'text' },
        mode:     { label: 'Mode',     type: 'text' }, // 'signin' | 'signup'
      },
      async authorize(credentials) {
        const email    = (credentials?.email    as string | undefined)?.toLowerCase().trim();
        const password = credentials?.password  as string | undefined;
        const name     = credentials?.name      as string | undefined;
        const mode     = credentials?.mode      as string | undefined;

        if (!email || !password) return null;
        if (password.length < 6) return null;

        const existing = await getUserByEmail(email);

        if (mode === 'signup') {
          if (existing) return null; // account already exists
          const hash = await bcrypt.hash(password, 12);
          const user = await createUser({
            email,
            name: name?.trim() || email.split('@')[0],
            passwordHash: hash,
          });
          return { id: user.id, email: user.email, name: user.name };
        }

        // sign-in
        if (!existing || !existing.passwordHash) return null;
        const ok = await bcrypt.compare(password, existing.passwordHash);
        if (!ok) return null;
        return { id: existing.id, email: existing.email, name: existing.name };
      },
    }),
  ],
  secret: process.env.AUTH_SECRET,
  session: { strategy: 'jwt' },
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (token?.id) {
        (session.user as typeof session.user & { id: string }).id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/auth/sign-in',
    error:  '/auth/sign-in',
  },
});
