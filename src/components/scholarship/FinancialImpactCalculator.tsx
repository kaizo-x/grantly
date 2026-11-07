import { useMemo, useState } from 'react';
import { Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { PiggyBank, Wallet } from 'lucide-react';
import type { Scholarship, StudentProfile } from '../../types';
import { formatCurrency, percent } from '../../utils/format';
import { cn } from '../../utils/cn';
import { Progress } from '../ui/Progress';

/** Chart palette chosen to stay legible in both themes. */
const CHART_COLORS = {
  covered: '#6366f1',
  coveredLight: '#a5b4fc',
  remaining: '#94a3b8',
} as const;

export interface FinancialImpactCalculatorProps {
  scholarship: Scholarship;
  profile: StudentProfile;
}

interface CostLine {
  label: string;
  value: number;
}

/**
 * Interactive cost-of-attendance calculator.
 *
 * The student drags a projected award amount anywhere up to the scholarship's
 * published annual value and immediately sees how much of their annual cost of
 * attendance is covered, and what remains out of pocket.
 */
export function FinancialImpactCalculator({ scholarship, profile }: FinancialImpactCalculatorProps) {
  /** The scheme's full annual award is the default; the slider models partial awards. */
  const awardCeiling = scholarship.amount;
  const [projectedAward, setProjectedAward] = useState<number>(scholarship.amount);

  const math = useMemo(() => {
    const costLines: CostLine[] = [
      { label: 'Tuition fee', value: profile.tuition },
      { label: 'Exam & other fees', value: profile.fees },
      { label: 'Hostel & mess', value: profile.housing },
      { label: 'Books & supplies', value: profile.books },
      { label: 'Personal & travel', value: profile.personal },
    ];

    const totalCost = costLines.reduce((sum, line) => sum + line.value, 0);
    const totalAid = projectedAward + profile.otherAid;
    const covered = Math.min(totalCost, totalAid);
    const outOfPocket = Math.max(0, totalCost - totalAid);
    const aidRatio = totalCost > 0 ? Math.min(1, totalAid / totalCost) : 0;

    const breakdown = costLines.map((line) => ({
      label: line.label,
      covered: Math.round(line.value * aidRatio),
      remaining: Math.round(line.value * (1 - aidRatio)),
    }));

    return {
      costLines,
      totalCost,
      totalAid,
      covered,
      outOfPocket,
      aidRatio,
      breakdown,
      coveragePercent: percent(covered, totalCost),
    };
  }, [profile, projectedAward]);

  const donutData = [
    { name: 'Covered by aid', value: math.covered, fill: CHART_COLORS.covered },
    { name: 'Out of pocket', value: math.outOfPocket, fill: CHART_COLORS.remaining },
  ];

  return (
    <div className="flex flex-col gap-5">
      {/* Projected award selector */}
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <label htmlFor={`award-range-${scholarship.id}`} className="text-sm font-medium text-foreground">
            Projected award
          </label>
          <output
            htmlFor={`award-range-${scholarship.id}`}
            className="text-lg font-semibold tabular-nums text-primary"
          >
            {formatCurrency(projectedAward)}
          </output>
        </div>
        <input
          id={`award-range-${scholarship.id}`}
          type="range"
          min={0}
          max={awardCeiling}
          step={500}
          value={projectedAward}
          onChange={(event) => setProjectedAward(Number(event.target.value))}
          aria-valuemin={0}
          aria-valuemax={awardCeiling}
          aria-valuenow={projectedAward}
          aria-valuetext={formatCurrency(projectedAward)}
          className={cn(
            'h-2 w-full cursor-pointer appearance-none rounded-full bg-muted accent-primary',
            'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring',
            'focus-visible:ring-offset-2 focus-visible:ring-offset-background',
          )}
        />
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{formatCurrency(0)}</span>
          <span>Up to the scheme&rsquo;s annual ceiling</span>
          <span>{formatCurrency(awardCeiling)}</span>
        </div>
      </div>

      {/* KPI row */}
      <dl className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {[
          { label: 'Total cost', value: math.totalCost, tone: 'text-foreground' },
          { label: 'Total aid', value: math.totalAid, tone: 'text-success' },
          { label: 'Out of pocket', value: math.outOfPocket, tone: 'text-warning' },
        ].map((item) => (
          <div key={item.label} className="rounded-lg border border-border bg-muted/40 p-3">
            <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
              {item.label}
            </dt>
            <dd className={cn('mt-1 text-base font-semibold tabular-nums', item.tone)}>
              {formatCurrency(item.value)}
            </dd>
          </div>
        ))}
        <div className="rounded-lg border border-border bg-muted/40 p-3">
          <dt className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">Coverage</dt>
          <dd className="mt-1 text-base font-semibold tabular-nums text-primary">{math.coveragePercent}%</dd>
        </div>
      </dl>

      <div className="grid gap-5 md:grid-cols-2">
        {/* Coverage donut */}
        <figure className="flex flex-col items-center gap-3 rounded-xl border border-border bg-card p-4">
          <figcaption className="flex items-center gap-2 self-start text-sm font-medium text-foreground">
            <PiggyBank className="size-4 text-primary" aria-hidden="true" />
            Award vs. remaining costs
          </figcaption>
          <div className="relative h-48 w-full" role="img" aria-label={`${math.coveragePercent} percent of total cost is covered by aid`}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={donutData}
                  dataKey="value"
                  nameKey="name"
                  innerRadius="62%"
                  outerRadius="90%"
                  paddingAngle={2}
                  strokeWidth={0}
                >
                  {donutData.map((entry) => (
                    <Cell key={entry.name} fill={entry.fill} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(value) => formatCurrency(Number(value))}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="pointer-events-none absolute inset-0 grid place-items-center">
              <span className="text-center">
                <span className="block text-2xl font-bold tabular-nums text-foreground">
                  {math.coveragePercent}%
                </span>
                <span className="block text-[11px] uppercase tracking-wide text-muted-foreground">covered</span>
              </span>
            </div>
          </div>
          <ul className="flex w-full flex-col gap-1.5 text-xs">
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ background: CHART_COLORS.covered }} aria-hidden="true" />
                Covered by aid
              </span>
              <span className="font-semibold tabular-nums text-foreground">{formatCurrency(math.covered)}</span>
            </li>
            <li className="flex items-center justify-between gap-3">
              <span className="flex items-center gap-2 text-muted-foreground">
                <span className="size-2.5 rounded-full" style={{ background: CHART_COLORS.remaining }} aria-hidden="true" />
                Out of pocket
              </span>
              <span className="font-semibold tabular-nums text-foreground">{formatCurrency(math.outOfPocket)}</span>
            </li>
          </ul>
        </figure>

        {/* Per-category stacked breakdown */}
        <figure className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4">
          <figcaption className="flex items-center gap-2 text-sm font-medium text-foreground">
            <Wallet className="size-4 text-primary" aria-hidden="true" />
            Cost breakdown by category
          </figcaption>
          <div className="h-48 w-full" role="img" aria-label="Stacked bar chart of covered and uncovered costs by category">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={math.breakdown} layout="vertical" margin={{ top: 0, right: 8, bottom: 0, left: 0 }}>
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="label"
                  width={104}
                  tickLine={false}
                  axisLine={false}
                  tick={{ fontSize: 11, fill: 'var(--muted-foreground)' }}
                />
                <Tooltip
                  formatter={(value, name) => [formatCurrency(Number(value)), name === 'covered' ? 'Covered' : 'Out of pocket']}
                  contentStyle={{
                    borderRadius: 12,
                    border: '1px solid var(--border)',
                    background: 'var(--popover)',
                    color: 'var(--popover-foreground)',
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="covered" stackId="cost" fill={CHART_COLORS.covered} radius={[0, 0, 0, 0]} />
                <Bar dataKey="remaining" stackId="cost" fill={CHART_COLORS.remaining} radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="flex flex-col gap-2.5">
            {math.costLines.map((line) => (
              <div key={line.label} className="flex flex-col gap-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">{line.label}</span>
                  <span className="font-medium tabular-nums text-foreground">{formatCurrency(line.value)}</span>
                </div>
                <Progress
                  value={percent(line.value, math.totalCost)}
                  tone="primary"
                  label={`${line.label}: ${percent(line.value, math.totalCost)} percent of total cost`}
                />
              </div>
            ))}
          </div>
        </figure>
      </div>

      {/* Screen-reader friendly numeric summary of the charts above. */}
      <table className="sr-only">
        <caption>Financial impact summary</caption>
        <tbody>
          <tr>
            <th scope="row">Total cost of attendance</th>
            <td>{formatCurrency(math.totalCost)}</td>
          </tr>
          <tr>
            <th scope="row">Total aid applied</th>
            <td>{formatCurrency(math.totalAid)}</td>
          </tr>
          <tr>
            <th scope="row">Out of pocket</th>
            <td>{formatCurrency(math.outOfPocket)}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
