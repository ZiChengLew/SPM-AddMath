import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

type LearningStandard = {
  id: string;
  code: string | null;
  statement: string;
  label: string;
  sectionTitle: string | null;
  chapter: string;
  stage: string | null;
};

type LearningStandardSection = {
  title: string;
  normalized: string;
  standards: LearningStandard[];
};

type ChapterPayload = {
  title: string;
  normalized: string;
  stage: string | null;
  sections: LearningStandardSection[];
  standards: LearningStandard[];
};

export async function GET() {
  const filePath = path.join(process.cwd(), 'Comprehensive Learning Standards.md');

  try {
    const payload = await fs.readFile(filePath, 'utf-8');
    const chapters = parseLearningStandards(payload);
    return NextResponse.json(
      { chapters },
      {
        headers: {
          'Cache-Control': 'public, max-age=300, stale-while-revalidate=600'
        }
      }
    );
  } catch (error) {
    console.error('Failed to load learning standards:', error);
    return NextResponse.json(
      { message: 'Unable to load learning standards.' },
      { status: 500 }
    );
  }
}

function parseLearningStandards(markdown: string): ChapterPayload[] {
  const lines = markdown.split(/\r?\n/);
  const chapters = new Map<string, ChapterPayload>();
  let currentStage: string | null = null;
  let currentChapterKey: string | null = null;
  let currentSectionKey: string | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) {
      continue;
    }

    if (line.startsWith('## ') && !line.startsWith('###')) {
      currentStage = line.replace(/^##\s*/, '').trim();
      continue;
    }

    if (line.startsWith('### ')) {
      const title = line.replace(/^###\s*/, '').trim();
      const normalized = buildChapterKey(title);
      if (!chapters.has(normalized)) {
        chapters.set(normalized, {
          title,
          normalized,
          stage: currentStage,
          sections: [],
          standards: []
        });
      }
      const existing = chapters.get(normalized);
      if (existing && !existing.stage) {
        existing.stage = currentStage;
      }
      currentChapterKey = normalized;
      currentSectionKey = null;
      continue;
    }

    if (line.startsWith('#### ')) {
      currentSectionKey = line.replace(/^####\s*/, '').trim();
      continue;
    }

    if (line.startsWith('- ')) {
      if (!currentChapterKey) {
        continue;
      }
      const entry = cleanStandardLine(line.slice(2).trim());
      if (!entry) {
        continue;
      }
      const chapter = chapters.get(currentChapterKey);
      if (!chapter) {
        continue;
      }

      const codeMatch = entry.match(/^([0-9]+(?:\.[0-9]+)*)\s+(.*)$/);
      const code = codeMatch ? codeMatch[1].trim() : null;
      const statement = (codeMatch ? codeMatch[2] : entry).trim();
      const idBase = code ? code.replace(/[^0-9.]/g, '').replace(/\.+/g, '_') : String(chapter.standards.length + 1);
      const section = getOrCreateSection(chapter, currentSectionKey);
      const standard: LearningStandard = {
        id: `${chapter.normalized}-${idBase}`,
        code,
        statement,
        label: code ? `${code} ${statement}` : statement,
        sectionTitle: section?.title ?? null,
        chapter: chapter.title,
        stage: chapter.stage ?? null
      };
      chapter.standards.push(standard);
      if (section) {
        section.standards.push(standard);
      }
    }
  }

  return Array.from(chapters.values());
}

function cleanStandardLine(line: string): string {
  if (!line) {
    return '';
  }
  const withoutInlineHeading = line.replace(/\s*##[^#]+$/, '').trim();
  return withoutInlineHeading;
}

function buildChapterKey(raw: string): string {
  return raw
    .toLowerCase()
    .replace(/form\s+\d+/g, '')
    .replace(/chapter\s+\d+/g, '')
    .split(':')
    .pop()!
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function getOrCreateSection(chapter: ChapterPayload, sectionTitle: string | null | undefined) {
  const title = sectionTitle && sectionTitle.trim().length > 0 ? sectionTitle.trim() : 'General';
  let section = chapter.sections.find(item => item.title === title);
  if (!section) {
    section = {
      title,
      normalized: buildChapterKey(title),
      standards: []
    };
    chapter.sections.push(section);
  }
  return section;
}
