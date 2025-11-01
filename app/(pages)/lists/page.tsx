'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { formatRelativeTime } from '@/lib/time';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { List as ListIcon, MoreVertical, Plus, Search as SearchIcon } from 'lucide-react';

type QuestionList = {
  id: string;
  name: string;
  items: string[];
  createdAt?: string;
  updatedAt?: string;
};

type Question = {
  id: string;
  question_img: string;
  chapters?: ChapterTag[];
};

type ChapterTag = {
  chapter: string;
  subtopics?: string[];
  chapterTitle?: string;
};

type SortOption = 'updated' | 'name' | 'items';

const sortOptions: { value: SortOption; label: string }[] = [
  { value: 'updated', label: 'Last updated' },
  { value: 'name', label: 'A – Z' },
  { value: 'items', label: 'Items' }
];

function normaliseChapterTag(tag: ChapterTag): ChapterTag {
  if (!tag?.chapter) {
    return tag;
  }
  return tag;
}

function formatChapterLabel(chapter: string) {
  const match = chapter.match(/Chapter\s(\d+)/i);
  const code = match ? `CH${match[1].padStart(2, '0')}` : 'CH';
  const title = chapter.split(':').pop()?.trim() ?? chapter;
  return `${code} – ${title}`;
}

function unique(items: string[]) {
  return Array.from(new Set(items.filter((item) => typeof item === 'string')));
}

export default function ListsPage() {
  const router = useRouter();
  const [lists, setLists] = useState<QuestionList[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortOption, setSortOption] = useState<SortOption>('updated');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectMode, setSelectMode] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const toastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);
  const closeMenu = useCallback(() => setMenuOpenId(null), []);
  const [questionMap, setQuestionMap] = useState<Record<string, Question>>({});

  const showToast = useCallback((message: string) => {
    if (toastTimeoutRef.current) {
      clearTimeout(toastTimeoutRef.current);
    }
    setToastMessage(message);
    toastTimeoutRef.current = setTimeout(() => setToastMessage(null), 3000);
  }, []);

  const applyListsResponse = useCallback(async (response: Response) => {
    if (!response.ok) {
      const message = await response.text();
      throw new Error(message || 'Something went wrong.');
    }
    const payload = (await response.json()) as QuestionList[];
    setLists(payload);
    return payload;
  }, []);

  const fetchLists = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/lists', { cache: 'no-store' });
      await applyListsResponse(response);
    } catch (error) {
      console.error('Failed to fetch question lists:', error);
      showToast('Failed to load question lists.');
      setLists([]);
    } finally {
      setLoading(false);
    }
  }, [applyListsResponse, showToast]);

  useEffect(() => {
    fetchLists();
  }, [fetchLists]);

  useEffect(() => {
    const loadQuestions = async () => {
      try {
        const response = await fetch('/api/questions', { cache: 'force-cache' });
        if (!response.ok) {
          throw new Error(`Failed to load questions (status ${response.status})`);
        }
        const data = await response.json();
        const map: Record<string, Question> = {};
        data.forEach((raw: Question) => {
          const chapters = Array.isArray(raw.chapters)
            ? raw.chapters.map((tag) => normaliseChapterTag(tag))
            : [];
          map[raw.id] = {
            ...raw,
            chapters
          };
        });
        setQuestionMap(map);
      } catch (error) {
        console.error('Failed to load questions metadata:', error);
      }
    };

    loadQuestions();
  }, []);

  useEffect(() => {
    if (!menuOpenId) {
      return;
    }
    const handlePointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('[data-list-menu]')) {
        setMenuOpenId(null);
      }
    };
    window.addEventListener('pointerdown', handlePointer);
    return () => window.removeEventListener('pointerdown', handlePointer);
  }, [menuOpenId]);

  useEffect(() => {
    return () => {
      if (toastTimeoutRef.current) {
        clearTimeout(toastTimeoutRef.current);
      }
    };
  }, []);

  const filteredLists = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    const base = term
      ? lists.filter((list) => list.name.toLowerCase().includes(term))
      : [...lists];

    base.sort((a, b) => {
      switch (sortOption) {
        case 'name':
          return a.name.localeCompare(b.name);
        case 'items':
          return b.items.length - a.items.length;
        case 'updated':
        default: {
          const aTime = new Date(a.updatedAt ?? a.createdAt ?? 0).getTime();
          const bTime = new Date(b.updatedAt ?? b.createdAt ?? 0).getTime();
          return bTime - aTime;
        }
      }
    });

    return base;
  }, [lists, searchTerm, sortOption]);

  const isSelectionActive = selectMode && selectedIds.length > 0;

  const toggleSelected = (id: string, next: boolean) => {
    if (!selectMode) {
      return;
    }
    setSelectedIds((prev) => {
      if (next) {
        if (prev.includes(id)) {
          return prev;
        }
        return [...prev, id];
      }
      return prev.filter((item) => item !== id);
    });
  };

  const clearSelection = useCallback(() => setSelectedIds([]), []);

  const enterSelectMode = useCallback(() => {
    setSelectMode(true);
  }, []);

  const exitSelectMode = useCallback(() => {
    setSelectMode(false);
    clearSelection();
  }, [clearSelection]);

  const handleCreate = useCallback(async () => {
    const name = window.prompt('New list name');
    if (!name) {
      return;
    }
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }
    try {
      const response = await fetch('/api/lists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed, items: [] })
      });
      await applyListsResponse(response);
      showToast(`Created '${trimmed}'`);
    } catch (error) {
      console.error(error);
      showToast('Failed to create list.');
    }
  }, [applyListsResponse, showToast]);

  const handleRename = useCallback(
    async (list: QuestionList) => {
      const nextName = window.prompt('Rename list', list.name);
      if (!nextName) {
        return;
      }
      const trimmed = nextName.trim();
      if (!trimmed || trimmed === list.name) {
        return;
      }
      try {
        const response = await fetch(`/api/lists/${list.id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: trimmed })
        });
        await applyListsResponse(response);
        showToast(`Renamed to '${trimmed}'`);
        closeMenu();
      } catch (error) {
        console.error(error);
        showToast('Failed to rename list.');
      }
    },
    [applyListsResponse, closeMenu, showToast]
  );

  const handleDuplicate = useCallback(
    async (list: QuestionList) => {
      const suggested = `${list.name} Copy`;
      const nextName = window.prompt('Duplicate list as', suggested) ?? suggested;
      const trimmed = nextName.trim();
      if (!trimmed) {
        return;
      }
      try {
        const response = await fetch('/api/lists', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ sourceId: list.id, name: trimmed })
        });
        await applyListsResponse(response);
        showToast(`Duplicated as '${trimmed}'`);
        closeMenu();
      } catch (error) {
        console.error(error);
        showToast('Failed to duplicate list.');
      }
    },
    [applyListsResponse, closeMenu, showToast]
  );

  const handleDelete = useCallback(
    async (list: QuestionList) => {
      const confirmed = window.confirm(`Delete the list "${list.name}"?`);
      if (!confirmed) {
        return;
      }
      try {
        const response = await fetch(`/api/lists/${list.id}`, { method: 'DELETE' });
        await applyListsResponse(response);
        showToast(`Deleted '${list.name}'`);
        closeMenu();
      } catch (error) {
        console.error(error);
        showToast('Failed to delete list.');
      }
    },
    [applyListsResponse, closeMenu, showToast]
  );

  const handleBulkDelete = useCallback(async () => {
    if (selectedIds.length === 0) {
      return;
    }
    const confirmed = window.confirm(`Delete ${selectedIds.length} list${selectedIds.length === 1 ? '' : 's'}?`);
    if (!confirmed) {
      return;
    }
    try {
      for (const id of selectedIds) {
        const response = await fetch(`/api/lists/${id}`, { method: 'DELETE' });
        await applyListsResponse(response);
      }
      showToast(`Deleted ${selectedIds.length} list${selectedIds.length === 1 ? '' : 's'}.`);
      exitSelectMode();
    } catch (error) {
      console.error(error);
      showToast('Failed to delete selected lists.');
    }
  }, [applyListsResponse, exitSelectMode, selectedIds, showToast]);

  const handleBulkMove = useCallback(async () => {
    if (selectedIds.length === 0) {
      return;
    }
    const destinations = lists.filter((list) => !selectedIds.includes(list.id));
    if (destinations.length === 0) {
      showToast('No destination lists available.');
      return;
    }
    const destinationName = window.prompt(
      'Move selected lists into which list? Enter exact name.',
      destinations[0].name
    );
    if (!destinationName) {
      return;
    }
    const destination = destinations.find((list) => list.name === destinationName.trim());
    if (!destination) {
      showToast('Destination list not found.');
      return;
    }

    const sources = lists.filter((list) => selectedIds.includes(list.id));
    const additionalItems = unique(
      sources.flatMap((list) => list.items)
    );

    try {
      await fetch(`/api/lists/${destination.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ addItems: additionalItems })
      }).then(applyListsResponse);

      for (const id of selectedIds) {
        if (id === destination.id) {
          continue;
        }
        await fetch(`/api/lists/${id}`, { method: 'DELETE' }).then(applyListsResponse);
      }

      showToast(`Moved ${selectedIds.length} list${selectedIds.length === 1 ? '' : 's'} to '${destination.name}'.`);
      exitSelectMode();
    } catch (error) {
      console.error(error);
      showToast('Failed to move lists.');
    }
  }, [applyListsResponse, exitSelectMode, lists, selectedIds, showToast]);

  const renderThumbnail = (list: QuestionList) => {
    const firstQuestion = list.items
      .map((id) => questionMap[id])
      .find((question) => question && question.question_img);
    if (!firstQuestion) {
      return (
        <div className="flex h-full w-full items-center justify-center rounded-xl bg-slate-200 text-xs font-semibold text-slate-500">
          No image
        </div>
      );
    }
    return (
      <Image
        src={firstQuestion.question_img}
        alt={list.name}
        fill
        sizes="72px"
        className="object-cover"
        draggable={false}
      />
    );
  };

  const getChapterChips = (list: QuestionList) => {
    const names = unique(
      list.items.flatMap((id) => {
        const question = questionMap[id];
        if (!question?.chapters) {
          return [] as string[];
        }
        return question.chapters.map((tag) => formatChapterLabel(tag.chapter));
      })
    );
    return names.slice(0, 3);
  };

  const skeletons = Array.from({ length: 6 });

  const handleSearchChange = (event: ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
  };

  const handleSortChange = (event: ChangeEvent<HTMLSelectElement>) => {
    const next = event.target.value as SortOption;
    setSortOption(next);
  };

  const handleCardNavigation = (list: QuestionList) => {
    if (selectMode) {
      return;
    }
    closeMenu();
    router.push(`/lists/${list.id}`);
  };

  const handleViewList = (list: QuestionList) => {
    closeMenu();
    router.push(`/lists/${list.id}`);
  };

  const handleToggleSelect = (id: string) => (event: ChangeEvent<HTMLInputElement>) => {
    toggleSelected(id, event.target.checked);
  };

  const toggleMenuFor = (id: string) => (event: MouseEvent<HTMLButtonElement>) => {
    event.stopPropagation();
    setMenuOpenId((current) => (current === id ? null : id));
  };

  const listsCount = filteredLists.length;

  const renderMetaChips = (list: QuestionList) => {
    const chapterChips = getChapterChips(list);
    const totalChapterTags = unique(
      list.items.flatMap((id) => {
        const question = questionMap[id];
        if (!question?.chapters) {
          return [] as string[];
        }
        return question.chapters.map((tag) => tag.chapter);
      })
    );
    const remaining = Math.max(0, totalChapterTags.length - chapterChips.length);
    return (
      <div className="mt-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full bg-[#e9efff] px-2 py-1 text-xs font-semibold text-[#1d4ed8]">
          {list.items.length} item{list.items.length === 1 ? '' : 's'}
        </span>
        {chapterChips.map((chip) => (
          <span key={chip} className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
            {chip}
          </span>
        ))}
        {remaining > 0 && (
          <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-500">
            +{remaining}
          </span>
        )}
        <span className="rounded-full bg-white px-2 py-1 text-xs text-slate-500">
          {formatRelativeTime(list.updatedAt ?? list.createdAt)}
        </span>
      </div>
    );
  };

  const handleCardKeyDown = (list: QuestionList) => (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      handleCardNavigation(list);
    }
  };

  return (
    <>
      <main className="mx-auto max-w-6xl px-4 py-8 md:px-6 lg:py-12">
        <div className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
            <div className="space-y-1">
              <h1 className="text-3xl font-bold text-slate-900">Question Lists</h1>
              <p className="text-sm text-slate-500 md:text-base">
                Organise saved questions into curated sets for focused revision.
              </p>
            </div>
            <Button type="button" onClick={handleCreate} className="self-start md:self-auto">
              <Plus className="h-4 w-4" />
              New List
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div className="flex w-full flex-col gap-3 md:flex-row md:items-center md:gap-4">
                <div className="relative w-full md:max-w-md">
                  <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input
                    type="search"
                    value={searchTerm}
                    onChange={handleSearchChange}
                    placeholder="Search lists"
                    className="w-full rounded-xl border border-slate-200 bg-[#f8fbff] py-2 pl-10 pr-4 text-sm text-slate-700 shadow-sm transition focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <label
                    htmlFor="lists-sort"
                    className="text-[11px] font-semibold uppercase tracking-wider text-slate-500"
                  >
                    Sort
                  </label>
                  <select
                    id="lists-sort"
                    value={sortOption}
                    onChange={handleSortChange}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 shadow-sm focus:border-[#2563eb] focus:outline-none focus:ring-2 focus:ring-[#2563eb]/30"
                  >
                    {sortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant={selectMode ? 'secondary' : 'outline'}
                  onClick={selectMode ? exitSelectMode : enterSelectMode}
                  disabled={loading || (!selectMode && listsCount === 0)}
                >
                  {selectMode ? 'Exit select mode' : 'Select'}
                </Button>
              </div>
            </div>
          </div>

          {isSelectionActive && (
            <div className="sticky top-24 z-20 flex items-center justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm">
              <span className="text-sm font-semibold text-slate-700">{selectedIds.length} selected</span>
              <div className="flex items-center gap-2">
                <Button type="button" variant="outline" onClick={handleBulkMove}>
                  Move to list
                </Button>
                <Button type="button" variant="destructive" onClick={handleBulkDelete}>
                  Delete
                </Button>
                <Button type="button" variant="ghost" onClick={exitSelectMode}>
                  Cancel
                </Button>
              </div>
            </div>
          )}

          <section className="min-h-[360px]">
            {loading ? (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {skeletons.map((_, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm"
                  >
                    <div className="h-[72px] w-[72px] animate-pulse rounded-xl bg-slate-200" />
                    <div className="flex-1 space-y-3">
                      <div className="h-4 w-3/5 animate-pulse rounded bg-slate-200" />
                      <div className="h-3 w-2/5 animate-pulse rounded bg-slate-200" />
                      <div className="h-8 w-full animate-pulse rounded bg-slate-200" />
                    </div>
                  </div>
                ))}
              </div>
            ) : listsCount === 0 ? (
              <div className="flex flex-col items-center justify-center gap-6 rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-16 text-center shadow-sm">
                <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#e9efff] text-[#1d4ed8]">
                  <ListIcon className="h-10 w-10" />
                </div>
                <div className="space-y-2">
                  <h2 className="text-xl font-semibold text-slate-800">You don&apos;t have any lists yet.</h2>
                  <p className="text-sm text-slate-500">
                    Create a list to collect questions and build customised practice sessions.
                  </p>
                </div>
                <div className="flex flex-col items-center gap-2">
                  <Button type="button" onClick={handleCreate}>
                    <Plus className="h-4 w-4" />
                    New List
                  </Button>
                  <button
                    type="button"
                    className="text-sm font-semibold text-[#2563eb] transition hover:text-[#1d4ed8]"
                    onClick={() => router.push('/')}
                  >
                    Add questions from the Topical page
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                {filteredLists.map((list) => {
                  const checked = selectedIds.includes(list.id);
                  return (
                    <div
                      key={list.id}
                      role="button"
                      tabIndex={selectMode ? -1 : 0}
                      className={cn(
                        'relative flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus:ring-2 focus:ring-[#2563eb]/40',
                        selectMode && 'ring-0'
                      )}
                      onClick={() => handleCardNavigation(list)}
                      onKeyDown={handleCardKeyDown(list)}
                    >
                      <div className="flex h-full w-6 flex-shrink-0 items-start justify-center pt-1">
                        {selectMode ? (
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={handleToggleSelect(list.id)}
                            onClick={(event) => event.stopPropagation()}
                            className="size-4 rounded border-slate-300 text-[#2563eb]"
                          />
                        ) : (
                          <span className="inline-block h-4 w-4" aria-hidden />
                        )}
                      </div>
                      <div className="flex w-full items-start gap-4">
                        <div className="relative h-[72px] w-[72px] flex-shrink-0 overflow-hidden rounded-xl bg-slate-200">
                          {renderThumbnail(list)}
                        </div>
                        <div className="flex min-w-0 flex-1 flex-col gap-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <h3 className="truncate text-lg font-semibold text-slate-800">{list.name}</h3>
                              {renderMetaChips(list)}
                            </div>
                            <div className="flex flex-shrink-0 items-center gap-2">
                              <Button
                                type="button"
                                size="sm"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  handleViewList(list);
                                }}
                              >
                                View
                              </Button>
                              <div className="relative" data-list-menu>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="text-slate-400 hover:text-slate-600"
                                  onClick={toggleMenuFor(list.id)}
                                >
                                  <MoreVertical className="h-4 w-4" />
                                </Button>
                                {menuOpenId === list.id && (
                                  <div className="absolute right-0 top-full z-30 mt-2 w-40 rounded-lg border border-slate-200 bg-white p-1 shadow-lg">
                                    <button
                                      type="button"
                                      className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        closeMenu();
                                        handleRename(list);
                                      }}
                                    >
                                      Rename
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full rounded-md px-3 py-2 text-left text-sm text-slate-600 transition hover:bg-slate-100"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        closeMenu();
                                        handleDuplicate(list);
                                      }}
                                    >
                                      Duplicate
                                    </button>
                                    <button
                                      type="button"
                                      className="w-full rounded-md px-3 py-2 text-left text-sm text-red-600 transition hover:bg-red-50"
                                      onClick={(event) => {
                                        event.stopPropagation();
                                        closeMenu();
                                        handleDelete(list);
                                      }}
                                    >
                                      Delete
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {toastMessage && (
        <div
          className="fixed bottom-6 right-6 z-50 rounded-xl bg-slate-900 px-4 py-3 text-sm font-medium text-white shadow-lg"
          role="status"
          aria-live="assertive"
        >
          {toastMessage}
        </div>
      )}
    </>
  );
}
