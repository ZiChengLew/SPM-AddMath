import { NextResponse } from 'next/server';
import { TRACKER_DEFAULT_USER_ID } from '@/lib/tracker/config';
import { deleteResult, getResultById } from '@/lib/tracker/repository';

type Params = {
  params: {
    id: string;
  };
};

export async function DELETE(_: Request, context: Params) {
  const { id } = context.params;
  const removed = await deleteResult(TRACKER_DEFAULT_USER_ID, id);
  if (!removed) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }
  return NextResponse.json({ success: true });
}

export async function GET(_: Request, context: Params) {
  const { id } = context.params;
  const result = await getResultById(TRACKER_DEFAULT_USER_ID, id);
  if (!result) {
    return NextResponse.json({ error: 'Result not found' }, { status: 404 });
  }
  return NextResponse.json({ result });
}
