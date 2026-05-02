import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getEntryByDate, deleteEntry } from '@/lib/db/queries';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;
  const { date } = await params;

  const entry = await getEntryByDate(userId, date);
  if (!entry) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json(entry);
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ date: string }> }) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;
  const { date } = await params;

  await deleteEntry(userId, date);
  return NextResponse.json({ ok: true });
}
