import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

type QuestionList = {
  id: string;
  name: string;
  items: string[];
  createdAt: string;
  updatedAt: string;
};

const DATA_PATH = path.join(process.cwd(), 'data', 'lists.json');

async function readLists(): Promise<QuestionList[]> {
  try {
    const data = await fs.readFile(DATA_PATH, 'utf8');
    return JSON.parse(data);
  } catch (error: any) {
    if (error?.code === 'ENOENT') {
      await writeLists([]);
      return [];
    }
    throw error;
  }
}

async function writeLists(lists: QuestionList[]) {
  await fs.writeFile(DATA_PATH, JSON.stringify(lists, null, 2), 'utf8');
}

function normalizeItems(items: unknown): string[] {
  if (!Array.isArray(items)) {
    return [];
  }
  return Array.from(new Set(items.filter((item): item is string => typeof item === 'string')));
}

export async function GET() {
  const lists = await readLists();
  return NextResponse.json(lists);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const lists = await readLists();

  const sourceId = typeof body.sourceId === 'string' ? body.sourceId : null;
  const name = typeof body.name === 'string' ? body.name.trim() : '';
  const items = normalizeItems(body.items);
  const now = new Date().toISOString();

  if (sourceId) {
    const source = lists.find((list) => list.id === sourceId);
    if (!source) {
      return NextResponse.json({ error: 'Source list not found.' }, { status: 404 });
    }
    const duplicateName = name || `${source.name} Copy`;
    const duplicate: QuestionList = {
      id: randomUUID(),
      name: duplicateName,
      items: [...source.items],
      createdAt: now,
      updatedAt: now
    };
    const next = [...lists, duplicate];
    await writeLists(next);
    return NextResponse.json(next, { status: 201 });
  }

  if (!name) {
    return NextResponse.json({ error: 'Name is required.' }, { status: 400 });
  }

  const newList: QuestionList = {
    id: randomUUID(),
    name,
    items,
    createdAt: now,
    updatedAt: now
  };

  const next = [...lists, newList];
  await writeLists(next);
  return NextResponse.json(next, { status: 201 });
}
