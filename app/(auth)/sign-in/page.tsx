import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import SignInClient from './sign-in-client';

export default async function SignInPage() {
  const session = await auth();
  if (session?.user) redirect('/');
  return <SignInClient />;
}
