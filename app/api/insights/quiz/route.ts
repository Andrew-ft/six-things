import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { getGentleFollowUp } from '@/lib/ai';

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (body.action === 'followup') {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const question = await getGentleFollowUp(body.items ?? []);
    return NextResponse.json({ question });
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
}
