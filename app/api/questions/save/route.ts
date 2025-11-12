import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

const QUESTIONS_PATH = path.join(process.cwd(), 'data', 'questions.json');

type Question = Record<string, unknown>;

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const questions: Question[] = Array.isArray(payload)
      ? payload
      : Array.isArray(payload?.questions)
        ? payload.questions
        : [];

    if (!questions.length) {
      return NextResponse.json(
        { message: 'Payload must include a non-empty "questions" array.' },
        { status: 400 }
      );
    }

    await fs.writeFile(QUESTIONS_PATH, JSON.stringify(questions, null, 2) + '\n', 'utf-8');

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error('Failed to save questions:', error);
    return NextResponse.json(
      { message: 'Failed to save questions.' },
      { status: 500 }
    );
  }
}
