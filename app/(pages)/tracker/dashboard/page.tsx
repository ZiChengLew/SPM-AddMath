'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  AlertTriangle,
  ArrowRight,
  BrainCircuit,
  CalendarRange,
  CheckCircle2,
  ChevronRight,
  Compass,
  Play,
  RefreshCw,
  TrendingUp
} from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { cn } from '@/lib/utils';
import type { RecommendationSet, ResultRecord } from '@/lib/tracker/types';

type ChartMode = 'percent' | 'total';

type WeakLink = {
  subtopic: string;
  score: number;
  delta: number;
  attempts: number;
};

type ChainNodeStatus = 'strong' | 'warning' | 'critical';

type ChainNode = {
  id: string;
  label: string;
  status: ChainNodeStatus;
  score: number;
  definition: string;
  mistakes: string;
  practiceSet: string;
};

type KnowledgeChain = {
  chapter: string;
  summary: string;
  nodes: ChainNode[];
};

type KpiCard = {
  title: string;
  value: string;
  trend: string;
  icon: typeof TrendingUp;
  accent: string;
};

type ChartPoint = {
  x: number;
  y: number;
  label: string;
  summary: string;
};

const KNOWLEDGE_CHAIN_TEMPLATE: KnowledgeChain[] = [
  {
    chapter: 'Differentiation',
    summary: 'Tangent gradient chain needs reinforcement before moving to optimisation questions.',
    nodes: [
      {
        id: 'functions',
        label: 'Functions',
        status: 'strong',
        score: 78,
        definition: 'Relationship mapping each x to a single y. Mastery of notation and domain/range.',
        mistakes: 'Occasional missing of domain restrictions when composing functions.',
        practiceSet: 'Quick refresh: Function transformations (5Q)'
      },
      {
        id: 'differentiation',
        label: 'Differentiation',
        status: 'warning',
        score: 64,
        definition: 'Rate of change using first principles and differentiation rules.',
        mistakes: 'Loses marks on chain rule and implicit differentiation setup.',
        practiceSet: 'Chain rule warm-up (6Q)'
      },
      {
        id: 'applications',
        label: 'Applications of Derivative',
        status: 'critical',
        score: 42,
        definition: 'Apply derivatives for tangents, normals, optimisation, and related rates.',
        mistakes: 'Algebra slips when substituting point-slope into tangent equations.',
        practiceSet: 'Targeted tangent + normal set (5Q)'
      }
    ]
  },
  {
    chapter: 'Integration',
    summary: 'Techniques are improving, but definite integrals with substitution still inconsistent.',
    nodes: [
      {
        id: 'anti-derivatives',
        label: 'Anti-derivatives',
        status: 'strong',
        score: 82,
        definition: 'Reverse differentiation, including power, exponential, and basic trig forms.',
        mistakes: 'Generally solid; minor slips on constants of integration.',
        practiceSet: 'Mixed anti-derivative drill (4Q)'
      },
      {
        id: 'substitution',
        label: 'Integration by Substitution',
        status: 'warning',
        score: 58,
        definition: 'Change of variables to simplify integral expressions.',
        mistakes: 'Forgets to adjust limits after substitution in definite integrals.',
        practiceSet: 'Substitution with bounds (5Q)'
      },
      {
        id: 'area',
        label: 'Area Under Curve',
        status: 'warning',
        score: 52,
        definition: 'Using definite integrals to compute area between curves and axes.',
        mistakes: 'Mixes up upper/lower function when curves intersect twice.',
        practiceSet: 'Sketch + area blend (4Q)'
      }
    ]
  }
];

const STATUS_STYLES: Record<ChainNodeStatus, string> = {
  strong: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  critical: 'border-rose-200 bg-rose-50 text-rose-700'
};

const NODE_CATEGORY_MAP: Record<string, string> = {
  functions: 'Functions',
  differentiation: 'Differentiation',
  applications: 'Applications of Derivative',
  'anti-derivatives': 'Integration Basics',
  substitution: 'Integration by Substitution',
  area: 'Area Under Curve'
};

export default function TrackerDashboardPage() {
  const [chartMode, setChartMode] = useState<ChartMode>('percent');
  const [results, setResults] = useState<ResultRecord[]>([]);
  const [recommendations, setRecommendations] = useState<RecommendationSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedChain, setSelectedChain] = useState(
    KNOWLEDGE_CHAIN_TEMPLATE[0]?.chapter ?? 'Differentiation'
  );
  const [activeNodeId, setActiveNodeId] = useState(
    KNOWLEDGE_CHAIN_TEMPLATE[0]?.nodes[0]?.id ?? ''
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const [resultsResponse, recommendationsResponse] = await Promise.all([
        fetch('/api/tracker/results', { cache: 'no-store' }),
        fetch('/api/tracker/recommendations', { cache: 'no-store' })
      ]);

      if (!resultsResponse.ok) {
        const body = await resultsResponse.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to load results');
      }
      if (!recommendationsResponse.ok) {
        const body = await recommendationsResponse.json().catch(() => ({}));
        throw new Error(body.error ?? 'Failed to load recommendations');
      }

      const resultsJson = (await resultsResponse.json()) as { results?: ResultRecord[] };
      const recommendationsJson = (await recommendationsResponse.json()) as {
        recommendations?: RecommendationSet[];
      };
      setResults(resultsJson.results ?? []);
      setRecommendations(recommendationsJson.recommendations ?? []);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const kpiSummary = useMemo(
    () => buildKpis(results, recommendations),
    [results, recommendations]
  );
  const chart = useMemo(() => buildChart(chartMode, results), [chartMode, results]);
  const weakLinks = useMemo(() => deriveWeakLinks(results), [results]);
  const knowledgeChains = useMemo(() => applyKnowledgeChains(results), [results]);

  useEffect(() => {
    if (knowledgeChains.length === 0) {
      return;
    }
    if (!knowledgeChains.some((chain) => chain.chapter === selectedChain)) {
      setSelectedChain(knowledgeChains[0].chapter);
      setActiveNodeId(knowledgeChains[0].nodes[0]?.id ?? '');
      return;
    }
    const chain = knowledgeChains.find((item) => item.chapter === selectedChain);
    if (!chain) {
      return;
    }
    if (!chain.nodes.some((node) => node.id === activeNodeId)) {
      setActiveNodeId(chain.nodes[0]?.id ?? '');
    }
  }, [knowledgeChains, selectedChain, activeNodeId]);

  const chain = knowledgeChains.find((item) => item.chapter === selectedChain) ?? knowledgeChains[0];
  const activeNode =
    chain?.nodes.find((node) => node.id === activeNodeId) ?? chain?.nodes[0] ?? null;

  const activeRecommendations = useMemo(
    () => recommendations.filter((rec) => rec.status === 'active'),
    [recommendations]
  );

  return (
    <div className="space-y-8">
      {error && (
        <div className="flex items-center justify-between rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          <span>{error}</span>
          <button
            type="button"
            className="rounded-full bg-white px-3 py-1 text-xs font-semibold text-rose-600 shadow-sm transition hover:text-rose-700"
            onClick={() => loadData()}
          >
            Retry
          </button>
        </div>
      )}

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {kpiSummary.map((card) => (
          <article
            key={card.title}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm"
          >
            <card.icon className={cn('h-6 w-6', card.accent)} />
            <p className="mt-3 text-sm font-semibold text-slate-500">{card.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">
              {card.trend}
            </p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Progress Trend</h3>
              <p className="text-sm text-slate-500">Last 90 days of attempts</p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-slate-100 p-1">
              <TogglePill active={chartMode === 'percent'} onClick={() => setChartMode('percent')}>
                Average %
              </TogglePill>
              <TogglePill active={chartMode === 'total'} onClick={() => setChartMode('total')}>
                Raw Total
              </TogglePill>
            </div>
          </header>

          <div className="mt-6 h-72 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            {chart.points.length === 0 ? (
              <div className="flex h-full items-center justify-center text-sm text-slate-500">
                {loading ? 'Loading trend...' : 'Add paper results to unlock progress trends.'}
              </div>
            ) : (
              <>
                <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
                  <defs>
                    <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                      <stop offset="0%" stopColor="rgba(29, 78, 216, 0.25)" />
                      <stop offset="100%" stopColor="rgba(29, 78, 216, 0)" />
                    </linearGradient>
                  </defs>
                  <path
                    d={chart.areaPath}
                    fill="url(#trendFill)"
                    className="transition-all duration-300 ease-out"
                  />
                  <path
                    d={chart.linePath}
                    fill="none"
                    stroke="#1d4ed8"
                    strokeWidth={2.5}
                    className="transition-all duration-300 ease-out"
                  />
                  {chart.points.map((point) => (
                    <g key={`${point.label}-${point.summary}`}>
                      <circle cx={point.x} cy={point.y} r={1.6} fill="#1d4ed8" />
                    </g>
                  ))}
                </svg>
                <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-slate-500 sm:grid-cols-5">
                  {chart.points.map((point) => (
                    <div key={`${point.label}-${point.summary}`}>
                      <p className="font-semibold text-slate-600">{point.summary}</p>
                      <p>{point.label}</p>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Weak Links (Top 3 Subtopics)</h3>
              <p className="text-sm text-slate-500">Based on last 7 days (min 1 attempt)</p>
            </div>
          </header>
          <div className="mt-6 space-y-5">
            {weakLinks.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                {loading ? 'Scanning recent results...' : 'No weak links yet. Keep logging your papers to unlock targeted sets.'}
              </p>
            ) : (
              weakLinks.map((link) => (
                <div key={link.subtopic} className="space-y-2">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span className="font-semibold text-slate-700">{link.subtopic}</span>
                    <span className={cn('font-semibold', link.delta >= 0 ? 'text-emerald-600' : 'text-rose-600')}>
                      {link.delta >= 0 ? '+' : ''}
                      {link.delta}pp vs prev
                    </span>
                  </div>
                  <div className="h-3 w-full rounded-full bg-slate-100">
                    <div
                      style={{ width: `${Math.min(link.score, 100)}%` }}
                      className={cn(
                        'h-3 rounded-full transition-all',
                        link.score < 50 ? 'bg-rose-400' : link.score < 70 ? 'bg-amber-400' : 'bg-emerald-400'
                      )}
                    />
                  </div>
                  <div className="flex items-center justify-between text-xs text-slate-500">
                    <span>
                      Score: <span className="font-semibold text-slate-700">{link.score}%</span>
                    </span>
                    <span>{link.attempts} questions</span>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full rounded-full border-slate-300 bg-white text-sm font-semibold text-[#1d4ed8] hover:bg-slate-50"
                  >
                    Fix it
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Knowledge Link Chain View</h3>
              <p className="text-sm text-slate-500">
                {chain?.summary ?? 'Log results to unlock knowledge link insights.'}
              </p>
            </div>
            <Select
              value={selectedChain}
              onValueChange={(value) => {
                setSelectedChain(value);
                const fallback = knowledgeChains.find((item) => item.chapter === value);
                if (fallback) {
                  setActiveNodeId(fallback.nodes[0]?.id ?? '');
                }
              }}
            >
              <SelectTrigger className="w-64 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 bg-white text-slate-700">
                {knowledgeChains.map((item) => (
                  <SelectItem key={item.chapter} value={item.chapter}>
                    {item.chapter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </header>

          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            {chain?.nodes.map((node, index) => (
              <div key={node.id} className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveNodeId(node.id)}
                  className={cn(
                    'flex min-w-[160px] flex-col items-start rounded-2xl border px-4 py-3 text-left transition',
                    STATUS_STYLES[node.status],
                    activeNodeId === node.id ? 'ring-2 ring-offset-2 ring-[#1d4ed8]' : 'opacity-90 hover:opacity-100'
                  )}
                >
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                    {node.status === 'strong'
                      ? '✅ Strong'
                      : node.status === 'warning'
                        ? '⚠️ Needs attention'
                        : '❌ Critical'}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-slate-800">{node.label}</span>
                  <span className="mt-2 inline-flex items-center rounded-full bg-white/60 px-2 py-1 text-xs font-semibold text-slate-600">
                    Score {node.score}%
                  </span>
                </button>
                {index < (chain?.nodes.length ?? 0) - 1 && (
                  <ChevronRight className="hidden h-6 w-6 text-slate-400 md:block" />
                )}
              </div>
            ))}
          </div>

          {activeNode ? (
            <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6">
              <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
                <BrainCircuit className="h-5 w-5 text-[#1d4ed8]" />
                {activeNode.label}
              </div>
              <dl className="mt-4 space-y-3 text-sm text-slate-600">
                <div>
                  <dt className="font-semibold text-slate-700">Definition</dt>
                  <dd>{activeNode.definition}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Common mistakes</dt>
                  <dd>{activeNode.mistakes}</dd>
                </div>
                <div>
                  <dt className="font-semibold text-slate-700">Linked practice set</dt>
                  <dd className="flex items-center gap-2">
                    {activeNode.practiceSet}
                    <Button
                      type="button"
                      variant="outline"
                      className="rounded-full border-[#1d4ed8] bg-white text-xs font-semibold text-[#1d4ed8] hover:bg-[#1d4ed8]/10"
                    >
                      View set
                      <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                    </Button>
                  </dd>
                </div>
              </dl>
            </div>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-6 text-sm text-slate-500">
              Log more papers to see targeted knowledge chain insights.
            </div>
          )}
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Weekly Recommendation Set</h3>
              <p className="text-sm text-slate-500">Regenerates weekly when fresh papers are added</p>
            </div>
            <Button
              type="button"
              variant="outline"
              disabled={loading}
              className="rounded-full border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              onClick={() => loadData()}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              {loading ? 'Refreshing...' : 'Refresh'}
            </Button>
          </header>

          <div className="mt-6 space-y-5">
            {activeRecommendations.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-6 text-sm text-slate-500">
                {loading
                  ? 'Looking up your recommendation sets...'
                  : 'Upload a paper this week to get a fresh Smart Revision Set.'}
              </p>
            ) : (
              activeRecommendations
                .sort(
                  (a, b) =>
                    new Date(b.week_start).getTime() - new Date(a.week_start).getTime()
                )
                .map((card) => (
                  <div key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          Week of {card.week_start}
                        </p>
                        <h4 className="text-lg font-semibold text-slate-900">{card.title}</h4>
                      </div>
                      <span
                        className={cn(
                          'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                          card.status === 'active' && card.carries_forward
                            ? 'border border-amber-200 bg-amber-50 text-amber-600'
                            : 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                        )}
                      >
                        {card.carries_forward ? 'Carried forward' : 'New this week'}
                      </span>
                    </div>
                    <p className="mt-3 text-sm text-slate-600">{card.description}</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                      <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                        {card.question_ids.length} questions
                      </span>
                      <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                        ~{card.estimated_time_min} minutes
                      </span>
                      {card.subtopics.map((chip) => (
                        <span key={chip} className="rounded-full bg-white px-3 py-1 text-slate-600">
                          {chip}
                        </span>
                      ))}
                    </div>
                    <div className="mt-5 flex flex-wrap gap-3">
                      <Button
                        type="button"
                        className="rounded-full bg-[#1d4ed8] px-5 text-sm font-semibold text-white shadow hover:bg-[#1e40af]"
                      >
                        <Play className="mr-2 h-4 w-4" />
                        Start Practice
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        className="rounded-full border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-100"
                      >
                        View details
                      </Button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </article>
      </section>

      <section className="rounded-3xl border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500">
        <div className="flex items-center gap-3 font-semibold text-slate-600">
          <CheckCircle2 className="h-5 w-5 text-emerald-500" />
          Next steps
        </div>
        <ul className="mt-3 list-disc space-y-2 pl-5">
          <li>Confirm subtopic taxonomy across Form 4 + Form 5 to power future diagnostics.</li>
          <li>Define per-question max scores per paper so the mark table auto-fills accurately.</li>
          <li>
            Decide minimum attempts threshold (e.g. ≥3) before subtopics can appear as weak links, then codify the rule.
          </li>
          <li>Draft at least two real recommendation sets with live question IDs to validate the UX flow.</li>
        </ul>
      </section>
    </div>
  );
}

function buildKpis(results: ResultRecord[], recommendations: RecommendationSet[]): KpiCard[] {
  const sorted = [...results].sort(
    (a, b) => new Date(b.date_done).getTime() - new Date(a.date_done).getTime()
  );
  const lastThree = sorted.slice(0, 3);
  const previousThree = sorted.slice(3, 6);
  const avgRecent = averagePercent(lastThree);
  const avgPrevious = averagePercent(previousThree);
  const deltaRecent = avgRecent !== null && avgPrevious !== null ? avgRecent - avgPrevious : null;

  const lastSeven = filterByDays(sorted, 7);
  const priorSeven = filterByDays(sorted, 14, 7);
  const avgSeven = averagePercent(lastSeven);
  const avgPriorSeven = averagePercent(priorSeven);
  const errorRate = avgSeven === null ? null : Math.max(0, 100 - avgSeven);
  const errorDelta =
    errorRate !== null && avgPriorSeven !== null
      ? errorRate - Math.max(0, 100 - avgPriorSeven)
      : null;

  const papersThisWeek = countWithinDays(sorted, 7);
  const activeRecommendationCount = recommendations.filter((rec) => rec.status === 'active').length;

  return [
    {
      title: 'Avg Score (last 3 attempts)',
      value: formatPercent(avgRecent),
      trend:
        deltaRecent === null ? 'Log 3 attempts to unlock trend' : formatDelta(deltaRecent, 'vs prior 3'),
      icon: TrendingUp,
      accent: 'text-emerald-600'
    },
    {
      title: 'Papers Completed (this week)',
      value: `${papersThisWeek}`,
      trend: 'Target: 4/week',
      icon: CalendarRange,
      accent: 'text-[#1d4ed8]'
    },
    {
      title: 'Error Rate (last 7 days)',
      value: formatPercent(errorRate),
      trend:
        errorDelta === null
          ? 'Log attempts this week to unlock trend'
          : formatDelta(-errorDelta, 'vs prior week'),
      icon: AlertTriangle,
      accent: 'text-amber-500'
    },
    {
      title: 'Active Recommendations',
      value: `${activeRecommendationCount}`,
      trend:
        activeRecommendationCount > 0
          ? 'Smart sets ready'
          : 'Upload a paper to generate sets',
      icon: Compass,
      accent: 'text-fuchsia-600'
    }
  ];
}

function buildChart(mode: ChartMode, results: ResultRecord[]) {
  const grouped = groupResultsByDay(results, 90);
  if (grouped.length === 0) {
    return { linePath: '', areaPath: '', points: [] as ChartPoint[] };
  }

  const values = grouped.map((point) => (mode === 'percent' ? point.percent : point.total));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points: ChartPoint[] = grouped.map((point, index, array) => {
    const x = array.length === 1 ? 50 : (index / (array.length - 1)) * 100;
    const value = mode === 'percent' ? point.percent : point.total;
    const y = 100 - ((value - minValue) / range) * 80 - 10;
    return {
      x,
      y,
      label: formatShortDate(point.date),
      summary: mode === 'percent' ? `${Math.round(value)}%` : `${Math.round(value)} marks`
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return { linePath, areaPath, points };
}

function deriveWeakLinks(results: ResultRecord[]): WeakLink[] {
  const windowStart = subtractDays(new Date(), 7);
  const aggregates = new Map<
    string,
    { scoreSum: number; maxSum: number; attempts: number; label: string }
  >();

  results.forEach((result) => {
    const resultDate = new Date(result.date_done);
    if (resultDate < windowStart) {
      return;
    }
    result.by_question.forEach((question) => {
      const key = `${result.paper_no}-${question.section}-${question.q_no}`;
      const label = `Section ${question.section} — Q${question.q_no}`;
      const entry = aggregates.get(key) ?? { scoreSum: 0, maxSum: 0, attempts: 0, label };
      const score = typeof question.score === 'number' ? question.score : 0;
      entry.scoreSum += score;
      entry.maxSum += question.max_score;
      entry.attempts += question.score === null ? 0 : 1;
      aggregates.set(key, entry);
    });
  });

  return Array.from(aggregates.values())
    .filter((entry) => entry.attempts > 0 && entry.maxSum > 0)
    .map((entry) => ({
      subtopic: entry.label,
      score: Math.round((entry.scoreSum / entry.maxSum) * 100),
      delta: 0,
      attempts: entry.attempts
    }))
    .sort((a, b) => a.score - b.score)
    .slice(0, 3);
}

function applyKnowledgeChains(results: ResultRecord[]): KnowledgeChain[] {
  const categoryScores = computeCategoryScores(results);
  return KNOWLEDGE_CHAIN_TEMPLATE.map((chain) => ({
    ...chain,
    nodes: chain.nodes.map((node) => {
      const categoryKey = NODE_CATEGORY_MAP[node.id];
      if (!categoryKey) {
        return node;
      }
      const aggregate = categoryScores.get(categoryKey);
      if (!aggregate || aggregate.maxSum === 0) {
        return {
          ...node,
          score: 0,
          status: 'warning'
        };
      }
      const score = Math.round((aggregate.scoreSum / aggregate.maxSum) * 100);
      return {
        ...node,
        score,
        status: deriveStatus(score)
      };
    })
  }));
}

function computeCategoryScores(results: ResultRecord[]) {
  const fourteenDaysAgo = subtractDays(new Date(), 14);
  const map = new Map<string, { scoreSum: number; maxSum: number }>();

  results.forEach((result) => {
    if (new Date(result.date_done) < fourteenDaysAgo) {
      return;
    }
    result.by_question.forEach((question) => {
      const category = mapQuestionToCategory(result.paper_no, question.section, question.q_no);
      if (!category) {
        return;
      }
      const entry = map.get(category) ?? { scoreSum: 0, maxSum: 0 };
      const score = typeof question.score === 'number' ? question.score : 0;
      entry.scoreSum += score;
      entry.maxSum += question.max_score;
      map.set(category, entry);
    });
  });

  return map;
}

function mapQuestionToCategory(paper: string, section: string, questionNumber: number) {
  if (paper === 'P1') {
    if (section === 'A') {
      if (questionNumber <= 5) {
        return 'Functions';
      }
      if (questionNumber <= 10) {
        return 'Differentiation';
      }
      return 'Applications of Derivative';
    }
    return 'Applications of Derivative';
  }

  if (paper === 'P2') {
    if (section === 'A') {
      return questionNumber <= 4 ? 'Integration Basics' : 'Integration by Substitution';
    }
    return 'Area Under Curve';
  }

  return null;
}

function deriveStatus(score: number): ChainNodeStatus {
  if (score >= 70) {
    return 'strong';
  }
  if (score >= 50) {
    return 'warning';
  }
  return 'critical';
}

function averagePercent(records: ResultRecord[]): number | null {
  if (records.length === 0) {
    return null;
  }
  const totals = records.reduce(
    (acc, record) => {
      return {
        score: acc.score + record.total_score,
        max: acc.max + record.total_max
      };
    },
    { score: 0, max: 0 }
  );
  if (totals.max === 0) {
    return null;
  }
  return Math.round((totals.score / totals.max) * 100);
}

function filterByDays(records: ResultRecord[], days: number, offset = 0) {
  const end = subtractDays(new Date(), offset);
  const start = subtractDays(end, days);
  return records.filter((record) => {
    const date = new Date(record.date_done);
    return date >= start && date < end;
  });
}

function countWithinDays(records: ResultRecord[], days: number) {
  const start = subtractDays(new Date(), days);
  return records.filter((record) => new Date(record.date_done) >= start).length;
}

function groupResultsByDay(results: ResultRecord[], daysBack: number) {
  const cutoff = subtractDays(new Date(), daysBack);
  const grouped = new Map<
    string,
    { scoreSum: number; maxSum: number; totalSum: number; attempts: number }
  >();

  results.forEach((result) => {
    const date = new Date(result.date_done);
    if (date < cutoff) {
      return;
    }
    const key = date.toISOString().slice(0, 10);
    const entry = grouped.get(key) ?? { scoreSum: 0, maxSum: 0, totalSum: 0, attempts: 0 };
    entry.scoreSum += result.total_score;
    entry.maxSum += result.total_max;
    entry.totalSum += result.total_score;
    entry.attempts += 1;
    grouped.set(key, entry);
  });

  return Array.from(grouped.entries())
    .map(([date, value]) => ({
      date,
      percent: value.maxSum === 0 ? 0 : (value.scoreSum / value.maxSum) * 100,
      total: value.attempts === 0 ? 0 : value.totalSum / value.attempts
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    .slice(-12);
}

function formatPercent(value: number | null) {
  if (value === null || Number.isNaN(value)) {
    return '—';
  }
  return `${Math.round(value)}%`;
}

function formatDelta(value: number, suffix: string) {
  const rounded = Math.round(value);
  const sign = rounded > 0 ? '+' : '';
  return `${sign}${rounded}pp ${suffix}`;
}

function formatShortDate(value: string) {
  const date = new Date(value);
  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric'
  });
}

function subtractDays(date: Date, days: number) {
  const next = new Date(date);
  next.setDate(next.getDate() - days);
  next.setHours(0, 0, 0, 0);
  return next;
}

function TogglePill({
  active,
  onClick,
  children
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-4 py-1 text-xs font-semibold transition',
        active ? 'bg-white text-[#1d4ed8] shadow' : 'text-slate-500 hover:text-[#1d4ed8]'
      )}
    >
      {children}
    </button>
  );
}
