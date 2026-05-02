import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteAllUserData } from '@/lib/db/queries';

export async function DELETE() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;

  await deleteAllUserData(userId);
  return NextResponse.json({ ok: true });
}
