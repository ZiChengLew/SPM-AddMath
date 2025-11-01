'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { formatRelativeTime } from '@/lib/time';
import Image from 'next/image';
import { ArrowLeft, Loader2 } from 'lucide-react';

type QuestionList = {
  id: string;
  name: string;
  items: string[];
  createdAt?: string;
  updatedAt?: string;
};

type ChapterTag = {
  chapter: string;
};

type Question = {
  id: string;
  paper_id?: string;
  question_number?: number;
  year?: number;
  question_img?: string;
  chapters?: ChapterTag[];
};

export default function QuestionListDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [list, setList] = useState<QuestionList | null>(null);
  const [questionMap, setQuestionMap] = useState<Record<string, Question>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const listId = params?.id;
    if (!listId) {
      setError('List not found.');
      setLoading(false);
      return;
    }

    const load = async () => {
      setLoading(true);
      try {
        const [listResponse, questionsResponse] = await Promise.all([
          fetch(`/api/lists/${listId}`, { cache: 'no-store' }),
          fetch('/api/questions', { cache: 'force-cache' })
        ]);

        if (!listResponse.ok) {
          const message = await listResponse.text();
          throw new Error(message || 'Unable to load the list.');
        }

        const payload = (await listResponse.json()) as QuestionList;
        setList(payload);

        if (questionsResponse.ok) {
          const questions = (await questionsResponse.json()) as Question[];
          const map: Record<string, Question> = {};
          questions.forEach((question) => {
            map[question.id] = question;
          });
          setQuestionMap(map);
        } else {
          setQuestionMap({});
        }

        setError(null);
      } catch (err) {
        console.error(err);
        setError(err instanceof Error ? err.message : 'Failed to load the list.');
        setList(null);
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [params?.id]);

  const chapterSummary = useMemo(() => {
    if (!list) {
      return [];
    }
    const chapters = new Set<string>();
    list.items.forEach((itemId) => {
      const question = questionMap[itemId];
      question?.chapters?.forEach((tag) => {
        if (tag.chapter) {
          chapters.add(tag.chapter);
        }
      });
    });
    return Array.from(chapters).slice(0, 4);
  }, [list, questionMap]);

  const handleBack = () => router.push('/lists');

  return (
    <main className="mx-auto max-w-5xl px-4 py-8 md:px-6 lg:py-12">
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <Button type="button" variant="ghost" size="sm" onClick={handleBack} className="text-slate-600">
            <ArrowLeft className="h-4 w-4" />
            Back to lists
          </Button>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-slate-600 shadow-sm">
            <Loader2 className="h-6 w-6 animate-spin" />
            <p className="text-sm">Loading list…</p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center gap-4 rounded-2xl border border-slate-200 bg-white px-6 py-16 text-center shadow-sm">
            <p className="text-sm text-slate-600">{error}</p>
            <Button type="button" onClick={handleBack}>
              Return to lists
            </Button>
          </div>
        ) : list ? (
          <div className="flex flex-col gap-6">
            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                <div className="space-y-2">
                  <h1 className="text-2xl font-bold text-slate-900">{list.name}</h1>
                  <div className="flex flex-wrap items-center gap-2 text-sm text-slate-500">
                    <span>{list.items.length} question{list.items.length === 1 ? '' : 's'}</span>
                    <span>•</span>
                    <span>{formatRelativeTime(list.updatedAt ?? list.createdAt)}</span>
                  </div>
                  {chapterSummary.length > 0 && (
                    <div className="flex flex-wrap gap-2">
                      {chapterSummary.map((chapter) => (
                        <span key={chapter} className="rounded-full bg-[#e9efff] px-2 py-1 text-xs font-semibold text-[#1d4ed8]">
                          {chapter}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-800">Questions</h2>
                <span className="text-sm text-slate-500">{list.items.length} total</span>
              </div>

              {list.items.length === 0 ? (
                <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-slate-50 px-4 py-10 text-center text-sm text-slate-500">
                  This list doesn&apos;t have any questions yet. Add questions from the Topical page to get started.
                </div>
              ) : (
                <div className="mt-6 space-y-4">
                  {list.items.map((itemId) => {
                    const question = questionMap[itemId];
                    const badge = question?.question_number
                      ? `Q${String(question.question_number).padStart(2, '0')}`
                      : 'Question';
                    return (
                      <div
                        key={itemId}
                        className="flex items-center gap-4 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 shadow-sm"
                      >
                        <div className="relative flex h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl bg-white">
                          {question?.question_img ? (
                            <Image
                              src={question.question_img}
                              alt={badge}
                              fill
                              sizes="64px"
                              className="object-cover"
                              draggable={false}
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-xs text-slate-400">
                              No image
                            </div>
                          )}
                        </div>
                        <div className="flex flex-1 flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="rounded-full bg-white px-2 py-1 text-xs font-semibold text-[#1d4ed8]">
                              {question?.paper_id ?? 'Question'}
                            </span>
                            <span className="text-sm font-semibold text-slate-800">{badge}</span>
                            {question?.year ? (
                              <span className="text-xs text-slate-500">Year {question.year}</span>
                            ) : null}
                          </div>
                          {question?.chapters?.length ? (
                            <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                              {question.chapters.slice(0, 2).map((chapter) => (
                                <span key={chapter.chapter} className="rounded-full bg-slate-100 px-2 py-1">
                                  {chapter.chapter}
                                </span>
                              ))}
                            </div>
                          ) : (
                            <p className="text-xs text-slate-500">No chapter metadata</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        ) : null}
      </div>
    </main>
  );
}
