import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  PlusCircle,
  Award,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  ArrowRight,
  RefreshCw,
  Target,
  FileText,
  Sparkles,
} from 'lucide-react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts';
import { useAuth } from '../hooks/useAuth';
import { api } from '../services/api';
import { DashboardSummary } from '../types';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ErrorAlert } from '../components/ErrorAlert';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [data, setData] = useState<DashboardSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const summary = await api.getDashboard();
      setData(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve dashboard performance metrics.');
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeWeaknesses = async (interviewId: string) => {
    try {
      const res = await api.practiceWeaknesses(interviewId);
      navigate(`/interview/${res.interview_id}`);
    } catch (err: any) {
      setError(err.message || 'Could not initiate weakness drill.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingIndicator message="Compiling candidate skill metrics and interview history..." />
      </div>
    );
  }

  const firstName = user?.name ? user.name.split(' ')[0] : 'Candidate';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 animate-fade-in">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 tracking-tight">
              Welcome back, {firstName}
            </h1>
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-mono">
              <Sparkles className="w-3 h-3" />
              Skill Calibration Active
            </span>
          </div>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Review your dynamic skill progress, practice target competencies, or launch a new adaptive session.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-lg shadow-brand-500/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Start New Interview
        </Link>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadDashboard} />}

      {/* METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Completed */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Interviews Completed</span>
            <CheckCircle2 className="w-4 h-4 text-brand-400" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-100">
            {data?.total_interviews_completed || 0}
          </div>
          <p className="text-[11px] text-zinc-500">Recorded across all target roles</p>
        </div>

        {/* Card 2: Average Readiness Score */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Average Readiness</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-3xl font-extrabold text-zinc-100 flex items-baseline gap-1">
            <span>{data?.average_readiness_score || 0}</span>
            <span className="text-sm font-normal text-zinc-500">/ 100</span>
          </div>
          <p className="text-[11px] text-zinc-500">Weighted objective rubric score</p>
        </div>

        {/* Card 3: Strongest Skill */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Strongest Skill</span>
            <TrendingUp className="w-4 h-4 text-cyan-400" />
          </div>
          <div className="text-lg font-bold text-zinc-100 truncate">
            {data?.strongest_skill || 'Pending evaluation'}
          </div>
          <p className="text-[11px] text-zinc-500">Consistently high technical rubric marks</p>
        </div>

        {/* Card 4: Primary Improvement Area */}
        <div className="glass-card p-5 rounded-2xl border border-zinc-800/80 space-y-2">
          <div className="flex items-center justify-between text-zinc-400">
            <span className="text-xs font-medium uppercase tracking-wider font-mono">Growth Focus</span>
            <AlertTriangle className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-lg font-bold text-zinc-100 truncate">
            {data?.primary_improvement_area || 'None identified'}
          </div>
          <p className="text-[11px] text-zinc-500">Recommended for targeted mock practice</p>
        </div>
      </div>

      {/* PROGRESS CHART SECTION */}
      <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-bold text-zinc-100">Readiness Score Trajectory</h2>
            <p className="text-xs text-zinc-400">
              Evaluated performance trends across successive mock interviews
            </p>
          </div>
          <span className="text-xs font-mono text-zinc-500">0 to 100 Scale</span>
        </div>

        {data?.progress_trend && data.progress_trend.length > 0 ? (
          <div className="h-64 w-full pt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.progress_trend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="date" stroke="#71717a" fontSize={11} tickLine={false} />
                <YAxis domain={[0, 100]} stroke="#71717a" fontSize={11} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#18181b',
                    borderColor: '#3f3f46',
                    borderRadius: '0.75rem',
                    fontSize: '12px',
                    fontFamily: 'monospace',
                  }}
                  itemStyle={{ color: '#c4b5fd' }}
                  labelStyle={{ color: '#e4e4e7', fontWeight: 'bold' }}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  stroke="#8b5cf6"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#scoreGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="h-44 flex flex-col items-center justify-center border border-dashed border-zinc-800 rounded-xl text-zinc-500 text-xs">
            <TrendingUp className="w-8 h-8 mb-2 stroke-1 text-zinc-600" />
            <span>Complete your first interview to generate a readiness trajectory chart.</span>
          </div>
        )}
      </div>

      {/* RECENT INTERVIEWS TABLE */}
      <div className="glass-card rounded-2xl border border-zinc-800 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-zinc-100">Recent Interview Sessions</h2>
            <p className="text-xs text-zinc-400">Review evaluation reports and practice weaker competencies</p>
          </div>
          <Link
            to="/history"
            className="text-xs text-brand-400 hover:text-brand-300 font-medium inline-flex items-center gap-1"
          >
            View Full History
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-6">Target Role</th>
                <th className="py-3 px-6">Type & Level</th>
                <th className="py-3 px-6">Questions</th>
                <th className="py-3 px-6">Readiness Score</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {data?.recent_interviews && data.recent_interviews.length > 0 ? (
                data.recent_interviews.map((item) => (
                  <tr key={item.interview_id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 px-6 font-medium text-zinc-100 flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand-500" />
                      <span>{item.role}</span>
                    </td>
                    <td className="py-3.5 px-6 capitalize text-zinc-400">
                      {item.interview_type} • {item.experience}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-zinc-400">
                      {item.current_question_number} / {item.question_limit}
                    </td>
                    <td className="py-3.5 px-6 font-semibold font-mono">
                      {item.readiness_score !== undefined && item.readiness_score !== null ? (
                        <span className={item.readiness_score >= 80 ? 'text-emerald-400' : item.readiness_score >= 60 ? 'text-amber-400' : 'text-rose-400'}>
                          {item.readiness_score} / 100
                        </span>
                      ) : (
                        <span className="text-zinc-500">—</span>
                      )}
                    </td>
                    <td className="py-3.5 px-6">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-[10px] font-mono uppercase ${
                          item.status === 'COMPLETED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : item.status === 'ACTIVE'
                            ? 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                            : 'bg-zinc-800 text-zinc-400'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-2">
                      {item.status === 'COMPLETED' ? (
                        <>
                          <Link
                            to={`/report/${item.interview_id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-zinc-800 hover:bg-zinc-700 text-zinc-200 transition-colors"
                          >
                            <FileText className="w-3 h-3" />
                            Report
                          </Link>
                          <button
                            onClick={() => handlePracticeWeaknesses(item.interview_id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-600/20 hover:bg-brand-600/30 text-brand-300 border border-brand-500/30 transition-colors"
                            title="Start target interview on weakest skills"
                          >
                            <Target className="w-3 h-3 text-brand-400" />
                            Practice Weaknesses
                          </button>
                        </>
                      ) : (
                        <Link
                          to={`/interview/${item.interview_id}`}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                        >
                          Resume
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-zinc-500">
                    No recent interviews found. Launch a new simulation above!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
