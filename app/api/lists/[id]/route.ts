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

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const lists = await readLists();
  const list = lists.find((item) => item.id === params.id);
  if (!list) {
    return NextResponse.json({ error: 'List not found.' }, { status: 404 });
  }
  return NextResponse.json(list);
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const body = await request.json();
  const lists = await readLists();
  const targetIndex = lists.findIndex((item) => item.id === params.id);
  if (targetIndex === -1) {
    return NextResponse.json({ error: 'List not found.' }, { status: 404 });
  }

  const list = lists[targetIndex];
  let changed = false;

  if (typeof body.name === 'string' && body.name.trim()) {
    list.name = body.name.trim();
    changed = true;
  }

  if (Array.isArray(body.addItems)) {
    const additions = normalizeItems(body.addItems);
    if (additions.length > 0) {
      const merged = new Set([...list.items, ...additions]);
      list.items = Array.from(merged);
      changed = true;
    }
  }

  if (Array.isArray(body.removeItems)) {
    const removals = new Set(normalizeItems(body.removeItems));
    if (removals.size > 0) {
      list.items = list.items.filter((item) => !removals.has(item));
      changed = true;
    }
  }

  if (body.duplicate === true) {
    const now = new Date().toISOString();
    const duplicate: QuestionList = {
      id: randomUUID(),
      name: `${list.name} Copy`,
      items: [...list.items],
      createdAt: now,
      updatedAt: now
    };
    lists.push(duplicate);
    changed = true;
  }

  if (changed) {
    list.updatedAt = new Date().toISOString();
    lists[targetIndex] = list;
    await writeLists(lists);
  }

  return NextResponse.json(lists);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const lists = await readLists();
  const next = lists.filter((list) => list.id !== params.id);
  if (next.length === lists.length) {
    return NextResponse.json({ error: 'List not found.' }, { status: 404 });
  }
  await writeLists(next);
  return NextResponse.json(next);
}
