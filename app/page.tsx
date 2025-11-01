'use client';

import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  Eye,
  HelpCircle,
  KeyRound,
  List,
  Mail,
  Menu,
  Play,
  Search,
  Shuffle,
  Users
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { createPortal } from 'react-dom';

const ALL_YEARS_LABEL = 'All Years';
const ALL_STATES_LABEL = 'All States';
const ALL_PAPERS_LABEL = 'All Papers';
const STATE_OPTIONS = [
  'Johor',
  'Kedah',
  'Kelantan',
  'Malacca',
  'Negeri Sembilan',
  'Pahang',
  'Penang',
  'Perak',
  'Perlis',
  'Sabah',
  'Sarawak',
  'Selangor',
  'Terengganu',
  'Kuala Lumpur',
  'Labuan',
  'Putrajaya'
] as const;
const PAPER_OPTIONS = [
  { value: 'P1', label: 'Paper 1' },
  { value: 'P2', label: 'Paper 2' }
] as const;
const PAPER_VALUE_TO_LABEL = new Map(PAPER_OPTIONS.map((option) => [option.value, option.label]));
const PAPER_LABEL_TO_VALUE = new Map(PAPER_OPTIONS.map((option) => [option.label, option.value]));

function paperCodeToValue(code: string): string {
  const mapped = PAPER_LABEL_TO_VALUE.get(code);
  if (mapped) {
    return mapped;
  }
  const match = code.match(/Paper\s*(\d+)/i);
  if (match) {
    return `P${match[1]}`;
  }
  return code;
}

function paperValueToLabel(value: string): string {
  return PAPER_VALUE_TO_LABEL.get(value) ?? value;
}

type DropdownCoords = { top: number; left: number; width: number } | null;

function useFloatingDropdown(minWidth = 360, maxWidth = 420, offset = 10) {
  const [open, setOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement | null>(null);
  const dropdownRef = useRef<HTMLDivElement | null>(null);
  const [coords, setCoords] = useState<DropdownCoords>(null);

  const updatePosition = useCallback(() => {
    if (typeof window === 'undefined') {
      return;
    }
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const width = Math.max(minWidth, Math.min(maxWidth, rect.width));
    const viewportPadding = 16;
    const left = Math.min(
      Math.max(viewportPadding, rect.left),
      Math.max(viewportPadding, window.innerWidth - width - viewportPadding)
    );
    const top = rect.bottom + offset;
    setCoords({ top, left, width });
  }, [maxWidth, minWidth, offset]);

  useLayoutEffect(() => {
    if (open) {
      updatePosition();
    }
  }, [open, updatePosition]);

  useEffect(() => {
    if (!open || typeof window === 'undefined') {
      return;
    }

    const frameId = window.requestAnimationFrame(() => {
      const firstOption = dropdownRef.current?.querySelector<HTMLElement>('[data-dropdown-option]');
      firstOption?.focus();
    });

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      if (dropdownRef.current?.contains(target) || triggerRef.current?.contains(target)) {
        return;
      }
      setOpen(false);
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    const handleWindowChange = () => updatePosition();

    window.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('resize', handleWindowChange);
    window.addEventListener('scroll', handleWindowChange, true);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('resize', handleWindowChange);
      window.removeEventListener('scroll', handleWindowChange, true);
    };
  }, [open, updatePosition]);

  return {
    open,
    setOpen,
    triggerRef,
    dropdownRef,
    coords,
    updatePosition
  };
}

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

export default function HomePage() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draftPapers, setDraftPapers] = useState<string[]>([]);
  const [draftYears, setDraftYears] = useState<string[]>([]);
  const [draftStates, setDraftStates] = useState<string[]>([]);
  const [draftChapters, setDraftChapters] = useState<string[]>([]);
  const [appliedPapers, setAppliedPapers] = useState<string[]>([]);
  const [appliedYears, setAppliedYears] = useState<string[]>([]);
  const [appliedStates, setAppliedStates] = useState<string[]>([]);
  const [appliedChapters, setAppliedChapters] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<'question' | 'solution'>('question');
  const {
    open: topicMenuOpen,
    setOpen: setTopicMenuOpen,
    triggerRef: topicTriggerRef,
    dropdownRef: topicDropdownRef,
    coords: topicDropdownCoords,
    updatePosition: updateTopicDropdownPosition
  } = useFloatingDropdown();
  const {
    open: stateMenuOpen,
    setOpen: setStateMenuOpen,
    triggerRef: stateTriggerRef,
    dropdownRef: stateDropdownRef,
    coords: stateDropdownCoords,
    updatePosition: updateStateDropdownPosition
  } = useFloatingDropdown();
  const {
    open: yearMenuOpen,
    setOpen: setYearMenuOpen,
    triggerRef: yearTriggerRef,
    dropdownRef: yearDropdownRef,
    coords: yearDropdownCoords,
    updatePosition: updateYearDropdownPosition
  } = useFloatingDropdown();
  const {
    open: paperMenuOpen,
    setOpen: setPaperMenuOpen,
    triggerRef: paperTriggerRef,
    dropdownRef: paperDropdownRef,
    coords: paperDropdownCoords,
    updatePosition: updatePaperDropdownPosition
  } = useFloatingDropdown();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const searchParamString = searchParams.toString();
  const closeAllMenus = useCallback(() => {
    setTopicMenuOpen(false);
    setStateMenuOpen(false);
    setYearMenuOpen(false);
    setPaperMenuOpen(false);
  }, [setPaperMenuOpen, setStateMenuOpen, setTopicMenuOpen, setYearMenuOpen]);

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

  const yearOptions = useMemo(() => {
    const years = new Set<string>();
    questions.forEach((question) => {
      if (question.year) {
        years.add(String(question.year));
      }
    });
    return Array.from(years).sort((a, b) => Number(a) - Number(b));
  }, [questions]);
  const yearOptionsDesc = useMemo(
    () => [...yearOptions].sort((a, b) => Number(b) - Number(a)),
    [yearOptions]
  );

  useEffect(() => {
    if (questions.length === 0) {
      return;
    }
    const paperParam = searchParams.get('paper');
    const yearParam = searchParams.get('year');
    const stateParam = searchParams.get('state');
    const chaptersParam = searchParams.get('chapters');

    const paperCandidates = new Set<string>(PAPER_OPTIONS.map((option) => option.value));
    const stateCandidates = new Set<string>(STATE_OPTIONS);
    const validYears = new Set(yearOptions);
    const nextPapers = paperParam
      ? Array.from(
          new Set(
            paperParam
              .split(',')
              .map((value) => value.trim().toUpperCase())
              .filter((value) => paperCandidates.has(value))
          )
        )
      : [];
    const nextYears = yearParam
      ? Array.from(
          new Set(
            yearParam
              .split(',')
              .map((value) => value.trim())
              .filter((value) => validYears.has(value))
          )
        )
      : [];
    const nextStates = stateParam
      ? Array.from(
          new Set(
            stateParam
              .split(',')
              .map((value) => value.trim())
              .filter((value) => stateCandidates.has(value))
          )
        )
      : [];
    const sortedStates = [...nextStates].sort((a, b) => STATE_OPTIONS.indexOf(a) - STATE_OPTIONS.indexOf(b));
    const sortedYears = [...nextYears].sort((a, b) => Number(b) - Number(a));
    const order = PAPER_OPTIONS.map((option) => option.value);
    const sortedPapers = [...nextPapers].sort((a, b) => order.indexOf(a) - order.indexOf(b));
    const nextChapters = chaptersParam
      ? Array.from(new Set(chaptersParam.split(',').map((item) => item.trim()).filter(Boolean)))
      : [];

    setDraftPapers(sortedPapers);
    setDraftYears(sortedYears);
    setDraftStates(sortedStates);
    setDraftChapters(nextChapters);
    setAppliedPapers(sortedPapers);
    setAppliedYears(sortedYears);
    setAppliedStates(sortedStates);
    setAppliedChapters(nextChapters);
  }, [questions.length, searchParams, searchParamString, yearOptions]);

  const chapterOptions = useMemo(() => {
    const relevant = questions.filter((question) => {
      const paperValue = paperCodeToValue(question.paper_code);
      const matchesPaper = draftPapers.length === 0 || draftPapers.includes(paperValue);
      const matchesState = draftStates.length === 0 || draftStates.includes(question.state);
      const matchesYear = draftYears.length === 0 || draftYears.includes(String(question.year));
      return matchesPaper && matchesState && matchesYear;
    });

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
  }, [draftPapers, draftStates, draftYears, questions]);

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
      .filter((question) => {
        const paperValue = paperCodeToValue(question.paper_code);
        const matchesPaper = appliedPapers.length === 0 || appliedPapers.includes(paperValue);
        const matchesState = appliedStates.length === 0 || appliedStates.includes(question.state);
        const matchesYear = appliedYears.length === 0 || appliedYears.includes(String(question.year));
        if (!matchesPaper || !matchesState || !matchesYear) {
          return false;
        }
        if (appliedChapters.length === 0) {
          return true;
        }
        const chapters = question.chapters ?? [];
        const names = new Set(chapters.map((tag) => tag.chapter));
        return appliedChapters.some((chapter) => names.has(chapter));
      })
      .sort((a, b) => a.question_number - b.question_number);
  }, [appliedChapters, appliedPapers, appliedStates, appliedYears, questions]);

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
  }, [appliedChapters, appliedPapers, appliedStates, appliedYears]);

  useEffect(() => {
    setActiveTab('question');
  }, [currentIndex]);

  const toggleChapter = (chapter: string) => {
    setDraftChapters((prev) =>
      prev.includes(chapter) ? prev.filter((item) => item !== chapter) : [...prev, chapter]
    );
  };

  const clearChapters = () => setDraftChapters([]);

  const toggleStateValue = (value: string) => {
    setDraftStates((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      const next = [...prev, value];
      return next.sort((a, b) => STATE_OPTIONS.indexOf(a) - STATE_OPTIONS.indexOf(b));
    });
  };

  const clearStates = () => setDraftStates([]);

  const toggleYearValue = (value: string) => {
    setDraftYears((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      const next = [...prev, value];
      return next.sort((a, b) => Number(b) - Number(a));
    });
  };

  const clearYears = () => setDraftYears([]);

  const togglePaperValue = (value: string) => {
    setDraftPapers((prev) => {
      if (prev.includes(value)) {
        return prev.filter((item) => item !== value);
      }
      const next = [...prev, value];
      const order = PAPER_OPTIONS.map((option) => option.value);
      return next.sort((a, b) => order.indexOf(a) - order.indexOf(b));
    });
  };

  const clearPapers = () => setDraftPapers([]);

  const isAllStatesSelected = draftStates.length === 0;
  const isAllYearsSelected = draftYears.length === 0;
  const isAllPapersSelected = draftPapers.length === 0;

  const renderChipSummary = (
    items: string[],
    fallback: string,
    formatter: (value: string) => string = (value) => value
  ) => {
    if (items.length === 0) {
      return <span className="truncate text-slate-600">{fallback}</span>;
    }
    const unique = Array.from(new Set(items));
    const display = unique.length > 3 ? unique.slice(0, 2) : unique;
    const remainder = unique.length > 3 ? unique.length - 2 : 0;
    return (
      <div className="flex items-center gap-1 overflow-hidden">
        {display.map((value) => (
          <span
            key={value}
            className="shrink-0 rounded-full bg-[#e6ecff] px-2 py-0.5 text-xs font-semibold text-[#1d4ed8]"
          >
            {formatter(value)}
          </span>
        ))}
        {remainder > 0 && (
          <span className="shrink-0 rounded-full bg-[#dbe7ff] px-2 py-0.5 text-xs font-semibold text-[#1d4ed8]">
            +{remainder}
          </span>
        )}
      </div>
    );
  };

  const moveFocusWithin = (root: HTMLDivElement | null, direction: 1 | -1) => {
    if (!root) {
      return;
    }
    const focusable = Array.from(root.querySelectorAll<HTMLElement>('[data-dropdown-option]'));
    if (focusable.length === 0) {
      return;
    }
    const activeElement = document.activeElement as HTMLElement | null;
    let index = focusable.findIndex((element) => element === activeElement);
    if (index === -1) {
      index = direction === 1 ? 0 : focusable.length - 1;
    } else {
      index = (index + direction + focusable.length) % focusable.length;
    }
    focusable[index]?.focus();
  };

  const handleDropdownKeyDown = (
    event: React.KeyboardEvent<HTMLDivElement>,
    close: () => void,
    trigger: HTMLButtonElement | null
  ) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      moveFocusWithin(event.currentTarget, 1);
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      moveFocusWithin(event.currentTarget, -1);
    } else if (event.key === 'Escape') {
      event.preventDefault();
      close();
      trigger?.focus();
    }
  };

  const handleSearch = useCallback(() => {
    setAppliedPapers(draftPapers);
    setAppliedYears(draftYears);
    setAppliedStates(draftStates);
    setAppliedChapters(draftChapters);
    closeAllMenus();
    setActiveTab('question');
    setCurrentIndex(0);

    const params = new URLSearchParams();
    if (draftPapers.length > 0) {
      params.set('paper', draftPapers.join(','));
    }
    if (draftStates.length > 0) {
      params.set('state', draftStates.join(','));
    }
    if (draftYears.length > 0) {
      params.set('year', draftYears.join(','));
    }
    if (draftChapters.length > 0) {
      params.set('chapters', draftChapters.join(','));
    }

    const paramsString = params.toString();
    router.replace(paramsString ? `${pathname}?${paramsString}` : pathname, { scroll: false });
  }, [
    closeAllMenus,
    draftChapters,
    draftPapers,
    draftStates,
    draftYears,
    pathname,
    router
  ]);

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

  const chapterSummary = (() => {
    if (draftChapters.length === 0) {
      return 'Select Chapter(s)';
    }
    if (draftChapters.length === 1) {
      return formatChapterLabel(draftChapters[0]);
    }
    return `${draftChapters.length} chapters selected`;
  })();

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
        <div className="container mx-auto flex items-center justify-between px-6 py-3 md:px-8">
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
        <div className="container mx-auto px-6 py-5 md:px-8">
          <div className="mb-2 flex items-center gap-3">
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

      <section className="sticky top-0 z-30 bg-[#eff3f9]/95 backdrop-blur">
        <div className="container mx-auto px-6 py-4 md:px-8">
          <div className="rounded-2xl border border-[#c6d6f8] bg-[#e8f0ff] px-5 py-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex w-full flex-col gap-2 md:w-auto">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Subject
              </span>
              <div className="flex h-10 items-center rounded-lg border border-[#b7c7ef] bg-white px-4 text-sm font-semibold text-slate-700 shadow-sm">
                Additional Mathematics (3472)
              </div>
            </div>
            <div className="relative flex w-full flex-col gap-2 md:w-auto md:flex-1">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Chapter(s)
              </span>
              <button
                type="button"
                className={cn(
                  'flex h-10 w-full items-center justify-between rounded-lg border border-[#b7c7ef] bg-white px-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#1d4ed8]',
                  topicMenuOpen && 'border-[#1d4ed8] ring-2 ring-[#1d4ed8]/30'
                )}
                ref={topicTriggerRef}
                onClick={() =>
                  setTopicMenuOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setStateMenuOpen(false);
                      setYearMenuOpen(false);
                      setPaperMenuOpen(false);
                      updateTopicDropdownPosition();
                    }
                    return next;
                  })
                }
              >
                <span className="truncate">{chapterSummary}</span>
                <ChevronDown className="h-4 w-4 text-slate-400" />
              </button>
            </div>
            {typeof document !== 'undefined' && topicMenuOpen && topicDropdownCoords
              ? createPortal(
                  <div
                    ref={topicDropdownRef}
                    style={{
                      position: 'fixed',
                      top: topicDropdownCoords.top,
                      left: topicDropdownCoords.left,
                      width: topicDropdownCoords.width,
                      maxHeight: '60vh'
                    }}
                    className="relative z-[70] flex max-h-[60vh] flex-col overflow-hidden rounded-xl border border-[#9bb9e8] bg-white shadow-xl"
                  >
                    <button
                      type="button"
                      onClick={clearChapters}
                      disabled={draftChapters.length === 0}
                      className="absolute right-3 top-2 text-xs font-semibold text-[#2563eb] disabled:text-slate-300"
                    >
                      Clear all
                    </button>
                    <div className="flex-1 space-y-4 overflow-y-auto px-4 pb-3 pt-4">
                      {chapterGroups.map(({ form, items }) => (
                        <div key={form} className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">{form}</p>
                          <div className="space-y-1">
                            {items.map(({ chapter, total, label }) => {
                              const checked = draftChapters.includes(chapter);
                              return (
                                <label
                                  key={chapter}
                                  className={cn(
                                    'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2 text-sm transition',
                                    checked ? 'bg-[#e6f0ff] font-semibold text-[#1d4ed8]' : 'hover:bg-slate-50'
                                  )}
                                >
                                  <input
                                    type="checkbox"
                                    checked={checked}
                                    onChange={() => toggleChapter(chapter)}
                                    className="size-4 rounded border-slate-300 text-[#2563eb] focus:ring-[#2563eb]"
                                    data-dropdown-option
                                  />
                                  <span className="flex-1">{label}</span>
                                  <span className="text-xs font-semibold text-slate-500">{total}</span>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      ))}
                      {chapterGroups.length === 0 && (
                        <p className="text-sm text-slate-500">No chapter metadata for the current selection.</p>
                      )}
                    </div>
                  </div>,
                  document.body
                )
              : null}
            <div className="relative flex w-full flex-col gap-2 md:w-[190px]">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">State</span>
              <button
                type="button"
                ref={stateTriggerRef}
                className={cn(
                  'flex h-10 w-full items-center justify-between rounded-lg border border-[#b7c7ef] bg-white px-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#1d4ed8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40',
                  stateMenuOpen && 'border-[#1d4ed8] ring-2 ring-[#1d4ed8]/30'
                )}
                onClick={() =>
                  setStateMenuOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setTopicMenuOpen(false);
                      setYearMenuOpen(false);
                      setPaperMenuOpen(false);
                      updateStateDropdownPosition();
                    }
                    return next;
                  })
                }
                aria-haspopup="listbox"
                aria-expanded={stateMenuOpen}
              >
                <span className="flex-1 overflow-hidden pr-3">
                  {renderChipSummary(draftStates, ALL_STATES_LABEL)}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
              {typeof document !== 'undefined' && stateMenuOpen && stateDropdownCoords
                ? createPortal(
                    <div
                      ref={stateDropdownRef}
                      style={{
                        position: 'fixed',
                        top: stateDropdownCoords.top,
                        left: stateDropdownCoords.left,
                        width: stateDropdownCoords.width,
                        maxHeight: '60vh'
                      }}
                      className="z-[70] flex max-h-[60vh] flex-col overflow-hidden rounded-xl border border-[#9bb9e8] bg-white shadow-xl"
                      tabIndex={-1}
                      role="listbox"
                      aria-multiselectable="true"
                      onKeyDown={(event) => handleDropdownKeyDown(event, () => setStateMenuOpen(false), stateTriggerRef.current)}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          States
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={clearStates} disabled={draftStates.length === 0}>
                          Clear all
                        </Button>
                      </div>
                      <div className="flex-1 space-y-2 overflow-y-auto px-2 py-3">
                        <button
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition',
                            isAllStatesSelected ? 'bg-[#e6f0ff] font-semibold text-[#1d4ed8]' : 'hover:bg-slate-50'
                          )}
                          onClick={clearStates}
                          data-dropdown-option
                          role="option"
                          aria-selected={isAllStatesSelected}
                        >
                          <input
                            type="checkbox"
                            readOnly
                            checked={isAllStatesSelected}
                            tabIndex={-1}
                            className="size-4 rounded border-slate-300 text-[#2563eb]"
                          />
                          <span className="flex-1">{ALL_STATES_LABEL}</span>
                        </button>
                        <div className="space-y-1">
                          {STATE_OPTIONS.map((state) => {
                            const checked = draftStates.includes(state);
                            return (
                              <button
                                key={state}
                                type="button"
                                className={cn(
                                  'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition',
                                  checked ? 'bg-[#e6f0ff] font-semibold text-[#1d4ed8]' : 'hover:bg-slate-50'
                                )}
                                onClick={() => toggleStateValue(state)}
                                data-dropdown-option
                                role="option"
                                aria-selected={checked}
                              >
                                <input
                                  type="checkbox"
                                  readOnly
                                  checked={checked}
                                  tabIndex={-1}
                                  className="size-4 rounded border-slate-300 text-[#2563eb]"
                                />
                                <span className="flex-1">{state}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>,
                    document.body
                  )
                : null}
            </div>
            <div className="relative flex w-full flex-col gap-2 md:w-[150px]">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">
                Year(s)
              </span>
              <button
                type="button"
                ref={yearTriggerRef}
                className={cn(
                  'flex h-10 w-full items-center justify-between rounded-lg border border-[#b7c7ef] bg-white px-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#1d4ed8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40',
                  yearMenuOpen && 'border-[#1d4ed8] ring-2 ring-[#1d4ed8]/30'
                )}
                onClick={() =>
                  setYearMenuOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setTopicMenuOpen(false);
                      setStateMenuOpen(false);
                      setPaperMenuOpen(false);
                      updateYearDropdownPosition();
                    }
                    return next;
                  })
                }
                aria-haspopup="listbox"
                aria-expanded={yearMenuOpen}
              >
                <span className="flex-1 overflow-hidden pr-3">
                  {renderChipSummary(draftYears, ALL_YEARS_LABEL)}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
              {typeof document !== 'undefined' && yearMenuOpen && yearDropdownCoords
                ? createPortal(
                    <div
                      ref={yearDropdownRef}
                      style={{
                        position: 'fixed',
                        top: yearDropdownCoords.top,
                        left: yearDropdownCoords.left,
                        width: yearDropdownCoords.width,
                        maxHeight: '60vh'
                      }}
                      className="z-[70] flex max-h-[60vh] flex-col overflow-hidden rounded-xl border border-[#9bb9e8] bg-white shadow-xl"
                      tabIndex={-1}
                      role="listbox"
                      aria-multiselectable="true"
                      onKeyDown={(event) => handleDropdownKeyDown(event, () => setYearMenuOpen(false), yearTriggerRef.current)}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Years
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={clearYears} disabled={draftYears.length === 0}>
                          Clear all
                        </Button>
                      </div>
                      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
                        <button
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition',
                            isAllYearsSelected ? 'bg-[#e6f0ff] font-semibold text-[#1d4ed8]' : 'hover:bg-slate-50'
                          )}
                          onClick={clearYears}
                          data-dropdown-option
                          role="option"
                          aria-selected={isAllYearsSelected}
                        >
                          <input type="checkbox" readOnly checked={isAllYearsSelected} tabIndex={-1} className="size-4 rounded border-slate-300 text-[#2563eb]" />
                          <span className="flex-1">{ALL_YEARS_LABEL}</span>
                        </button>
                        {yearOptionsDesc.map((year) => {
                          const checked = draftYears.includes(year);
                          return (
                            <button
                              key={year}
                              type="button"
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition',
                                checked ? 'bg-[#e6f0ff] font-semibold text-[#1d4ed8]' : 'hover:bg-slate-50'
                              )}
                              onClick={() => toggleYearValue(year)}
                              data-dropdown-option
                              role="option"
                              aria-selected={checked}
                            >
                              <input type="checkbox" readOnly checked={checked} tabIndex={-1} className="size-4 rounded border-slate-300 text-[#2563eb]" />
                              <span className="flex-1">{year}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>,
                    document.body
                  )
                : null}
            </div>
            <div className="relative flex w-full flex-col gap-2 md:w-[150px]">
              <span className="text-[0.65rem] font-semibold uppercase tracking-[0.18em] text-slate-500">Paper</span>
              <button
                type="button"
                ref={paperTriggerRef}
                className={cn(
                  'flex h-10 w-full items-center justify-between rounded-lg border border-[#b7c7ef] bg-white px-3 text-left text-sm font-semibold text-slate-700 transition hover:border-[#1d4ed8] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#1d4ed8]/40',
                  paperMenuOpen && 'border-[#1d4ed8] ring-2 ring-[#1d4ed8]/30'
                )}
                onClick={() =>
                  setPaperMenuOpen((prev) => {
                    const next = !prev;
                    if (next) {
                      setTopicMenuOpen(false);
                      setStateMenuOpen(false);
                      setYearMenuOpen(false);
                      updatePaperDropdownPosition();
                    }
                    return next;
                  })
                }
                aria-haspopup="listbox"
                aria-expanded={paperMenuOpen}
              >
                <span className="flex-1 overflow-hidden pr-3">
                  {renderChipSummary(draftPapers, ALL_PAPERS_LABEL, (value) => value)}
                </span>
                <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" />
              </button>
              {typeof document !== 'undefined' && paperMenuOpen && paperDropdownCoords
                ? createPortal(
                    <div
                      ref={paperDropdownRef}
                      style={{
                        position: 'fixed',
                        top: paperDropdownCoords.top,
                        left: paperDropdownCoords.left,
                        width: paperDropdownCoords.width,
                        maxHeight: '60vh'
                      }}
                      className="z-[70] flex max-h-[60vh] flex-col overflow-hidden rounded-xl border border-[#9bb9e8] bg-white shadow-xl"
                      tabIndex={-1}
                      role="listbox"
                      aria-multiselectable="true"
                      onKeyDown={(event) => handleDropdownKeyDown(event, () => setPaperMenuOpen(false), paperTriggerRef.current)}
                    >
                      <div className="flex items-center justify-between border-b border-slate-200 px-4 py-2">
                        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
                          Papers
                        </span>
                        <Button type="button" variant="ghost" size="sm" onClick={clearPapers} disabled={draftPapers.length === 0}>
                          Clear all
                        </Button>
                      </div>
                      <div className="flex-1 space-y-1 overflow-y-auto px-2 py-3">
                        <button
                          type="button"
                          className={cn(
                            'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition',
                            isAllPapersSelected ? 'bg-[#e6f0ff] font-semibold text-[#1d4ed8]' : 'hover:bg-slate-50'
                          )}
                          onClick={clearPapers}
                          data-dropdown-option
                          role="option"
                          aria-selected={isAllPapersSelected}
                        >
                          <input type="checkbox" readOnly checked={isAllPapersSelected} tabIndex={-1} className="size-4 rounded border-slate-300 text-[#2563eb]" />
                          <span className="flex-1">{ALL_PAPERS_LABEL}</span>
                        </button>
                        {PAPER_OPTIONS.map((paper) => {
                          const checked = draftPapers.includes(paper.value);
                          return (
                            <button
                              key={paper.value}
                              type="button"
                              className={cn(
                                'flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm text-left transition',
                                checked ? 'bg-[#e6f0ff] font-semibold text-[#1d4ed8]' : 'hover:bg-slate-50'
                              )}
                              onClick={() => togglePaperValue(paper.value)}
                              data-dropdown-option
                              role="option"
                              aria-selected={checked}
                            >
                              <input type="checkbox" readOnly checked={checked} tabIndex={-1} className="size-4 rounded border-slate-300 text-[#2563eb]" />
                              <span className="flex-1">{paper.value}</span>
                              <span className="text-xs text-slate-500">{paper.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>,
                    document.body
                  )
                : null}
            </div>
            <div className="flex w-full justify-end md:ml-auto md:w-auto">
              <Button
                type="button"
                className="flex h-10 w-full items-center justify-center gap-2 rounded-lg bg-[#2563eb] px-6 text-sm font-semibold text-white shadow-sm transition hover:bg-[#1d4ed8] md:w-[130px]"
                onClick={handleSearch}
              >
                <Search className="h-4 w-4" />
                Search
              </Button>
            </div>
          </div>
        </div>
        </div>
      </section>

      <section className="container mx-auto px-6 pb-8 pt-2 md:px-8 md:pt-3">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <aside className="lg:col-span-3">
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
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
            <div className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <div className="flex items-center justify-center gap-6 border-b border-slate-200 bg-[#e7efff] px-5 py-3 md:px-6">
                <Button
                  type="button"
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-sm font-semibold text-slate-600 hover:text-[#1d4ed8]"
                  onClick={handlePrev}
                  disabled={!hasQuestions || currentIndex === 0}
                >
                  <ChevronLeft className="h-5 w-5" />
                  <span>Previous</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className="flex flex-col items-center gap-1 text-sm font-semibold text-slate-600 hover:text-[#1d4ed8]"
                  onClick={handleNext}
                  disabled={!hasQuestions || currentIndex === filteredQuestions.length - 1}
                >
                  <ChevronRight className="h-5 w-5" />
                  <span>Next</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    'flex flex-col items-center gap-1 text-sm font-semibold transition',
                    activeTab === 'question' ? 'text-[#2563eb]' : 'text-slate-600 hover:text-[#1d4ed8]'
                  )}
                  onClick={() => setActiveTab('question')}
                  disabled={!hasQuestions}
                >
                  <List className="h-5 w-5" />
                  <span>Question</span>
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  className={cn(
                    'flex flex-col items-center gap-1 text-sm font-semibold transition',
                    activeTab === 'solution' ? 'text-[#2563eb]' : 'text-slate-600 hover:text-[#1d4ed8]'
                  )}
                  onClick={() => setActiveTab('solution')}
                  disabled={!hasQuestions || !currentQuestion?.solution_img}
                >
                  <KeyRound className="h-5 w-5" />
                  <span>Answer</span>
                </Button>
              </div>

              {hasQuestions && currentQuestion?.chapters && currentQuestion.chapters.length > 0 && (
                <div className="border-b border-slate-200 bg-[#eef5ff] px-5 py-3 text-sm font-semibold text-slate-700 md:px-6">
                  Chapter(s):{' '}
                  <span className="font-normal">
                    {currentQuestion.chapters.map((tag) => formatChapterBanner(tag.chapter)).join(', ')}
                  </span>
                </div>
              )}

              <div className="flex flex-1 items-start justify-center bg-white px-0 py-0">
                {hasQuestions ? (
                  activeTab === 'solution' && !currentQuestion?.solution_img ? (
                    <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 px-6 py-10 text-center text-sm text-slate-500">
                      No solution image available for this question.
                    </div>
                  ) : (
                    <div className="h-[600px] w-full max-w-4xl overflow-y-auto rounded-2xl bg-white">
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
                        className="w-full rounded-2xl"
                      />
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

            </div>
          </article>
        </div>
      </section>

      <footer className="border-t border-slate-200 bg-[#eff3f9]">
        <div className="container mx-auto flex items-center justify-between px-6 py-6 text-sm text-slate-600 md:px-8">
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
