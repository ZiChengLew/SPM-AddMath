import { NextResponse } from 'next/server';
import { TRACKER_DEFAULT_USER_ID } from '@/lib/tracker/config';
import { listResults, upsertResult } from '@/lib/tracker/repository';
import type { ResultUpsertPayload } from '@/lib/tracker/types';

export async function GET() {
  const results = await listResults(TRACKER_DEFAULT_USER_ID);
  return NextResponse.json({ results });
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Partial<ResultUpsertPayload>;
    const payload = normalizePayload(body);
    const record = await upsertResult(payload);
    return NextResponse.json({ result: record });
  } catch (error) {
    console.error('[tracker:POST]', error);
    return NextResponse.json({ error: (error as Error).message }, { status: 400 });
  }
}

function normalizePayload(payload: Partial<ResultUpsertPayload>): ResultUpsertPayload {
  if (!payload.state || !payload.paper_no || typeof payload.year !== 'number') {
    throw new Error('Missing required fields: state, year, paper_no');
  }
  if (!payload.date_done) {
    throw new Error('Missing required field: date_done');
  }
  if (!payload.by_question || payload.by_question.length === 0) {
    throw new Error('by_question array is required');
  }

  return {
    user_id: payload.user_id ?? TRACKER_DEFAULT_USER_ID,
    state: payload.state,
    year: payload.year,
    paper_no: payload.paper_no,
    date_done: payload.date_done,
    time_spent_min: payload.time_spent_min ?? null,
    notes: payload.notes ?? null,
    by_question: payload.by_question.map((question) => ({
      q_no: question.q_no,
      section: question.section,
      max_score: question.max_score,
      score:
        typeof question.score === 'number'
          ? Math.max(0, Math.min(question.max_score, question.score))
          : null,
      chapter: question.chapter ?? null,
      subtopic: question.subtopic ?? null,
      cognitive: question.cognitive ?? null
    }))
  };
}
