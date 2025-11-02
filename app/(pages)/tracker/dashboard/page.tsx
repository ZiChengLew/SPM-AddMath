'use client';

import { useMemo, useState } from 'react';
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

type ChartMode = 'percent' | 'total';

type ProgressPoint = {
  date: string;
  percent: number;
  total: number;
};

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

type RecommendationCard = {
  id: string;
  weekStart: string;
  title: string;
  subtopics: string[];
  questionCount: number;
  estimatedTime: number;
  description: string;
  carriesForward: boolean;
};

const KPI_SUMMARY = [
  {
    title: 'Avg Score (last 3 attempts)',
    value: '78%',
    trend: '+5pp vs prior 3',
    icon: TrendingUp,
    accent: 'text-emerald-600'
  },
  {
    title: 'Papers Completed (this week)',
    value: '3',
    trend: 'Target: 4/week',
    icon: CalendarRange,
    accent: 'text-[#1d4ed8]'
  },
  {
    title: 'Error Rate (last 7 days)',
    value: '22%',
    trend: 'Down 4pp vs prior week',
    icon: AlertTriangle,
    accent: 'text-amber-500'
  },
  {
    title: 'Active Recommendations',
    value: '2',
    trend: 'Smart sets ready',
    icon: Compass,
    accent: 'text-fuchsia-600'
  }
] as const;

const PROGRESS_POINTS: ProgressPoint[] = [
  { date: '2024-03-10', percent: 64, total: 48 },
  { date: '2024-03-24', percent: 66, total: 51 },
  { date: '2024-04-07', percent: 69, total: 55 },
  { date: '2024-04-21', percent: 71, total: 57 },
  { date: '2024-05-05', percent: 74, total: 59 },
  { date: '2024-05-19', percent: 75, total: 60 },
  { date: '2024-06-02', percent: 77, total: 62 },
  { date: '2024-06-16', percent: 78, total: 63 },
  { date: '2024-06-30', percent: 81, total: 65 },
  { date: '2024-07-14', percent: 79, total: 64 },
  { date: '2024-07-28', percent: 83, total: 68 }
];

const WEAK_LINKS: WeakLink[] = [
  { subtopic: 'Applications of Derivative — Tangent Gradient', score: 48, delta: -6, attempts: 7 },
  { subtopic: 'Integration — Area under Curve', score: 52, delta: +8, attempts: 6 },
  { subtopic: 'Vectors — 3D Lines & Planes', score: 55, delta: +3, attempts: 5 }
];

const KNOWLEDGE_CHAINS: KnowledgeChain[] = [
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

const WEEKLY_RECOMMENDATIONS: RecommendationCard[] = [
  {
    id: 'rec-001',
    weekStart: '2025-11-03',
    title: 'Smart Revision Set — Week of 2025-11-03',
    subtopics: [
      'Differentiation: Tangent Gradient',
      'Integration: Area Under Curve',
      'Vectors: Lines & Planes'
    ],
    questionCount: 14,
    estimatedTime: 85,
    description:
      'Five question core + two composite problems linking differentiation and vectors. Focus on algebra discipline when moving between coordinate systems.',
    carriesForward: false
  },
  {
    id: 'rec-002',
    weekStart: '2025-10-27',
    title: 'Recovery Set — Week of 2025-10-27',
    subtopics: ['Probability Distribution: Discrete', 'Functions: Composition Checks'],
    questionCount: 9,
    estimatedTime: 60,
    description:
      'Kept from last week because there were no new paper uploads. Finish this before regenerating fresh sets.',
    carriesForward: true
  }
];

const STATUS_STYLES: Record<ChainNodeStatus, string> = {
  strong: 'border-emerald-200 bg-emerald-50 text-emerald-700',
  warning: 'border-amber-200 bg-amber-50 text-amber-700',
  critical: 'border-rose-200 bg-rose-50 text-rose-700'
};

export default function TrackerDashboardPage() {
  const [chartMode, setChartMode] = useState<ChartMode>('percent');
  const [selectedChain, setSelectedChain] = useState(KNOWLEDGE_CHAINS[0].chapter);
  const [activeNodeId, setActiveNodeId] = useState(KNOWLEDGE_CHAINS[0].nodes[0].id);

  const chain = useMemo(
    () => KNOWLEDGE_CHAINS.find((item) => item.chapter === selectedChain) ?? KNOWLEDGE_CHAINS[0],
    [selectedChain]
  );

  const activeNode = chain.nodes.find((node) => node.id === activeNodeId) ?? chain.nodes[0];

  const chart = useMemo(() => buildChart(chartMode), [chartMode]);

  return (
    <div className="space-y-8">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {KPI_SUMMARY.map((card) => (
          <article
            key={card.title}
            className="relative overflow-hidden rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 p-6 shadow-sm"
          >
            <card.icon className={cn('h-6 w-6', card.accent)} />
            <p className="mt-3 text-sm font-semibold text-slate-500">{card.title}</p>
            <p className="mt-2 text-3xl font-bold text-slate-900">{card.value}</p>
            <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-slate-400">{card.trend}</p>
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
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full">
              <defs>
                <linearGradient id="trendFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="rgba(29, 78, 216, 0.25)" />
                  <stop offset="100%" stopColor="rgba(29, 78, 216, 0)" />
                </linearGradient>
              </defs>
              <path d={chart.areaPath} fill="url(#trendFill)" className="transition-all duration-300 ease-out" />
              <path d={chart.linePath} fill="none" stroke="#1d4ed8" strokeWidth={2.5} className="transition-all duration-300 ease-out" />
              {chart.points.map((point) => (
                <g key={point.label}>
                  <circle cx={point.x} cy={point.y} r={1.6} fill="#1d4ed8" />
                </g>
              ))}
            </svg>
            <div className="mt-4 grid grid-cols-3 gap-4 text-xs text-slate-500 sm:grid-cols-5">
              {chart.points.map((point) => (
                <div key={point.label}>
                  <p className="font-semibold text-slate-600">{point.summary}</p>
                  <p>{point.label}</p>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex items-start justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Weak Links (Top 3 Subtopics)</h3>
              <p className="text-sm text-slate-500">Based on last 7 days (min 3 attempts)</p>
            </div>
          </header>
          <div className="mt-6 space-y-5">
            {WEAK_LINKS.map((link) => (
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
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <article className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <header className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">Knowledge Link Chain View</h3>
              <p className="text-sm text-slate-500">{chain.summary}</p>
            </div>
            <Select value={selectedChain} onValueChange={(value) => {
              setSelectedChain(value);
              const fallback = KNOWLEDGE_CHAINS.find((item) => item.chapter === value);
              if (fallback) {
                setActiveNodeId(fallback.nodes[0].id);
              }
            }}>
              <SelectTrigger className="w-64 rounded-full border border-slate-200 bg-slate-50 text-sm font-semibold text-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-slate-200 bg-white text-slate-700">
                {KNOWLEDGE_CHAINS.map((item) => (
                  <SelectItem key={item.chapter} value={item.chapter}>
                    {item.chapter}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </header>

          <div className="mt-6 flex flex-wrap items-center gap-4 rounded-2xl border border-slate-100 bg-slate-50/60 p-4">
            {chain.nodes.map((node, index) => (
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
                    {node.status === 'strong' ? '✅ Strong' : node.status === 'warning' ? '⚠️ Needs attention' : '❌ Critical'}
                  </span>
                  <span className="mt-1 text-sm font-semibold text-slate-800">{node.label}</span>
                  <span className="mt-2 inline-flex items-center rounded-full bg-white/60 px-2 py-1 text-xs font-semibold text-slate-600">
                    Score {node.score}%
                  </span>
                </button>
                {index < chain.nodes.length - 1 && (
                  <ChevronRight className="hidden h-6 w-6 text-slate-400 md:block" />
                )}
              </div>
            ))}
          </div>

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
              className="rounded-full border-slate-300 bg-white text-sm font-semibold text-slate-700 hover:bg-slate-50"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </header>

          <div className="mt-6 space-y-5">
            {WEEKLY_RECOMMENDATIONS.map((card) => (
              <div key={card.id} className="rounded-2xl border border-slate-200 bg-slate-50/80 p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                      Week of {card.weekStart}
                    </p>
                    <h4 className="text-lg font-semibold text-slate-900">{card.title}</h4>
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold',
                      card.carriesForward
                        ? 'border border-amber-200 bg-amber-50 text-amber-600'
                        : 'border border-emerald-200 bg-emerald-50 text-emerald-600'
                    )}
                  >
                    {card.carriesForward ? 'Carried forward' : 'New this week'}
                  </span>
                </div>
                <p className="mt-3 text-sm text-slate-600">{card.description}</p>
                <div className="mt-4 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-500">
                  <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                    {card.questionCount} questions
                  </span>
                  <span className="rounded-full bg-white px-3 py-1 text-slate-600">
                    ~{card.estimatedTime} minutes
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
            ))}
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

function buildChart(mode: ChartMode) {
  const values = PROGRESS_POINTS.map((point) => (mode === 'percent' ? point.percent : point.total));
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const range = maxValue - minValue || 1;

  const points = PROGRESS_POINTS.map((point, index) => {
    const x = (index / (PROGRESS_POINTS.length - 1)) * 100;
    const value = mode === 'percent' ? point.percent : point.total;
    const y = 100 - ((value - minValue) / range) * 80 - 10; // keep padding
    return {
      x,
      y,
      label: new Date(point.date).toLocaleDateString(undefined, {
        month: 'short',
        day: 'numeric'
      }),
      summary: mode === 'percent' ? `${value}%` : `${value} marks`
    };
  });

  const linePath = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x} ${point.y}`)
    .join(' ');
  const areaPath = `${linePath} L 100 100 L 0 100 Z`;

  return { linePath, areaPath, points };
}

function TogglePill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
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
