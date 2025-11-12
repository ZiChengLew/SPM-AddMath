'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import type { LucideIcon } from 'lucide-react';
import { BadgeCheck, Calendar, Eye, FileSpreadsheet, Pencil, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TRACKER_DEFAULT_USER_ID } from '@/lib/tracker/config';
import type { ResultRecord, ResultUpsertPayload } from '@/lib/tracker/types';

type PaperCode = 'P1' | 'P2';

type QuestionEntry = {
  section: string;
  question: number;
  max: number;
  score: number | null;
};

type PaperResult = {
  id: string;
  state: string;
  year: number;
  paper: PaperCode;
  date: string;
  timeSpent: number | null;
  notes: string | null;
  byQuestion: QuestionEntry[];
};

type FormMode = 'create' | 'edit' | 'view';

const STATE_OPTIONS = [
  'All States',
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
  'Putrajaya',
  'SBP'
] as const;

const YEAR_OPTIONS = ['All Years', '2025', '2024', '2023', '2022'] as const;
const PAPER_OPTIONS: readonly PaperCode[] = ['P1', 'P2'];

const DATE_RANGE_OPTIONS = [
  { value: '30', label: 'Last 30 days' },
  { value: '90', label: 'Last 90 days' },
  { value: 'all', label: 'All' }
] as const;

const PAPER_BLUEPRINT: Record<PaperCode, { section: string; question: number; max: number }[]> = {
  P1: [
    { section: 'A', question: 1, max: 5 },
    { section: 'A', question: 2, max: 7 },
    { section: 'A', question: 3, max: 6 },
    { section: 'A', question: 4, max: 6 },
    { section: 'A', question: 5, max: 5 },
    { section: 'A', question: 6, max: 5 },
    { section: 'A', question: 7, max: 5 },
    { section: 'A', question: 8, max: 5 },
    { section: 'A', question: 9, max: 5 },
    { section: 'A', question: 10, max: 5 },
    { section: 'A', question: 11, max: 6 },
    { section: 'A', question: 12, max: 6 },
    { section: 'B', question: 13, max: 8 },
    { section: 'B', question: 14, max: 8 },
    { section: 'B', question: 15, max: 8 }
  ],
  P2: [
    { section: 'A', question: 1, max: 6 },
    { section: 'A', question: 2, max: 6 },
    { section: 'A', question: 3, max: 6 },
    { section: 'A', question: 4, max: 7 },
    { section: 'A', question: 5, max: 7 },
    { section: 'A', question: 6, max: 7 },
    { section: 'A', question: 7, max: 7 },
    { section: 'B', question: 8, max: 12 },
    { section: 'B', question: 9, max: 12 },
    { section: 'B', question: 10, max: 12 },
    { section: 'B', question: 11, max: 12 }
  ]
};

const todayIso = () => new Date().toISOString().slice(0, 10);

function toIsoDate(value: string) {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toISOString().slice(0, 10);
}

function sumScores(entries: QuestionEntry[]) {
  return entries.reduce(
    (acc, item) => {
      return {
        totalScore: acc.totalScore + (item.score ?? 0),
        totalMax: acc.totalMax + item.max,
        questionsCompleted: acc.questionsCompleted + (item.score !== null ? 1 : 0)
      };
    },
    { totalScore: 0, totalMax: 0, questionsCompleted: 0 }
  );
}

function generateQuestionEntries(paper: PaperCode) {
  return PAPER_BLUEPRINT[paper].map((item) => ({ ...item, score: null }));
}

type StatusBanner =
  | { type: 'success'; message: string }
  | { type: 'error'; message: string }
  | null;

export default function TrackerPapersPage() {
  const [results, setResults] = useState<PaperResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<(typeof STATE_OPTIONS)[number]>('All States');
  const [yearFilter, setYearFilter] = useState<(typeof YEAR_OPTIONS)[number]>('All Years');
  const [paperFilter, setPaperFilter] = useState<PaperCode | 'All'>('All');
  const [dateFilter, setDateFilter] = useState<(typeof DATE_RANGE_OPTIONS)[number]['value']>('30');
  const [searchTerm, setSearchTerm] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [formMode, setFormMode] = useState<FormMode>('create');
  const [activeResultId, setActiveResultId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [formState, setFormState] = useState<PaperResult>({
    id: '',
    state: 'Selangor',
    year: new Date().getFullYear(),
    paper: 'P1',
    date: todayIso(),
    timeSpent: null,
    notes: '',
    byQuestion: generateQuestionEntries('P1')
  });
  const [status, setStatus] = useState<StatusBanner>(null);
  const userId = TRACKER_DEFAULT_USER_ID;

  const loadResults = useCallback(async () => {
    try {
      setLoading(true);
      setLoadError(null);
      const response = await fetch('/api/tracker/results', { cache: 'no-store' });
      if (!response.ok) {
        throw new Error('Failed to load results');
      }
      const json = (await response.json()) as { results?: ResultRecord[] };
      const mapped = (json.results ?? []).map(mapRecordToPaperResult);
      setResults(mapped);
    } catch (error) {
      setLoadError((error as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadResults();
  }, [loadResults]);

  const filteredResults = useMemo(() => {
    const now = new Date();
    const filtered = results
      .filter((result) => {
        if (stateFilter !== 'All States' && result.state !== stateFilter) {
          return false;
        }
        if (yearFilter !== 'All Years' && result.year !== Number(yearFilter)) {
          return false;
        }
        if (paperFilter !== 'All' && result.paper !== paperFilter) {
          return false;
        }
        if (dateFilter !== 'all') {
          const days = Number(dateFilter);
          const cutoff = new Date(now);
          cutoff.setDate(cutoff.getDate() - days);
          if (new Date(result.date) < cutoff) {
            return false;
          }
        }
        if (searchTerm.trim()) {
          const query = searchTerm.toLowerCase();
          const haystack = `${result.state} ${result.year} ${result.paper} ${result.notes ?? ''}`.toLowerCase();
          if (!haystack.includes(query)) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    return filtered;
  }, [results, stateFilter, yearFilter, paperFilter, dateFilter, searchTerm]);

  const stateOptionsForSelect = STATE_OPTIONS.map((state) => ({
    value: state,
    label: state
  }));

  const yearOptionsForSelect = YEAR_OPTIONS.map((year) => ({
    value: year,
    label: year
  }));

  const { totalScore, totalMax } = sumScores(formState.byQuestion);

  const questionsCompleted = formState.byQuestion.filter((item) => item.score !== null).length;

  const closeModal = useCallback(() => {
    setModalOpen(false);
    setActiveResultId(null);
    setFormMode('create');
    setSaving(false);
    setFormState({
      id: '',
      state: 'Selangor',
      year: new Date().getFullYear(),
      paper: 'P1',
      date: todayIso(),
      timeSpent: null,
      notes: '',
      byQuestion: generateQuestionEntries('P1')
    });
  }, []);

  const handleEdit = (result: PaperResult) => {
    setFormState({
      ...result,
      byQuestion: result.byQuestion.map((entry) => ({ ...entry }))
    });
    setFormMode('edit');
    setActiveResultId(result.id);
    setStatus(null);
    setSaving(false);
    setModalOpen(true);
  };

  const handleView = (result: PaperResult) => {
    setFormState({
      ...result,
      byQuestion: result.byQuestion.map((entry) => ({ ...entry }))
    });
    setFormMode('view');
    setActiveResultId(result.id);
    setStatus(null);
    setSaving(false);
    setModalOpen(true);
  };

  const handleDelete = useCallback(
    async (resultId: string) => {
      try {
        const response = await fetch(`/api/tracker/results/${resultId}`, {
          method: 'DELETE'
        });
        if (!response.ok) {
          throw new Error('Failed to delete result');
        }
        setResults((prev) => prev.filter((item) => item.id !== resultId));
        setStatus({ type: 'success', message: 'Result deleted.' });
        if (activeResultId === resultId) {
          closeModal();
        }
      } catch (error) {
        setStatus({ type: 'error', message: (error as Error).message });
      }
    },
    [activeResultId, closeModal]
  );

  const handleAdd = () => {
    setFormState({
      id: '',
      state: 'Selangor',
      year: new Date().getFullYear(),
      paper: 'P1',
      date: todayIso(),
      timeSpent: null,
      notes: '',
      byQuestion: generateQuestionEntries('P1')
    });
    setFormMode('create');
    setActiveResultId(null);
    setStatus(null);
    setSaving(false);
    setModalOpen(true);
  };

  const handlePaperChange = (paper: PaperCode) => {
    setFormState((prev) => ({
      ...prev,
      paper,
      byQuestion: generateQuestionEntries(paper)
    }));
  };

  const handleSave = async () => {
    if (formMode === 'view') {
      closeModal();
      return;
    }

    if (!formState.state || !formState.year || !formState.paper || !formState.date) {
      setStatus({ type: 'error', message: 'Please fill in all required fields.' });
      return;
    }

    try {
      setSaving(true);
      const payload = buildPayload(formState, userId);
      const response = await fetch('/api/tracker/results', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const errorBody = await response.json().catch(() => ({}));
        throw new Error(errorBody.error ?? 'Failed to save result');
      }
      const json = (await response.json()) as { result: ResultRecord };
      const saved = mapRecordToPaperResult(json.result);
      setResults((prev) => upsertResultList(prev, saved));
      setStatus({
        type: 'success',
        message: formMode === 'edit' ? 'Result updated (latest attempt kept).' : 'Result saved (latest attempt kept).'
      });
      closeModal();
    } catch (error) {
      setStatus({ type: 'error', message: (error as Error).message });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-8">
      <section className="flex flex-col justify-between gap-6 rounded-3xl bg-white p-8 shadow-sm lg:flex-row lg:items-center">
        <div>
          <div className="flex items-center gap-3 text-[#1d4ed8]">
            <FileSpreadsheet className="h-6 w-6" />
            <p className="text-sm font-semibold uppercase tracking-wide">Papers</p>
          </div>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Record your latest scores by question</h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600">
            Save one up-to-date attempt per paper. Overwrites happen automatically, so you always see the freshest data in the dashboard.
          </p>
        </div>
        <Button
          type="button"
          className="rounded-full bg-[#1d4ed8] px-6 py-6 text-base font-semibold text-white shadow-lg shadow-blue-200 hover:bg-[#1e40af]"
          onClick={handleAdd}
        >
          <Plus className="mr-2 h-5 w-5" />
          Add Result
        </Button>
      </section>

      {loadError && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>Failed to load results. {loadError}</span>
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm transition hover:text-rose-700"
            onClick={loadResults}
          >
            Retry
          </button>
        </div>
      )}

      {status && (
        <div
          className={cn(
            'flex items-center justify-between rounded-2xl border px-4 py-3 text-sm',
            status.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-700'
              : 'border-rose-200 bg-rose-50 text-rose-700'
          )}
        >
          <span>{status.message}</span>
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-slate-500 shadow-sm transition hover:text-slate-700"
            onClick={() => setStatus(null)}
          >
            Dismiss
          </button>
        </div>
      )}

      <section className="rounded-3xl bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <FilterSelect
              label="State"
              value={stateFilter}
              onValueChange={(value) => setStateFilter(value as (typeof STATE_OPTIONS)[number])}
              options={stateOptionsForSelect}
            />
            <FilterSelect
              label="Year"
              value={yearFilter}
              onValueChange={(value) => setYearFilter(value as (typeof YEAR_OPTIONS)[number])}
              options={yearOptionsForSelect}
            />
            <FilterSelect
              label="Paper"
              value={paperFilter}
              onValueChange={(value) => setPaperFilter(value as PaperCode | 'All')}
              options={[{ value: 'All', label: 'All Papers' }, ...PAPER_OPTIONS.map((paper) => ({ value: paper, label: paper }))]}
            />
            <FilterSelect
              label="Date Range"
              value={dateFilter}
              onValueChange={(value) => setDateFilter(value as (typeof DATE_RANGE_OPTIONS)[number]['value'])}
              options={DATE_RANGE_OPTIONS.map((option) => ({ value: option.value, label: option.label }))}
            />
          </div>
          <div className="relative w-full max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
            <input
              type="search"
              placeholder="Search by state, year, notes…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm text-slate-700 placeholder:text-slate-400 focus:border-[#1d4ed8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
            />
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <Th>Date</Th>
                <Th>State</Th>
                <Th>Year</Th>
                <Th>Paper</Th>
                <Th>Questions Done</Th>
                <Th>Total / Max</Th>
                <Th>%</Th>
                <Th>Time (min)</Th>
                <Th>Notes</Th>
                <Th className="text-right">Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-sm text-slate-500">
                    Loading results...
                  </td>
                </tr>
              ) : loadError ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-sm text-rose-600">
                    Unable to display results. Please retry above.
                  </td>
                </tr>
              ) : filteredResults.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-14 text-center text-sm text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      <BadgeCheck className="h-8 w-8 text-slate-300" />
                      <p>No results match the filters. Try adjusting your selections.</p>
                      <Button
                        type="button"
                        variant="outline"
                        className="mt-2 border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                        onClick={handleAdd}
                      >
                        Add your first result
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredResults.map((result) => {
                  const totals = sumScores(result.byQuestion);
                  const percent = totals.totalMax === 0 ? 0 : Math.round((totals.totalScore / totals.totalMax) * 100);
                  const questionsTotal = result.byQuestion.length;
                  return (
                    <tr key={result.id} className="transition hover:bg-slate-50/70">
                      <Td>{toIsoDate(result.date)}</Td>
                      <Td>
                        <span className="inline-flex rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-semibold text-[#1d4ed8]">
                          {result.state}
                        </span>
                      </Td>
                      <Td>{result.year}</Td>
                      <Td>{result.paper}</Td>
                      <Td>
                        {totals.questionsCompleted}/{questionsTotal}
                      </Td>
                      <Td>
                        {totals.totalScore} / {totals.totalMax}
                      </Td>
                      <Td>
                        <span className="font-semibold text-[#1d4ed8]">{percent}%</span>
                      </Td>
                      <Td>{result.timeSpent ?? '—'}</Td>
                      <Td className="max-w-xs truncate text-sm text-slate-500">{result.notes ?? '—'}</Td>
                      <Td className="space-x-2 text-right">
                        <RowActionButton icon={Eye} label="View" onClick={() => handleView(result)} />
                        <RowActionButton icon={Pencil} label="Edit" onClick={() => handleEdit(result)} />
                        <RowActionButton icon={Trash2} label="Delete" variant="danger" onClick={() => handleDelete(result.id)} />
                      </Td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 px-4 py-6">
          <div className="flex h-full max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">
            <div className="flex items-start justify-between border-b border-slate-200 px-8 py-6">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-[#1d4ed8]">
                  {formMode === 'create' ? 'New Result' : formMode === 'edit' ? 'Edit Result' : 'View Result'}
                </p>
                <h3 className="mt-2 text-2xl font-bold text-slate-900">
                  {formState.state} {formState.year} {formState.paper}
                </h3>
                <p className="mt-1 text-sm text-slate-500">
                  This replaces your previous attempt for the same state, year and paper.
                </p>
              </div>
              <button
                type="button"
                onClick={closeModal}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-sm font-semibold text-slate-500 shadow-sm transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
              >
                Close
              </button>
            </div>

            <div className="scrollable flex-1 overflow-y-auto px-8 py-6">
              <div className="grid gap-6 lg:grid-cols-3">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">State</label>
                  <Select
                    value={formState.state}
                    onValueChange={(value) => setFormState((prev) => ({ ...prev, state: value }))}
                    disabled={formMode === 'view'}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-700">
                      {STATE_OPTIONS.filter((option) => option !== 'All States').map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Year</label>
                  <input
                    type="number"
                    value={formState.year}
                    disabled={formMode === 'view'}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        year: Number(event.target.value)
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 focus:border-[#1d4ed8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Paper</label>
                  <Select
                    value={formState.paper}
                    onValueChange={(value) => handlePaperChange(value as PaperCode)}
                    disabled={formMode === 'view'}
                  >
                    <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="rounded-xl border-slate-200 bg-white text-slate-700">
                      {PAPER_OPTIONS.map((paper) => (
                        <SelectItem key={paper} value={paper}>
                          {paper}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Date done</label>
                  <div className="relative">
                    <Calendar className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <input
                      type="date"
                      value={toIsoDate(formState.date)}
                      disabled={formMode === 'view'}
                      onChange={(event) =>
                        setFormState((prev) => ({
                          ...prev,
                          date: event.target.value
                        }))
                      }
                      className="w-full rounded-xl border border-slate-200 bg-slate-50 py-2 pl-10 pr-4 text-sm font-semibold text-slate-700 focus:border-[#1d4ed8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Time spent (minutes)</label>
                  <input
                    type="number"
                    min={0}
                    value={formState.timeSpent ?? ''}
                    disabled={formMode === 'view'}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        timeSpent: event.target.value === '' ? null : Number(event.target.value)
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm font-semibold text-slate-700 focus:border-[#1d4ed8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase text-slate-500">Notes</label>
                  <textarea
                    rows={3}
                    value={formState.notes ?? ''}
                    disabled={formMode === 'view'}
                    onChange={(event) =>
                      setFormState((prev) => ({
                        ...prev,
                        notes: event.target.value
                      }))
                    }
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-2 text-sm text-slate-700 focus:border-[#1d4ed8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
                    placeholder="Optional notes on tricky questions, careless mistakes, exam conditions…"
                  />
                </div>
              </div>

              <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50">
                <header className="border-b border-slate-200 bg-slate-100 px-6 py-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Untuk Kegunaan Pemeriksa</p>
                </header>
                <div className="max-h-[320px] overflow-y-auto">
                  <table className="min-w-full text-sm">
                    <thead className="bg-white">
                      <tr>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Bahagian</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Nombor Soalan</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Markah Penuh</th>
                        <th className="border-b border-slate-200 px-4 py-3 text-left font-semibold text-slate-600">Markah Diperolehi</th>
                      </tr>
                    </thead>
                    <tbody className="bg-white">
                      {formState.byQuestion.map((entry, index) => (
                        <tr key={`${entry.section}-${entry.question}`}>
                          <td className="border-b border-slate-200 px-4 py-3">{entry.section}</td>
                          <td className="border-b border-slate-200 px-4 py-3">Soalan {entry.question}</td>
                          <td className="border-b border-slate-200 px-4 py-3">{entry.max}</td>
                          <td className="border-b border-slate-200 px-4 py-3">
                            <input
                              type="number"
                              min={0}
                              max={entry.max}
                              step={1}
                              value={entry.score ?? ''}
                              disabled={formMode === 'view'}
                              onChange={(event) => {
                                const raw = event.target.value;
                                const value = raw === '' ? null : Number(raw);
                                setFormState((prev) => {
                                  const next = [...prev.byQuestion];
                                  next[index] = { ...next[index], score: value };
                                  return { ...prev, byQuestion: next };
                                });
                              }}
                              className="w-24 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm font-semibold text-slate-700 focus:border-[#1d4ed8] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#1d4ed8]/30"
                            />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <footer className="flex items-center justify-between gap-4 border-t border-slate-200 bg-white px-6 py-4">
                  <div className="text-sm text-slate-500">
                    Attempted{' '}
                    <span className="font-semibold text-slate-700">
                      {questionsCompleted}/{formState.byQuestion.length}
                    </span>{' '}
                    questions
                  </div>
                  <div className="text-lg font-semibold text-slate-900">
                    Total: <span className="text-[#1d4ed8]">{formTotalDisplay(totalScore, totalMax)}</span>
                  </div>
                </footer>
              </div>
            </div>

            <div className="border-t border-slate-200 bg-white px-8 py-5">
              <div className="flex flex-col justify-between gap-4 md:flex-row md:items-center">
                <div className="flex items-center gap-3 text-sm text-slate-600">
                  <div className="rounded-full bg-blue-50 px-3 py-1 font-semibold text-[#1d4ed8]">
                    {formTotalDisplay(totalScore, totalMax)}
                  </div>
                  <span>
                    {totalMax === 0
                      ? 'No marks assigned yet.'
                      : `That’s ${totalMax === 0 ? 0 : Math.round((totalScore / totalMax) * 100)}% overall.`}
                  </span>
                </div>
                <div className="flex items-center gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    className="rounded-full border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    onClick={closeModal}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="button"
                    className={cn(
                      'rounded-full px-6 py-2 font-semibold shadow-md transition',
                      formMode === 'view' || saving
                        ? 'cursor-not-allowed bg-slate-200 text-slate-500'
                        : 'bg-[#1d4ed8] text-white hover:bg-[#1e3a8a]'
                    )}
                    disabled={formMode === 'view' || saving}
                    onClick={handleSave}
                  >
                    {saving ? 'Saving...' : 'Save Result'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onValueChange,
  options
}: {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white/70 px-3 py-1.5 text-sm text-slate-600 shadow-sm">
      <span className="hidden font-semibold md:inline">{label}:</span>
      <Select value={value} onValueChange={onValueChange}>
        <SelectTrigger className="h-8 rounded-full border-none bg-transparent px-2 text-sm font-semibold text-slate-700 focus:ring-0">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="rounded-xl border border-slate-200 bg-white text-slate-700 shadow-xl">
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function RowActionButton({
  icon: Icon,
  label,
  variant = 'default',
  onClick
}: {
  icon: LucideIcon;
  label: string;
  variant?: 'default' | 'danger';
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-3 py-1 text-xs font-semibold transition',
        variant === 'danger'
          ? 'border-rose-200 bg-rose-50 text-rose-600 hover:border-rose-300 hover:text-rose-700'
          : 'border-slate-200 bg-slate-50 text-slate-600 hover:border-[#1d4ed8]/40 hover:text-[#1d4ed8]'
      )}
    >
      <Icon className="h-3.5 w-3.5" />
      {label}
    </button>
  );
}

function Th({ children, className }: { children: React.ReactNode; className?: string }) {
  return (
    <th
      className={cn(
        'px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500',
        className
      )}
    >
      {children}
    </th>
  );
}

function Td({ children, className }: { children: React.ReactNode; className?: string }) {
  return <td className={cn('px-4 py-3 align-top text-sm text-slate-700', className)}>{children}</td>;
}

function formTotalDisplay(total: number, max: number) {
  return `${total} / ${max}`;
}

function mapRecordToPaperResult(record: ResultRecord): PaperResult {
  return {
    id: record.result_id,
    state: record.state,
    year: record.year,
    paper: record.paper_no,
    date: record.date_done,
    timeSpent: record.time_spent_min,
    notes: record.notes,
    byQuestion: record.by_question.map((question) => ({
      section: question.section,
      question: question.q_no,
      max: question.max_score,
      score: question.score
    }))
  };
}

function buildPayload(form: PaperResult, userId: string): ResultUpsertPayload {
  return {
    user_id: userId,
    state: form.state,
    year: form.year,
    paper_no: form.paper,
    date_done: toIsoDate(form.date),
    time_spent_min: form.timeSpent ?? null,
    notes: form.notes?.trim() ? form.notes.trim() : null,
    by_question: form.byQuestion.map((entry) => ({
      q_no: entry.question,
      section: entry.section,
      max_score: entry.max,
      score: typeof entry.score === 'number' ? entry.score : null,
      chapter: null,
      subtopic: null,
      cognitive: null
    }))
  };
}

function upsertResultList(list: PaperResult[], item: PaperResult): PaperResult[] {
  const index = list.findIndex((existing) => existing.id === item.id);
  const clone: PaperResult = {
    ...item,
    byQuestion: item.byQuestion.map((entry) => ({ ...entry }))
  };
  if (index >= 0) {
    const next = [...list];
    next[index] = clone;
    return next;
  }
  return [...list, clone];
}
