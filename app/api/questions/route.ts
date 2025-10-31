import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  const dataPath = path.join(process.cwd(), 'data', 'questions.json');

  try {
    const payload = await fs.readFile(dataPath, 'utf-8');
    const questions = JSON.parse(payload);
    return NextResponse.json(questions, {
      headers: {
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=60'
      }
    });
  } catch (error) {
    return NextResponse.json(
      { message: 'Failed to load questions metadata.' },
      { status: 500 }
    );
  }
}
