import React, { useMemo, useState } from 'react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { 
  TrendingUp, CheckCircle2, Clock, AlertCircle, 
  Calendar, BookOpen, Target, Zap, Filter, 
  ChevronDown, ArrowUpRight, ArrowDownRight
} from 'lucide-react';
import { Task, WeekPlan } from '../types';
import { 
  format, startOfWeek, endOfWeek, eachDayOfInterval, 
  isSameDay, parseISO, subDays, startOfMonth, endOfMonth,
  isWithinInterval, differenceInHours, parse
} from 'date-fns';
import { motion } from 'motion/react';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

interface AnalyticsDashboardProps {
  tasks: Task[];
  weekPlans: WeekPlan[];
}

type TimeFilter = 'today' | 'week' | 'month' | 'custom';

export default function AnalyticsDashboard({ tasks, weekPlans }: AnalyticsDashboardProps) {
  const [timeFilter, setTimeFilter] = useState<TimeFilter>('week');
  const [customRange, setCustomRange] = useState<{ start: string; end: string }>({
    start: format(subDays(new Date(), 30), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });

  const filteredTasks = useMemo(() => {
    const now = new Date();
    let start: Date, end: Date;

    switch (timeFilter) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0));
        end = new Date(now.setHours(23, 59, 59, 999));
        break;
      case 'week':
        start = startOfWeek(now);
        end = endOfWeek(now);
        break;
      case 'month':
        start = startOfMonth(now);
        end = endOfMonth(now);
        break;
      case 'custom':
        start = parseISO(customRange.start);
        end = parseISO(customRange.end);
        break;
      default:
        start = startOfWeek(now);
        end = endOfWeek(now);
    }

    return tasks.filter(t => {
      const taskDate = parseISO(t.date);
      return isWithinInterval(taskDate, { start, end });
    });
  }, [tasks, timeFilter, customRange]);

  const stats = useMemo(() => {
    const total = filteredTasks.length;
    const completed = filteredTasks.filter(t => t.status === 'Completed').length;
    const pending = filteredTasks.filter(t => t.status !== 'Completed').length;
    const overdue = filteredTasks.filter(t => t.status !== 'Completed' && parseISO(t.date) < new Date()).length;
    const completionRate = total > 0 ? Math.round((completed / total) * 100) : 0;
    
    // Weekly Productivity Score (arbitrary calculation)
    const score = Math.min(100, Math.round((completed * 10 + (total - overdue) * 5) / (total || 1)));

    return { total, completed, pending, overdue, completionRate, score };
  }, [filteredTasks]);

  const studyStats = useMemo(() => {
    const studyTasks = filteredTasks.filter(t => t.category === 'study');
    
    let totalMinutes = 0;
    const subjectMinutes: Record<string, number> = {};

    studyTasks.forEach(t => {
      try {
        const start = parse(t.startTime, 'HH:mm', new Date());
        const end = parse(t.endTime, 'HH:mm', new Date());
        const diff = (end.getTime() - start.getTime()) / (1000 * 60);
        if (diff > 0) {
          totalMinutes += diff;
          const subject = t.title.split(':')[0] || 'General';
          subjectMinutes[subject] = (subjectMinutes[subject] || 0) + diff;
        }
      } catch (e) {}
    });

    const totalHours = Math.round((totalMinutes / 60) * 10) / 10;
    const mostStudied = Object.entries(subjectMinutes).sort((a, b) => b[1] - a[1])[0]?.[0] || 'None';
    
    const daysCount = timeFilter === 'week' ? 7 : timeFilter === 'month' ? 30 : 1;
    const avgTime = Math.round((totalHours / daysCount) * 10) / 10;

    return { totalHours, mostStudied, avgTime };
  }, [filteredTasks, timeFilter]);

  const dailyChartData = useMemo(() => {
    const now = new Date();
    const start = timeFilter === 'month' ? startOfMonth(now) : startOfWeek(now);
    const end = timeFilter === 'month' ? endOfMonth(now) : endOfWeek(now);
    const days = eachDayOfInterval({ start, end });

    return days.map(day => {
      const dayTasks = tasks.filter(t => isSameDay(parseISO(t.date), day));
      const completed = dayTasks.filter(t => t.status === 'Completed').length;
      
      let studyMins = 0;
      dayTasks.filter(t => t.category === 'study').forEach(t => {
        try {
          const s = parse(t.startTime, 'HH:mm', new Date());
          const e = parse(t.endTime, 'HH:mm', new Date());
          studyMins += (e.getTime() - s.getTime()) / (1000 * 60);
        } catch (err) {}
      });

      return {
        name: format(day, 'EEE'),
        fullDate: format(day, 'MMM d'),
        tasks: dayTasks.length,
        completed,
        productivity: dayTasks.length > 0 ? Math.round((completed / dayTasks.length) * 100) : 0,
        studyHours: Math.round((studyMins / 60) * 10) / 10
      };
    });
  }, [tasks, timeFilter]);

  const categoryData = useMemo(() => {
    const categories: Record<string, number> = {};
    filteredTasks.forEach(t => {
      categories[t.category] = (categories[t.category] || 0) + 1;
    });
    return Object.entries(categories).map(([name, value]) => ({ name, value }));
  }, [filteredTasks]);

  const COLORS = ['var(--accent-blue)', 'var(--accent-green)', 'var(--accent-amber)', 'var(--accent-red)', 'var(--accent-purple)'];

  return (
    <div className="flex-1 flex flex-col bg-bg-primary overflow-hidden custom-scrollbar">
      {/* Header */}
      <div className="p-8 border-b border-border-main bg-bg-sidebar">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-3 text-text-primary">
              <TrendingUp className="w-7 h-7 text-accent-blue" />
              Analytics Dashboard
            </h1>
            <p className="text-sm text-text-muted mt-1">Real-time performance overview and productivity insights.</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 bg-bg-secondary p-1 rounded-xl border border-border-main">
              {(['today', 'week', 'month', 'custom'] as TimeFilter[]).map(f => (
                <button
                  key={f}
                  onClick={() => setTimeFilter(f)}
                  className={cn(
                    "px-4 py-1.5 rounded-lg text-xs font-bold transition-all capitalize",
                    timeFilter === f ? "bg-accent-blue text-white shadow-lg" : "text-text-muted hover:text-text-secondary"
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Productivity Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          <MetricCard 
            label="Total Tasks" 
            value={stats.total} 
            icon={<Target className="w-4 h-4" />} 
            color="text-accent-blue"
            trend="+12%"
            isUp={true}
          />
          <MetricCard 
            label="Completed" 
            value={stats.completed} 
            icon={<CheckCircle2 className="w-4 h-4" />} 
            color="text-accent-green"
            trend="+5%"
            isUp={true}
          />
          <MetricCard 
            label="Pending" 
            value={stats.pending} 
            icon={<Clock className="w-4 h-4" />} 
            color="text-accent-amber"
            trend="-2%"
            isUp={false}
          />
          <MetricCard 
            label="Overdue" 
            value={stats.overdue} 
            icon={<AlertCircle className="w-4 h-4" />} 
            color="text-accent-red"
            trend="+1%"
            isUp={false}
          />
          <MetricCard 
            label="Completion Rate" 
            value={`${stats.completionRate}%`} 
            icon={<Zap className="w-4 h-4" />} 
            color="text-accent-blue"
            progress={stats.completionRate}
          />
          <MetricCard 
            label="Productivity Score" 
            value={stats.score} 
            icon={<TrendingUp className="w-4 h-4" />} 
            color="text-accent-purple"
            progress={stats.score}
          />
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-8 space-y-8 custom-scrollbar">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Chart - Weekly Task Completion */}
          <div className="lg:col-span-2 bg-bg-secondary border border-border-main rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold flex items-center gap-2 text-text-primary">
                <Calendar className="w-5 h-5 text-accent-blue" />
                Task Completion Trend
              </h3>
              <div className="flex items-center gap-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-accent-blue" />
                  <span className="text-text-muted">Total Tasks</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-accent-green" />
                  <span className="text-text-muted">Completed</span>
                </div>
              </div>
            </div>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyChartData}>
                  <defs>
                    <linearGradient id="colorTasks" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-green)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="var(--accent-green)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                  <XAxis 
                    dataKey="name" 
                    stroke="var(--text-muted)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dy={10}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={12} 
                    tickLine={false} 
                    axisLine={false}
                    dx={-10}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-main)', borderRadius: '12px' }}
                    itemStyle={{ fontSize: '12px' }}
                  />
                  <Area type="monotone" dataKey="tasks" stroke="var(--accent-blue)" strokeWidth={3} fillOpacity={1} fill="url(#colorTasks)" />
                  <Area type="monotone" dataKey="completed" stroke="var(--accent-green)" strokeWidth={3} fillOpacity={1} fill="url(#colorCompleted)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Study Analytics Card */}
          <div className="bg-bg-secondary border border-border-main rounded-2xl p-6">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-text-primary">
              <BookOpen className="w-5 h-5 text-accent-blue" />
              Study Analytics
            </h3>
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-bg-sidebar p-4 rounded-xl border border-border-main">
                  <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Total Hours</p>
                  <p className="text-2xl font-bold text-text-primary">{studyStats.totalHours}h</p>
                </div>
                <div className="bg-bg-sidebar p-4 rounded-xl border border-border-main">
                  <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Avg/Day</p>
                  <p className="text-2xl font-bold text-text-primary">{studyStats.avgTime}h</p>
                </div>
              </div>
              
              <div className="bg-bg-sidebar p-4 rounded-xl border border-border-main">
                <p className="text-[10px] font-bold text-text-muted uppercase mb-1">Most Studied Subject</p>
                <p className="text-lg font-bold text-accent-blue truncate">{studyStats.mostStudied}</p>
              </div>

              <div className="h-40">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                    <XAxis dataKey="name" hide />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-main)', borderRadius: '12px' }}
                    />
                    <Bar dataKey="studyHours" fill="var(--accent-blue)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Daily Productivity Bar Chart */}
          <div className="bg-bg-secondary border border-border-main rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 flex items-center gap-2 text-text-primary">
              <Zap className="w-5 h-5 text-accent-orange" />
              Daily Productivity (%)
            </h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dailyChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--border-main)" vertical={false} />
                  <XAxis dataKey="name" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-main)', borderRadius: '12px' }}
                  />
                  <Bar dataKey="productivity" fill="var(--accent-orange)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Category Distribution */}
          <div className="bg-bg-secondary border border-border-main rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 text-text-primary">Task Categories</h3>
            <div className="flex items-center">
              <div className="w-1/2 h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={categoryData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {categoryData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'var(--bg-sidebar)', border: '1px solid var(--border-main)', borderRadius: '12px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="w-1/2 space-y-3">
                {categoryData.map((item, index) => (
                  <div key={item.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                      <span className="text-sm text-text-muted capitalize">{item.name}</span>
                    </div>
                    <span className="text-sm font-bold text-text-primary">{item.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Activity Intensity Heatmap Placeholder */}
          <div className="bg-bg-secondary border border-border-main rounded-2xl p-6">
            <h3 className="text-lg font-bold mb-6 text-text-primary">Activity Intensity</h3>
            <div className="grid grid-cols-7 gap-2">
              {Array.from({ length: 35 }).map((_, i) => {
                const intensity = Math.random();
                return (
                  <div 
                    key={i} 
                    className="aspect-square rounded-md transition-all hover:scale-110 cursor-pointer"
                    style={{ 
                      backgroundColor: `rgba(var(--accent-blue-rgb), ${intensity})`,
                      border: intensity > 0.1 ? 'none' : '1px solid var(--border-main)'
                    }}
                    title={`Activity level: ${Math.round(intensity * 100)}%`}
                  />
                );
              })}
            </div>
            <div className="flex items-center justify-between mt-6 text-[10px] text-text-muted font-bold uppercase tracking-widest">
              <span>Less</span>
              <div className="flex gap-1">
                {[0.1, 0.3, 0.5, 0.7, 0.9].map(o => (
                  <div key={o} className="w-3 h-3 rounded-sm" style={{ backgroundColor: `rgba(var(--accent-blue-rgb), ${o})` }} />
                ))}
              </div>
              <span>More</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, icon, color, trend, isUp, progress }: any) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-bg-secondary border border-border-main rounded-2xl p-4 flex flex-col justify-between hover:border-border-strong transition-all"
    >
      <div className="flex items-center justify-between mb-2">
        <div className={cn("p-2 rounded-lg bg-bg-hover", color)}>
          {icon}
        </div>
        {trend && (
          <div className={cn(
            "flex items-center gap-0.5 text-[10px] font-bold",
            isUp ? "text-accent-green" : "text-accent-red"
          )}>
            {isUp ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
            {trend}
          </div>
        )}
      </div>
      <div>
        <p className="text-[10px] font-bold text-text-muted uppercase tracking-widest mb-1">{label}</p>
        <h3 className="text-xl font-bold text-text-primary">{value}</h3>
      </div>
      {progress !== undefined && (
        <div className="mt-3 w-full h-1 bg-bg-hover rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className={cn("h-full", color.replace('text-', 'bg-'))}
          />
        </div>
      )}
    </motion.div>
  );
}
