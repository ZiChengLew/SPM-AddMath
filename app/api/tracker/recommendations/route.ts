import { NextResponse } from 'next/server';
import { TRACKER_DEFAULT_USER_ID } from '@/lib/tracker/config';
import { listRecommendations } from '@/lib/tracker/repository';

export async function GET() {
  const recommendations = await listRecommendations(TRACKER_DEFAULT_USER_ID);
  return NextResponse.json({ recommendations });
}
