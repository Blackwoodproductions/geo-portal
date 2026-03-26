import { NextRequest, NextResponse } from 'next/server';
import { getAuthUser } from '@/lib/auth';
import { unauthorized } from '@/lib/errors';
import { toUserResponse } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  const user = await getAuthUser(request);
  if (!user) return unauthorized();

  return NextResponse.json({ user: toUserResponse(user) });
}
