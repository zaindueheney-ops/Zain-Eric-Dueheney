import React, { useMemo, useState } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from 'recharts';
import { EmergencyIncident } from '../types';
import {
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ChevronDown,
  ChevronUp,
  BarChart3,
  LineChart as LineChartIcon,
  ShieldAlert,
  Layers,
  Info,
} from 'lucide-react';

interface DailyIncidentTrendsProps {
  incidents: EmergencyIncident[];
  className?: string;
  defaultExpanded?: boolean;
}

interface DayData {
  dateKey: string;
  displayDate: string;
  dayLabel: string;
  total: number;
  critical: number;
  moderate: number;
  resolved: number;
  active: number;
}

export const DailyIncidentTrends: React.FC<DailyIncidentTrendsProps> = ({
  incidents,
  className = '',
  defaultExpanded,
}) => {
  // Mobile optimization: default collapsed on small screens to conserve GPU/memory
  const [isExpanded, setIsExpanded] = useState<boolean>(() => {
    if (defaultExpanded !== undefined) return defaultExpanded;
    if (typeof window !== 'undefined') {
      return window.innerWidth >= 768;
    }
    return false;
  });
  const [chartType, setChartType] = useState<'trend' | 'severity' | 'bars'>('trend');
  const [scope, setScope] = useState<'all' | 'approved'>('all');

  // Compute trailing 7 calendar days data
  const { chartData, metrics, dateRangeLabel } = useMemo(() => {
    // Filter by scope if requested
    const filteredSource = scope === 'approved'
      ? incidents.filter((inc) => inc.status !== 'reported')
      : incidents;

    const days: DayData[] = [];
    const today = new Date();

    // Trailing 7 days: i = 6 down to 0
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const dateNum = String(d.getDate()).padStart(2, '0');
      const dateKey = `${year}-${month}-${dateNum}`;

      const shortMonth = d.toLocaleDateString('en-US', { month: 'short' });
      const weekday = d.toLocaleDateString('en-US', { weekday: 'short' });
      const isToday = i === 0;

      days.push({
        dateKey,
        displayDate: `${shortMonth} ${dateNum}`,
        dayLabel: isToday ? `Today (${dateNum})` : `${weekday} ${dateNum}`,
        total: 0,
        critical: 0,
        moderate: 0,
        resolved: 0,
        active: 0,
      });
    }

    // Populate counts from incident timestamps
    filteredSource.forEach((inc) => {
      if (!inc.createdAt) return;
      const incDate = new Date(inc.createdAt);
      if (isNaN(incDate.getTime())) return;

      const incYear = incDate.getFullYear();
      const incMonth = String(incDate.getMonth() + 1).padStart(2, '0');
      const incDateNum = String(incDate.getDate()).padStart(2, '0');
      const incDateKey = `${incYear}-${incMonth}-${incDateNum}`;

      const targetDay = days.find((d) => d.dateKey === incDateKey);
      if (targetDay) {
        targetDay.total += 1;
        const sev = (inc.severity || '').toLowerCase();
        if (sev === 'critical' || sev === 'high') {
          targetDay.critical += 1;
        } else {
          targetDay.moderate += 1;
        }

        const stat = (inc.status || '').toLowerCase();
        if (stat === 'resolved') {
          targetDay.resolved += 1;
        } else if (stat !== 'false_alarm') {
          targetDay.active += 1;
        }
      }
    });

    // Summary calculations
    const total7Days = days.reduce((sum, d) => sum + d.total, 0);
    const critical7Days = days.reduce((sum, d) => sum + d.critical, 0);
    const resolved7Days = days.reduce((sum, d) => sum + d.resolved, 0);
    const active7Days = days.reduce((sum, d) => sum + d.active, 0);
    const dailyAvg = (total7Days / 7).toFixed(1);

    // Peak day
    const peakDay = days.reduce<DayData | null>(
      (max, d) => (!max || d.total > max.total ? d : max),
      null
    );

    const startDateStr = days[0]?.displayDate || '';
    const endDateStr = days[days.length - 1]?.displayDate || '';
    const rangeLabel = `${startDateStr} - ${endDateStr}`;

    return {
      chartData: days,
      metrics: {
        total7Days,
        critical7Days,
        resolved7Days,
        active7Days,
        dailyAvg,
        peakDay: peakDay && peakDay.total > 0 ? `${peakDay.dayLabel} (${peakDay.total})` : 'None (0)',
        criticalRatio: total7Days > 0 ? Math.round((critical7Days / total7Days) * 100) : 0,
      },
      dateRangeLabel: rangeLabel,
    };
  }, [incidents, scope]);

  // Custom tooltips with Belize emergency theme
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dayInfo = chartData.find((d) => d.dayLabel === label) || payload[0]?.payload;
      return (
        <div className="bg-[#1f040b] border-2 border-[#d4af37] p-3 rounded-xl shadow-2xl text-xs space-y-1.5 min-w-[180px] z-50">
          <div className="flex items-center justify-between border-b border-[#d4af37]/40 pb-1.5">
            <span className="font-black text-[#f3c853] flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              {label}
            </span>
            <span className="text-[10px] text-amber-200/80 font-mono">
              {dayInfo?.dateKey}
            </span>
          </div>

          <div className="space-y-1 pt-1">
            <div className="flex items-center justify-between text-white font-bold">
              <span className="flex items-center gap-1.5 text-amber-100">
                <span className="w-2.5 h-2.5 rounded-full bg-gradient-to-r from-[#d4af37] to-[#f59e0b]"></span>
                Total Reported:
              </span>
              <span className="font-mono text-base font-black text-[#f3c853]">
                {dayInfo?.total ?? 0}
              </span>
            </div>

            <div className="flex items-center justify-between text-red-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-red-500"></span>
                Critical / High:
              </span>
              <span className="font-mono font-bold">{dayInfo?.critical ?? 0}</span>
            </div>

            <div className="flex items-center justify-between text-amber-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                Medium / Low:
              </span>
              <span className="font-mono font-bold">{dayInfo?.moderate ?? 0}</span>
            </div>

            <div className="flex items-center justify-between text-emerald-300">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                Resolved:
              </span>
              <span className="font-mono font-bold">{dayInfo?.resolved ?? 0}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <section
      aria-label="Daily Incident Trends Dashboard"
      className={`bg-gradient-to-br from-[#24050e] via-[#1d030b] to-[#120106] border-2 border-[#d4af37]/60 rounded-2xl p-3 sm:p-4 shadow-xl text-white transition-all ${className}`}
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 pb-2 border-b border-[#d4af37]/30">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-[#841c34] to-[#3a0614] border border-[#d4af37]/60 flex items-center justify-center text-[#f3c853] shadow-md shrink-0">
            <TrendingUp className="w-5 h-5 text-amber-300" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-black tracking-tight text-white flex items-center gap-1.5">
                <span>Daily Incident Trends</span>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#d4af37]/20 text-[#f3c853] border border-[#d4af37]/40">
                  Last 7 Days
                </span>
              </h3>
            </div>
            <p className="text-[11px] text-amber-200/80 font-medium">
              Frequency of reported emergencies across Belize ({dateRangeLabel})
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5 self-end sm:self-auto flex-wrap">
          {/* Scope Switcher: All vs Approved */}
          <div className="flex items-center bg-[#150207] p-0.5 rounded-lg border border-[#d4af37]/40 text-[11px]">
            <button
              type="button"
              onClick={() => setScope('all')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                scope === 'all'
                  ? 'bg-[#d4af37] text-slate-950 shadow-sm'
                  : 'text-amber-200/70 hover:text-white'
              }`}
              title="Include all user-reported submissions"
            >
              All Reports
            </button>
            <button
              type="button"
              onClick={() => setScope('approved')}
              className={`px-2.5 py-1 rounded-md font-bold transition ${
                scope === 'approved'
                  ? 'bg-[#d4af37] text-slate-950 shadow-sm'
                  : 'text-amber-200/70 hover:text-white'
              }`}
              title="Only show incidents verified & broadcasted by dispatch"
            >
              Verified Only
            </button>
          </div>

          {/* Chart Type Selector */}
          <div className="flex items-center bg-[#150207] p-0.5 rounded-lg border border-[#d4af37]/40 text-[11px]">
            <button
              type="button"
              onClick={() => setChartType('trend')}
              className={`p-1.5 rounded-md transition ${
                chartType === 'trend'
                  ? 'bg-[#d4af37] text-slate-950'
                  : 'text-amber-200/70 hover:text-white'
              }`}
              title="Overall Incident Trend Area"
            >
              <LineChartIcon className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('severity')}
              className={`p-1.5 rounded-md transition ${
                chartType === 'severity'
                  ? 'bg-[#d4af37] text-slate-950'
                  : 'text-amber-200/70 hover:text-white'
              }`}
              title="Severity Breakdown (Critical vs Moderate)"
            >
              <Layers className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => setChartType('bars')}
              className={`p-1.5 rounded-md transition ${
                chartType === 'bars'
                  ? 'bg-[#d4af37] text-slate-950'
                  : 'text-amber-200/70 hover:text-white'
              }`}
              title="Daily Bar Volume"
            >
              <BarChart3 className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Minimize / Expand Toggle */}
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#330713] hover:bg-[#480c1d] border border-[#d4af37]/50 text-amber-200 text-xs font-bold transition shadow-sm"
            aria-expanded={isExpanded}
          >
            <span>{isExpanded ? 'Hide' : 'Show'}</span>
            {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* KPI Stats Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2.5">
        <div className="bg-[#19030a] border border-[#d4af37]/30 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-200/70 font-bold uppercase tracking-wider">
              7-Day Total
            </div>
            <div className="text-lg sm:text-xl font-black text-[#f3c853] font-mono leading-none mt-1">
              {metrics.total7Days}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Activity className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#19030a] border border-[#d4af37]/30 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-200/70 font-bold uppercase tracking-wider">
              Daily Average
            </div>
            <div className="text-lg sm:text-xl font-black text-white font-mono leading-none mt-1">
              {metrics.dailyAvg}
              <span className="text-[10px] font-sans text-amber-300 font-semibold ml-1">/ day</span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-blue-500/15 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Calendar className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#19030a] border border-[#d4af37]/30 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-200/70 font-bold uppercase tracking-wider">
              Critical / High
            </div>
            <div className="text-lg sm:text-xl font-black text-red-400 font-mono leading-none mt-1">
              {metrics.critical7Days}
              <span className="text-[10px] font-sans text-red-300 font-semibold ml-1">
                ({metrics.criticalRatio}%)
              </span>
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-red-500/15 border border-red-500/30 flex items-center justify-center text-red-400">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>

        <div className="bg-[#19030a] border border-[#d4af37]/30 rounded-xl p-2.5 flex items-center justify-between">
          <div>
            <div className="text-[10px] text-amber-200/70 font-bold uppercase tracking-wider">
              Peak Volume Day
            </div>
            <div className="text-xs sm:text-sm font-black text-amber-200 font-mono leading-tight mt-1 truncate max-w-[110px] sm:max-w-[130px]">
              {metrics.peakDay}
            </div>
          </div>
          <div className="w-8 h-8 rounded-lg bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <CheckCircle2 className="w-4 h-4" />
          </div>
        </div>
      </div>

      {/* Collapsible Chart Body */}
      {isExpanded && (
        <div className="pt-3.5 space-y-2">
          {/* Recharts Canvas */}
          <div className="h-[220px] sm:h-[260px] w-full bg-[#170208]/90 p-2 sm:p-3 rounded-xl border border-[#d4af37]/30 shadow-inner">
            <ResponsiveContainer width="100%" height="100%">
              {chartType === 'trend' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="trendGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#d4af37" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#d4af37" stopOpacity={0.05} />
                    </linearGradient>
                    <linearGradient id="criticalGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#ef4444" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#ef4444" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#841c34" opacity={0.35} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#f3c853"
                    tick={{ fill: '#e6c875', fontSize: 11, fontWeight: 600 }}
                    tickLine={{ stroke: '#841c34' }}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#f3c853"
                    tick={{ fill: '#e6c875', fontSize: 11 }}
                    tickLine={{ stroke: '#841c34' }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="total"
                    name="Total Emergencies"
                    stroke="#f3c853"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#trendGradient)"
                    dot={{ fill: '#d4af37', stroke: '#ffffff', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6, fill: '#ffffff', stroke: '#d4af37', strokeWidth: 3 }}
                  />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    name="Critical / High"
                    stroke="#ef4444"
                    strokeWidth={2}
                    fillOpacity={1}
                    fill="url(#criticalGradient)"
                    dot={{ fill: '#ef4444', stroke: '#ffffff', strokeWidth: 1.5, r: 3 }}
                  />
                </AreaChart>
              ) : chartType === 'severity' ? (
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="critSevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#dc2626" stopOpacity={0.8} />
                      <stop offset="95%" stopColor="#dc2626" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="modSevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.7} />
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.1} />
                    </linearGradient>
                    <linearGradient id="resSevGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.6} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.1} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#841c34" opacity={0.35} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#f3c853"
                    tick={{ fill: '#e6c875', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#f3c853"
                    tick={{ fill: '#e6c875', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="critical"
                    name="Critical / High"
                    stackId="1"
                    stroke="#ef4444"
                    fill="url(#critSevGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="moderate"
                    name="Medium / Low"
                    stackId="1"
                    stroke="#f59e0b"
                    fill="url(#modSevGrad)"
                    strokeWidth={2}
                  />
                  <Area
                    type="monotone"
                    dataKey="resolved"
                    name="Resolved"
                    stroke="#10b981"
                    fill="url(#resSevGrad)"
                    strokeWidth={2}
                  />
                </AreaChart>
              ) : (
                <BarChart
                  data={chartData}
                  margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#841c34" opacity={0.35} />
                  <XAxis
                    dataKey="dayLabel"
                    stroke="#f3c853"
                    tick={{ fill: '#e6c875', fontSize: 11, fontWeight: 600 }}
                  />
                  <YAxis
                    allowDecimals={false}
                    stroke="#f3c853"
                    tick={{ fill: '#e6c875', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar
                    dataKey="total"
                    name="Total Incidents"
                    fill="#d4af37"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="critical"
                    name="Critical/High"
                    fill="#ef4444"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              )}
            </ResponsiveContainer>
          </div>

          {/* Bottom Chart Footer Legend & Clarification */}
          <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-[11px] text-amber-200/80 font-medium">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-[#d4af37] border border-white/60"></span>
                <span>Total Reported</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-red-500 border border-white/60"></span>
                <span>Critical / High Priority</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 border border-white/60"></span>
                <span>Resolved</span>
              </span>
            </div>

            <div className="flex items-center gap-1.5 text-amber-300/80 ml-auto text-[10px]">
              <Info className="w-3 h-3 text-[#d4af37]" />
              <span>
                {metrics.total7Days === 0
                  ? 'Zero incidents reported in the last 7 days across Belize.'
                  : `${metrics.total7Days} total emergency occurrences registered over trailing 7 days.`}
              </span>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
