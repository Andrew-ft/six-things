import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { deleteChecklistItem } from '@/lib/db/queries';

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;
  const { id } = await params;

  await deleteChecklistItem(userId, id);
  return NextResponse.json({ ok: true });
}
