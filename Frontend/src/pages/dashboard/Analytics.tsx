import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { TrendingUp, BrainCircuit, Target, Sigma } from 'lucide-react';
import { AppLayout } from '@/components/layout/AppLayout';
import { StatsCard } from '@/components/shared';
import { useStudyAnalytics } from '@/lib/hooks/useStudyAnalytics';
import { StudyAnalyticsItem } from '@/lib/types';

const chartHeight = 220;
const chartWidth = 900;
const chartPadding = 24;

function buildLinePoints(values: number[]) {
  if (values.length === 0) return '';
  const stepX = values.length === 1 ? 0 : (chartWidth - chartPadding * 2) / (values.length - 1);
  return values
    .map((value, index) => {
      const x = chartPadding + index * stepX;
      const y = chartHeight - chartPadding - (value / 100) * (chartHeight - chartPadding * 2);
      return `${x},${y}`;
    })
    .join(' ');
}

function PerformanceChart({ sessions }: { sessions: StudyAnalyticsItem[] }) {
  const ordered = [...sessions].sort(
    (a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
  );

  const mastery = ordered.map((item) => item.masteryScore ?? 0);
  const retention = ordered.map((item) => item.retentionScore ?? 0);
  const accuracy = ordered.map((item) => (item.type === 'QUIZ' ? item.quizAccuracy ?? 0 : 0));

  const masteryPoints = buildLinePoints(mastery);
  const retentionPoints = buildLinePoints(retention);
  const accuracyPoints = buildLinePoints(accuracy);

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-bold text-slate-900 dark:text-white">Performance Trend</h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">Last {ordered.length} sessions</span>
      </div>

      {ordered.length === 0 ? (
        <div className="h-[220px] flex items-center justify-center text-sm text-slate-500 dark:text-slate-400">
          No analytics sessions yet.
        </div>
      ) : (
        <div className="w-full overflow-x-auto">
          <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full min-w-[680px] h-[220px]">
            {[0, 25, 50, 75, 100].map((tick) => {
              const y = chartHeight - chartPadding - (tick / 100) * (chartHeight - chartPadding * 2);
              return (
                <g key={tick}>
                  <line
                    x1={chartPadding}
                    y1={y}
                    x2={chartWidth - chartPadding}
                    y2={y}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-700"
                    strokeWidth="1"
                  />
                  <text
                    x={6}
                    y={y + 4}
                    fontSize="10"
                    className="fill-slate-400"
                  >
                    {tick}
                  </text>
                </g>
              );
            })}

            <polyline fill="none" stroke="#7c3aed" strokeWidth="3" points={masteryPoints} />
            <polyline fill="none" stroke="#2563eb" strokeWidth="3" points={retentionPoints} />
            <polyline fill="none" stroke="#f59e0b" strokeWidth="3" points={accuracyPoints} />
          </svg>
        </div>
      )}

      <div className="flex flex-wrap gap-4 mt-3 text-xs">
        <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="w-3 h-3 rounded-full bg-violet-600" /> Mastery
        </span>
        <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="w-3 h-3 rounded-full bg-blue-600" /> Retention
        </span>
        <span className="inline-flex items-center gap-2 text-slate-600 dark:text-slate-300">
          <span className="w-3 h-3 rounded-full bg-amber-500" /> Quiz Accuracy
        </span>
      </div>
    </div>
  );
}

function DistributionBars({ sessions }: { sessions: StudyAnalyticsItem[] }) {
  const buckets = useMemo(() => {
    const result = {
      excellent: 0,
      good: 0,
      improving: 0,
      atRisk: 0,
    };

    sessions.forEach((session) => {
      const mastery = session.masteryScore ?? 0;
      if (mastery >= 85) result.excellent += 1;
      else if (mastery >= 70) result.good += 1;
      else if (mastery >= 50) result.improving += 1;
      else result.atRisk += 1;
    });

    return result;
  }, [sessions]);

  const maxValue = Math.max(1, buckets.excellent, buckets.good, buckets.improving, buckets.atRisk);

  const bars = [
    { label: 'Excellent', value: buckets.excellent, color: 'bg-emerald-500' },
    { label: 'Good', value: buckets.good, color: 'bg-blue-500' },
    { label: 'Improving', value: buckets.improving, color: 'bg-amber-500' },
    { label: 'At Risk', value: buckets.atRisk, color: 'bg-rose-500' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
      <h3 className="font-bold text-slate-900 dark:text-white mb-4">Mastery Distribution</h3>
      <div className="space-y-3">
        {bars.map((bar) => (
          <div key={bar.label}>
            <div className="flex justify-between text-xs text-slate-600 dark:text-slate-300 mb-1">
              <span>{bar.label}</span>
              <span>{bar.value}</span>
            </div>
            <div className="h-2 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
              <div
                className={`h-2 rounded-full ${bar.color}`}
                style={{ width: `${(bar.value / maxValue) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const { data, isLoading } = useStudyAnalytics();
  const sessions = data?.recentSessions ?? [];

  return (
    <AppLayout>
      <div className="max-w-[1440px] w-full mx-auto p-6 lg:p-10 space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl bg-gradient-to-r from-violet-600 to-blue-600 text-white p-6 md:p-8"
        >
          <h1 className="text-2xl md:text-3xl font-bold">Study Analytics</h1>
          <p className="mt-2 text-white/90 text-sm md:text-base">
            Visual performance intelligence from your lesson and concentration transcripts.
          </p>
        </motion.div>

        {isLoading ? (
          <div className="h-52 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 animate-pulse" />
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatsCard
                icon={<Sigma className="w-5 h-5" />}
                value={data?.totalSessions ?? 0}
                label="Total Sessions"
                iconBgColor="bg-indigo-100 dark:bg-indigo-900/30"
                iconColor="text-indigo-600"
              />
              <StatsCard
                icon={<BrainCircuit className="w-5 h-5" />}
                value={`${data?.avgMasteryScore ?? 0}%`}
                label="Avg Mastery"
                iconBgColor="bg-violet-100 dark:bg-violet-900/30"
                iconColor="text-violet-600"
              />
              <StatsCard
                icon={<Target className="w-5 h-5" />}
                value={`${data?.avgQuizAccuracy ?? 0}%`}
                label="Avg Quiz Accuracy"
                iconBgColor="bg-amber-100 dark:bg-amber-900/30"
                iconColor="text-amber-600"
              />
              <StatsCard
                icon={<TrendingUp className="w-5 h-5" />}
                value={data?.lessonSessions ?? 0}
                label="Lesson Sessions"
                iconBgColor="bg-blue-100 dark:bg-blue-900/30"
                iconColor="text-blue-600"
              />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
              <div className="xl:col-span-2">
                <PerformanceChart sessions={sessions} />
              </div>
              <div>
                <DistributionBars sessions={sessions} />
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 p-5 shadow-sm">
              <h3 className="font-bold text-slate-900 dark:text-white mb-4">Recent Session Insights</h3>
              <div className="space-y-3">
                {sessions.length === 0 && (
                  <div className="rounded-xl border border-dashed border-slate-300 dark:border-slate-700 p-4 text-sm text-slate-500 dark:text-slate-400">
                    No sessions analyzed yet. Finish a lesson or concentration quiz to populate this view.
                  </div>
                )}

                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/40 p-4"
                  >
                    <div className="flex items-center justify-between gap-3 mb-2">
                      <p className="text-sm font-semibold text-slate-900 dark:text-white truncate">
                        {session.lessonTitle}
                      </p>
                      <span className="text-[11px] px-2 py-1 rounded-full bg-slate-200/70 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                        {session.type}
                      </span>
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-xs text-slate-600 dark:text-slate-300 mb-2">
                      <span>Mastery: {session.masteryScore}%</span>
                      <span>Clarity: {session.clarityScore}%</span>
                      <span>Retention: {session.retentionScore}%</span>
                    </div>
                    <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2">
                      {session.recommendation || 'No recommendation provided.'}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
