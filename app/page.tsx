'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  HelpCircle,
  Mail,
  Menu,
  Play,
  Search,
  Share2,
  Shuffle,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

const ALL_PAPERS = 'all';
const ALL_YEARS = 'all';

type ChapterCatalogEntry = {
  form: 'Form 4' | 'Form 5';
  chapterNumber: string;
  title: string;
  display: string;
};

const CHAPTER_CATALOG: ChapterCatalogEntry[] = [
  { form: 'Form 4', chapterNumber: '01', title: 'Functions', display: 'Form 4 Chapter 01: Functions' },
  { form: 'Form 4', chapterNumber: '02', title: 'Quadratic Functions', display: 'Form 4 Chapter 02: Quadratic Functions' },
  { form: 'Form 4', chapterNumber: '03', title: 'Systems of Equations', display: 'Form 4 Chapter 03: Systems of Equations' },
  { form: 'Form 4', chapterNumber: '04', title: 'Indices, Surds and Logarithms', display: 'Form 4 Chapter 04: Indices, Surds and Logarithms' },
  { form: 'Form 4', chapterNumber: '05', title: 'Progressions', display: 'Form 4 Chapter 05: Progressions' },
  { form: 'Form 4', chapterNumber: '06', title: 'Linear Law', display: 'Form 4 Chapter 06: Linear Law' },
  { form: 'Form 4', chapterNumber: '07', title: 'Coordinate Geometry', display: 'Form 4 Chapter 07: Coordinate Geometry' },
  { form: 'Form 4', chapterNumber: '08', title: 'Vectors', display: 'Form 4 Chapter 08: Vectors' },
  { form: 'Form 4', chapterNumber: '09', title: 'Solution of Triangles', display: 'Form 4 Chapter 09: Solution of Triangles' },
  { form: 'Form 4', chapterNumber: '10', title: 'Index Number', display: 'Form 4 Chapter 10: Index Number' },
  { form: 'Form 5', chapterNumber: '01', title: 'Circular Measure', display: 'Form 5 Chapter 01: Circular Measure' },
  { form: 'Form 5', chapterNumber: '02', title: 'Differentiation', display: 'Form 5 Chapter 02: Differentiation' },
  { form: 'Form 5', chapterNumber: '03', title: 'Integration', display: 'Form 5 Chapter 03: Integration' },
  { form: 'Form 5', chapterNumber: '04', title: 'Permutation and Combination', display: 'Form 5 Chapter 04: Permutation and Combination' },
  { form: 'Form 5', chapterNumber: '05', title: 'Probability Distribution', display: 'Form 5 Chapter 05: Probability Distribution' },
  { form: 'Form 5', chapterNumber: '06', title: 'Trigonometric Functions', display: 'Form 5 Chapter 06: Trigonometric Functions' },
  { form: 'Form 5', chapterNumber: '07', title: 'Linear Programming', display: 'Form 5 Chapter 07: Linear Programming' },
  { form: 'Form 5', chapterNumber: '08', title: 'Kinematics of Linear Motion', display: 'Form 5 Chapter 08: Kinematics of Linear Motion' }
];

const CHAPTER_LOOKUP = new Map(
  CHAPTER_CATALOG.map((entry) => [entry.title.toLowerCase(), entry])
);

const CHAPTER_DISPLAY_LOOKUP = new Map(
  CHAPTER_CATALOG.map((entry) => [entry.display.toLowerCase(), entry])
);

const FEATURE_CARDS = [
  {
    title: 'Smarter exam revision with topical practice',
    description:
      'Filter questions instantly by chapter to turn scattered revision into focused sessions for topics that need the most attention.'
  },
  {
    title: 'Flexible filtering options',
    description:
      'Mix and match paper, year, and topic filters to mirror real exam structures or create custom drills in seconds.'
  },
  {
    title: 'Clean display for better focus',
    description:
      'View each question and solution in a distraction-free canvas with quick toggles between official marking schemes and AI explanations.'
  },
  {
    title: 'Personalised study tools',
    description:
      'Save interesting questions, build custom lists, and return to them anytime to monitor progress chapter by chapter.'
  },
  {
    title: 'Built for students and teachers',
    description:
      'Students drill the exact topics they are learning while teachers can assemble ready-made sets for classwork or homework in minutes.'
  }
];

type ChapterTag = {
  chapter: string;
  subtopics?: string[];
  confidence?: number;
  rationale?: string;
  form?: 'Form 4' | 'Form 5' | 'Unknown';
  chapterNumber?: string;
  chapterTitle?: string;
};

type Question = {
  id: string;
  paper_id: string;
  question_number: number;
  year: number;
  state: string;
  paper_code: string;
  section: string | null;
  marks: number | null;
  question_img: string;
  solution_img: string;
  ocr_text?: string | null;
  chapters?: ChapterTag[];
};

function normaliseChapterTag(tag: ChapterTag): ChapterTag {
  const original = tag.chapter?.trim() ?? '';
  if (!original) {
    return { ...tag, form: 'Unknown', chapterNumber: undefined, chapterTitle: undefined };
  }

  const lookupByDisplay = CHAPTER_DISPLAY_LOOKUP.get(original.toLowerCase());
  if (lookupByDisplay) {
    return {
      ...tag,
      chapter: lookupByDisplay.display,
      form: lookupByDisplay.form,
      chapterNumber: lookupByDisplay.chapterNumber,
      chapterTitle: lookupByDisplay.title
    };
  }

  const titleCandidate = original.includes(':')
    ? original.split(':').pop()?.trim() ?? original
    : original.replace(/^(Form\s*\d+\s*Chapter\s*\d+\s*)/i, '').trim();
  const lookupByTitle = titleCandidate ? CHAPTER_LOOKUP.get(titleCandidate.toLowerCase()) : undefined;

  if (lookupByTitle) {
    return {
      ...tag,
      chapter: lookupByTitle.display,
      form: lookupByTitle.form,
      chapterNumber: lookupByTitle.chapterNumber,
      chapterTitle: lookupByTitle.title
    };
  }

  const inferredForm: 'Form 4' | 'Form 5' | 'Unknown' = /Form\s*5/i.test(original)
    ? 'Form 5'
    : /Form\s*4/i.test(original)
    ? 'Form 4'
    : 'Unknown';

  const chapterMatch = original.match(/Chapter\s*(\d+)/i);
  const chapterNumber = chapterMatch ? chapterMatch[1].padStart(2, '0') : undefined;
  const fallbackTitle = titleCandidate || original;
  const displayName = inferredForm !== 'Unknown' && chapterNumber
    ? `${inferredForm} Chapter ${chapterNumber}: ${fallbackTitle}`
    : original;

  return {
    ...tag,
    chapter: displayName,
    form: inferredForm,
    chapterNumber,
    chapterTitle: fallbackTitle
  };
}

function formatChapterLabel(chapter: string) {
  const match = chapter.match(/Chapter\s(\d+)/i);
  const code = match ? `CH${match[1].padStart(2, '0')}` : 'CH';
  const title = chapter.split(':').pop()?.trim() ?? chapter;
  return `${code} – ${title}`;
}

function formatChapterBanner(chapter: string) {
  const [left, right] = chapter.split(':');
  if (right) {
    return `${left.trim()} – ${right.trim()}`;
  }
  return chapter;
}

function formatPaperLabel(question: Question | null) {
  if (!question) {
    return '';
  }
  return `${question.state} ${question.year} ${question.paper_code}`;
}

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedPaper, setSelectedPaper] = useState<string>(ALL_PAPERS);
  const [selectedYear, setSelectedYear] = useState<string>(ALL_YEARS);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'question' | 'solution'>('question');
  const [selectedChapters, setSelectedChapters] = useState<string[]>([]);
  const [topicMenuOpen, setTopicMenuOpen] = useState(false);
  const topicDropdownRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const load = async () => {
      try {
        const response = await fetch('/data/questions.json');
        if (!response.ok) {
          throw new Error(`Failed to load questions (status ${response.status})`);
        }
        const payload: Question[] = await response.json();
        const normalised = payload.map((question) => {
          const chapters = Array.isArray(question.chapters)
            ? question.chapters.map((tag) => normaliseChapterTag(tag))
            : [];

          return {
            ...question,
            chapters,
            ocr_text: question.ocr_text ?? null
          };
        });
        setQuestions(normalised);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  const paperOptions = useMemo(() => {
    const seen = new Map<string, Question>();
    questions.forEach((question) => {
      if (!seen.has(question.paper_id)) {
        seen.set(question.paper_id, question);
      }
    });
    return Array.from(seen.values());
  }, [questions]);

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    questions.forEach((question) => {
      if (question.year) {
        years.add(String(question.year));
      }
    });
    return Array.from(years).sort((a, b) => Number(a) - Number(b));
  }, [questions]);

  const chapterOptions = useMemo(() => {
    const relevant =
      selectedPaper === ALL_PAPERS
        ? questions
        : questions.filter((question) => question.paper_id === selectedPaper);

    const counts = new Map<
      string,
      {
        chapter: string;
        total: number;
        form: 'Form 4' | 'Form 5' | 'Unknown';
        chapterNumber?: string;
        chapterTitle?: string;
      }
    >();

    relevant.forEach((question) => {
      question.chapters?.forEach((tag) => {
        const form = tag.form ?? 'Unknown';
        const number = tag.chapterNumber ?? tag.chapter;
        const key = `${form}|${number}`;
        const existing = counts.get(key);
        if (existing) {
          existing.total += 1;
        } else {
          counts.set(key, {
            chapter: tag.chapter,
            form,
            chapterNumber: tag.chapterNumber,
            chapterTitle: tag.chapterTitle ?? tag.chapter,
            total: 1
          });
        }
      });
    });

    return Array.from(counts.values()).sort((a, b) => a.chapter.localeCompare(b.chapter));
  }, [questions, selectedPaper]);

  const chapterGroups = useMemo(() => {
    const groupMap = new Map<'Form 4' | 'Form 5' | 'Unknown', Array<{ chapter: string; total: number; label: string; chapterNumber?: string }>>();

    chapterOptions.forEach((option) => {
      const form = option.form ?? 'Unknown';
      const label = formatChapterLabel(option.chapter);
      const bucket = groupMap.get(form);
      const entry = {
        chapter: option.chapter,
        total: option.total,
        label,
        chapterNumber: option.chapterNumber
      };
      if (bucket) {
        bucket.push(entry);
      } else {
        groupMap.set(form, [entry]);
      }
    });

    const formOrder: Array<'Form 4' | 'Form 5' | 'Unknown'> = ['Form 4', 'Form 5', 'Unknown'];
    return formOrder
      .map((form) => {
        const items = groupMap.get(form) ?? [];
        if (items.length === 0) {
          return null;
        }
        const sortedItems = items.sort((a, b) => {
          const numA = a.chapterNumber ? Number.parseInt(a.chapterNumber, 10) : Number.MAX_SAFE_INTEGER;
          const numB = b.chapterNumber ? Number.parseInt(b.chapterNumber, 10) : Number.MAX_SAFE_INTEGER;
          if (numA !== numB) {
            return numA - numB;
          }
          return a.label.localeCompare(b.label);
        });
        return { form, items: sortedItems };
      })
      .filter((group): group is { form: 'Form 4' | 'Form 5' | 'Unknown'; items: Array<{ chapter: string; total: number; label: string; chapterNumber?: string }> } => group !== null)
      .filter((group) => group.form !== 'Unknown');
  }, [chapterOptions]);

  const filteredQuestions = useMemo(() => {
    return questions
      .filter((question) => selectedPaper === ALL_PAPERS || question.paper_id === selectedPaper)
      .filter((question) => selectedYear === ALL_YEARS || String(question.year) === selectedYear)
      .filter((question) => {
        if (selectedChapters.length === 0) {
          return true;
        }
        const chapters = question.chapters ?? [];
        const names = new Set(chapters.map((tag) => tag.chapter));
        return selectedChapters.some((chapter) => names.has(chapter));
      })
      .sort((a, b) => a.question_number - b.question_number);
  }, [questions, selectedPaper, selectedYear, selectedChapters]);

  const hasQuestions = filteredQuestions.length > 0;
  const currentQuestion = hasQuestions ? filteredQuestions[currentIndex] : null;

  useEffect(() => {
    setCurrentIndex((prev) => {
      if (!hasQuestions) {
        return 0;
      }
      return prev >= filteredQuestions.length ? filteredQuestions.length - 1 : prev;
    });
  }, [filteredQuestions.length, hasQuestions]);

  useEffect(() => {
    setCurrentIndex(0);
    setActiveTab('question');
  }, [selectedPaper, selectedChapters, selectedYear]);

  useEffect(() => {
    setActiveTab('question');
  }, [currentIndex]);

  useEffect(() => {
    setSelectedChapters([]);
    setTopicMenuOpen(false);
  }, [selectedPaper]);

  useEffect(() => {
    if (!topicMenuOpen) {
      return;
    }
    const handleClick = (event: MouseEvent) => {
      if (topicDropdownRef.current && !topicDropdownRef.current.contains(event.target as Node)) {
        setTopicMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [topicMenuOpen]);

  const toggleChapter = (chapter: string) => {
    setSelectedChapters((prev) =>
      prev.includes(chapter) ? prev.filter((item) => item !== chapter) : [...prev, chapter]
    );
  };

  const clearChapters = () => setSelectedChapters([]);

  const handlePrev = () => {
    if (!hasQuestions) {
      return;
    }
    setCurrentIndex((prev) => Math.max(prev - 1, 0));
    setActiveTab('question');
  };

  const handleNext = () => {
    if (!hasQuestions) {
      return;
    }
    setCurrentIndex((prev) => Math.min(prev + 1, filteredQuestions.length - 1));
    setActiveTab('question');
  };

  const handleShuffle = () => {
    if (!hasQuestions) {
      return;
    }
    const randomIndex = Math.floor(Math.random() * filteredQuestions.length);
    setCurrentIndex(randomIndex);
    setActiveTab('question');
  };

  const topicSummary = (() => {
    if (selectedChapters.length === 0) {
      return 'Select Topic';
    }
    if (selectedChapters.length === 1) {
      return formatChapterLabel(selectedChapters[0]);
    }
    return `${selectedChapters.length} topics selected`;
  })();

  const selectedPaperMeta =
    currentQuestion ??
    (selectedPaper === ALL_PAPERS ? null : paperOptions.find((item) => item.paper_id === selectedPaper) ?? null);

  if (loading) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eff3f9] text-slate-600">
        Loading questions…
      </main>
    );
  }

  if (error) {
    return (
      <main className="grid min-h-screen place-items-center bg-[#eff3f9] text-red-600">
        Error loading questions: {error}
      </main>
    );
  }

  return (
    <div className="min-h-screen bg-[#eff3f9] text-slate-800">
      <header className="border-b border-slate-200">
        <div className="container mx-auto flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" className="text-slate-700">
              <Menu className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2 rounded border border-slate-300 bg-white px-4 py-2">
              <span className="text-sm text-slate-700">Topical Past Papers eBooks</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="text-slate-700">
              <Users className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-700">
              <HelpCircle className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="text-slate-700">
              <Mail className="h-5 w-5" />
            </Button>
            <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              Login
            </Button>
            <Button variant="outline" className="border-slate-300 bg-white text-slate-700 hover:bg-slate-50">
              Register
            </Button>
          </div>
        </div>
      </header>

      <section className="border-b border-slate-200 bg-white">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-4 flex items-center gap-3">
            <h1 className="text-3xl font-bold text-[#3b82f6]">TOPICAL PAST PAPER QUESTIONS</h1>
            <Button variant="ghost" size="icon" className="rounded-full bg-slate-100 hover:bg-slate-200">
              <Play className="h-4 w-4 text-slate-700" />
            </Button>
          </div>
          <p className="max-w-5xl text-base leading-relaxed text-slate-600">
            Practice with real SPM Additional Mathematics questions organised by chapter. Pick a topic, choose a
            paper, and work through the full question set with answer schemes ready when you need them.
          </p>

          <div className="mt-4 flex w-fit items-center gap-2 rounded border border-orange-300 bg-orange-100 px-4 py-2">
            <div className="rounded bg-orange-500 px-2 py-0.5 text-xs font-semibold text-white">
              Not Subscribed
            </div>
            <svg className="h-4 w-4 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-semibold text-orange-800">Questions are not downloadable</span>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <div className="rounded-2xl border-2 border-[#3b82f6] bg-[#dbe9f7] p-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                </svg>
                Curriculum:
              </span>
              <div className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                MALAYSIA SPM
              </div>
            </div>

            <div className="flex items-center gap-3">
              <span className="flex items-center gap-2 text-sm text-slate-700">
                <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 4.804A7.968 7.968 0 005.5 4c-1.255 0-2.443.29-3.5.804v10A7.969 7.969 0 015.5 14c1.669 0 3.218.51 4.5 1.385A7.962 7.962 0 0114.5 14c1.255 0 2.443.29 3.5.804v-10A7.968 7.968 0 0014.5 4c-1.255 0-2.443.29-3.5.804V12a1 1 0 11-2 0V4.804z" />
                </svg>
                Subject:
              </span>
              <div className="flex items-center gap-2 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700">
                Additional Mathematics (3472)
                <span className="rounded-full bg-[#3b82f6] px-3 py-1 text-xs font-semibold text-white">
                  Chapterized Till : Sep 2022
                </span>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-6">
            <div className="sm:col-span-2" ref={topicDropdownRef}>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Topic(s):
              </label>
              <button
                type="button"
                className={cn(
                  'flex w-full items-center justify-between rounded-md border border-slate-300 bg-white px-3 py-2 text-left text-sm font-semibold text-slate-700 transition hover:border-[#3b82f6]',
                  topicMenuOpen && 'border-[#3b82f6] ring-2 ring-[#3b82f6]/30'
                )}
                onClick={() => setTopicMenuOpen((prev) => !prev)}
              >
                <span className="truncate">{topicSummary}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
              {topicMenuOpen && (
                <div className="absolute z-50 mt-2 max-h-[360px] w-[min(320px,85vw)] overflow-hidden rounded-xl border border-[#9bb9e8] bg-white p-4 shadow-2xl">
                  <div className="mb-3 flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Chapters
                    </span>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearChapters}
                      disabled={selectedChapters.length === 0}
                    >
                      Clear all
                    </Button>
                  </div>
                  <div className="max-h-[260px] space-y-4 overflow-y-auto pr-1">
                    {chapterGroups.map(({ form, items }) => (
                      <div key={form} className="space-y-2">
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{form}</p>
                        <div className="space-y-1">
                          {items.map(({ chapter, total, label }) => {
                            const checked = selectedChapters.includes(chapter);
                            return (
                              <label
                                key={chapter}
                                className={cn(
                                  'flex cursor-pointer items-center justify-between rounded-lg border border-transparent px-3 py-2 text-sm transition',
                                  checked
                                    ? 'border-[#3b82f6] bg-[#e6f0ff] font-semibold text-[#1d4ed8]'
                                    : 'hover:bg-slate-50'
                                )}
                              >
                                <span className="flex items-center gap-2">
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleChapter(chapter)}
                                    className="size-4 rounded border-slate-300 text-[#3b82f6] focus:ring-[#3b82f6]"
                                  />
                                  <span>{label}</span>
                                </span>
                                <span className="text-xs text-slate-500">{total}</span>
                              </label>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {chapterGroups.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No chapter metadata for the current selection.
                      </p>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Paper(s):
              </label>
              <Select value={selectedPaper} onValueChange={setSelectedPaper}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Paper" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_PAPERS}>All Papers</SelectItem>
                  {paperOptions.map((paper) => (
                    <SelectItem key={paper.paper_id} value={paper.paper_id}>
                      {formatPaperLabel(paper)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                Year(s):
              </label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger className="bg-white">
                  <SelectValue placeholder="Select Year" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_YEARS}>All Years</SelectItem>
                  {yearOptions.map((year) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-end">
              <Button
                type="button"
                className="w-full bg-[#3b82f6] text-white hover:bg-[#2563eb]"
                onClick={() => setTopicMenuOpen(false)}
              >
                <Search className="mr-2 h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="container mx-auto px-4 py-6">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
              <div className="flex items-center justify-between bg-slate-50 px-4 py-3 text-xs font-semibold text-slate-600">
                <button
                  type="button"
                  className="flex flex-col items-center gap-1"
                  onClick={() => {
                    if (!hasQuestions) {
                      return;
                    }
                    setCurrentIndex(0);
                    setActiveTab('question');
                  }}
                >
                  <ChevronDown className="h-4 w-4" />
                  <span>Asc</span>
                </button>
                <div className="flex flex-col items-center gap-1">
                  <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span>{filteredQuestions.length}</span>
                </div>
                <div className="flex flex-col items-center gap-1">
                  <Eye className="h-4 w-4" />
                  <span>
                    {hasQuestions ? `${currentIndex + 1} / ${filteredQuestions.length}` : '0 / 0'}
                  </span>
                </div>
                <button
                  type="button"
                  className="flex flex-col items-center gap-1"
                  onClick={handleShuffle}
                  disabled={!hasQuestions}
                >
                  <Shuffle className="h-4 w-4" />
                  <span>Random</span>
                </button>
              </div>

              <div className="max-h-[600px] space-y-0.5 overflow-y-auto bg-white">
                {filteredQuestions.map((question, index) => {
                  const active = index === currentIndex;
                  const badge = `Q${question.question_number.toString().padStart(2, '0')}`;
                  return (
                    <button
                      key={question.id}
                      type="button"
                      className={cn(
                        'flex w-full items-center justify-between px-4 py-3 text-left text-sm transition',
                        active
                          ? 'bg-[#e8f1ff] font-semibold text-[#1d4ed8]'
                          : 'hover:bg-slate-50'
                      )}
                      onClick={() => {
                        setCurrentIndex(index);
                        setActiveTab('question');
                      }}
                    >
                      <div className="flex flex-col">
                        <span className="font-mono text-xs uppercase tracking-wide text-slate-500">
                          {question.paper_id}
                        </span>
                        <span className="text-sm text-slate-700">{badge}</span>
                      </div>
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs font-semibold text-slate-600">
                        {question.year}
                      </span>
                    </button>
                  );
                })}
                {filteredQuestions.length === 0 && (
                  <div className="px-4 py-6 text-sm text-slate-500">
                    No questions match the current filters.
                  </div>
                )}
              </div>
            </div>
          </aside>

          <article className="lg:col-span-9">
            <div className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border-2 border-slate-200 bg-white">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 bg-slate-50 px-6 py-4">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900">SPM Additional Mathematics</h2>
                  <p className="text-sm text-slate-600">
                    {selectedPaperMeta ? formatPaperLabel(selectedPaperMeta) : 'Select a paper to begin'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="text-slate-600"
                    disabled={!currentQuestion}
                    onClick={() => {
                      if (!currentQuestion) {
                        return;
                      }
                      const link = `${currentQuestion.question_img}`;
                      void navigator.clipboard?.writeText(link);
                    }}
                    title="Copy question image link"
                  >
                    <Share2 className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handlePrev}
                    disabled={!hasQuestions || currentIndex === 0}
                    className="text-slate-600"
                    title="Previous question"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleNext}
                    disabled={!hasQuestions || currentIndex === filteredQuestions.length - 1}
                    className="text-slate-600"
                    title="Next question"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </Button>
                </div>
              </div>

              <div className="flex items-center gap-2 border-b border-slate-200 bg-slate-50 px-6 py-3">
                <button
                  type="button"
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    activeTab === 'question'
                      ? 'bg-[#3b82f6] text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                  onClick={() => setActiveTab('question')}
                  disabled={!hasQuestions}
                >
                  Question
                </button>
                <button
                  type="button"
                  className={cn(
                    'rounded-full px-4 py-2 text-sm font-semibold transition',
                    activeTab === 'solution'
                      ? 'bg-[#3b82f6] text-white shadow'
                      : 'text-slate-600 hover:bg-slate-100'
                  )}
                  onClick={() => setActiveTab('solution')}
                  disabled={!hasQuestions || !currentQuestion?.solution_img}
                >
                  Answer
                </button>
              </div>

              {hasQuestions && currentQuestion?.chapters && currentQuestion.chapters.length > 0 && (
                <div className="border-b border-slate-200 bg-[#eef5ff] px-6 py-3 text-sm font-semibold text-slate-700">
                  Topic(s):{' '}
                  <span className="font-normal">
                    {currentQuestion.chapters.map((tag) => formatChapterBanner(tag.chapter)).join(', ')}
                  </span>
                </div>
              )}

              <div className="flex flex-1 items-center justify-center bg-white px-6 py-6">
                {hasQuestions ? (
                  activeTab === 'solution' && !currentQuestion?.solution_img ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                      No solution image available for this question.
                    </div>
                  ) : (
                    <div className="w-full max-w-3xl">
                      <div className="mx-auto flex h-[500px] items-start justify-center overflow-y-auto rounded-xl border border-slate-200 bg-white p-4 shadow-inner">
                        <img
                          src={
                            activeTab === 'solution'
                              ? currentQuestion?.solution_img ?? ''
                              : currentQuestion?.question_img ?? ''
                          }
                          alt={
                            currentQuestion
                              ? `${activeTab === 'solution' ? 'Solution' : 'Question'} for question ${currentQuestion.question_number}`
                              : 'Question image'
                          }
                          onContextMenu={(event) => event.preventDefault()}
                          draggable={false}
                          className="h-auto max-w-full"
                        />
                      </div>
                    </div>
                  )
                ) : (
                  <div className="flex flex-col items-center gap-4 text-center text-slate-500">
                    <img
                      src="https://ext.same-assets.com/794318852/1088674474.webp"
                      alt="No results"
                      className="h-24 w-24 opacity-60"
                    />
                    <div>
                      <p className="text-base font-semibold text-slate-600">No questions found</p>
                      <p className="text-sm">
                        Try widening your filters to see more questions.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between border-t border-slate-200 bg-slate-50 px-6 py-4">
                <Button
                  type="button"
                  variant="ghost"
                  className="font-semibold text-slate-700 hover:text-[#1d4ed8]"
                  onClick={handlePrev}
                  disabled={!hasQuestions || currentIndex === 0}
                >
                  Previous
                </Button>
                <span className="text-sm font-semibold text-slate-600">
                  {hasQuestions ? `${currentIndex + 1} of ${filteredQuestions.length}` : '0 of 0'}
                </span>
                <Button
                  type="button"
                  variant="ghost"
                  className="font-semibold text-slate-700 hover:text-[#1d4ed8]"
                  onClick={handleNext}
                  disabled={!hasQuestions || currentIndex === filteredQuestions.length - 1}
                >
                  Next
                </Button>
              </div>
            </div>
          </article>
        </div>
      </section>

      <section className="container mx-auto px-4 pb-12">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {FEATURE_CARDS.map((card) => (
            <div key={card.title} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h3 className="mb-3 text-lg font-semibold text-slate-800">{card.title}</h3>
              <p className="text-sm leading-relaxed text-slate-600">{card.description}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#eff3f9]">
        <div className="container mx-auto flex items-center justify-between px-4 py-6 text-sm text-slate-600">
          <p>2025 © exam-mate</p>
          <div className="flex items-center gap-6">
            <a href="#" className="hover:text-slate-800">
              T &amp; C
            </a>
            <a href="#" className="hover:text-slate-800">
              Blog
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
