import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getAllEntries, getChecklistItems } from '@/lib/db/queries';

export async function GET() {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const userId = (session.user as typeof session.user & { id: string }).id;

  const entries  = await getAllEntries(userId);
  const checklist = await getChecklistItems(userId);

  const data = {
    exportedAt: new Date().toISOString(),
    user: { email: session.user.email, name: session.user.name },
    entries,
    checklist,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="six-things-export.json"',
    },
  });
}
