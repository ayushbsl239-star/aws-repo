import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  History,
  FileText,
  Target,
  RotateCcw,
  Trash2,
  Filter,
  PlusCircle,
  Calendar,
  Sparkles,
} from 'lucide-react';
import { api } from '../services/api';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ErrorAlert } from '../components/ErrorAlert';

export const HistoryPage: React.FC = () => {
  const navigate = useNavigate();

  const [interviews, setInterviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  useEffect(() => {
    loadInterviews();
  }, []);

  const loadInterviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.getInterviews();
      setInterviews(res.interviews || []);
    } catch (err: any) {
      setError(err.message || 'Failed to retrieve interview history.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this interview record? This action cannot be undone.');
    if (!confirmDelete) return;

    try {
      await api.deleteInterview(id);
      setInterviews((prev) => prev.filter((i) => i.interview_id !== id));
    } catch (err: any) {
      setError(err.message || 'Failed to delete interview record.');
    }
  };

  const handlePracticeWeaknesses = async (id: string) => {
    try {
      const res = await api.practiceWeaknesses(id);
      navigate(`/interview/${res.interview_id}`);
    } catch (err: any) {
      setError(err.message || 'Could not initiate weakness drill.');
    }
  };

  const handleRetryRole = (item: any) => {
    navigate('/interview/new');
  };

  // Filtered List
  const roles = Array.from(new Set(interviews.map((i) => i.role)));
  const filtered = interviews.filter((item) => {
    if (roleFilter !== 'ALL' && item.role !== roleFilter) return false;
    if (statusFilter !== 'ALL' && item.status !== statusFilter) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingIndicator message="Fetching candidate interview archive..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-zinc-900">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-zinc-100 flex items-center gap-2">
            <History className="w-6 h-6 text-brand-400" />
            My Interview Archive
          </h1>
          <p className="text-xs text-zinc-400 mt-1">
            Browse previous mock interview evaluations, review coaching feedback, and launch targeted practice sessions.
          </p>
        </div>

        <Link
          to="/interview/new"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          Start New Interview
        </Link>
      </div>

      {error && <ErrorAlert message={error} onRetry={loadInterviews} />}

      {/* FILTER BAR */}
      <div className="flex flex-wrap items-center justify-between gap-4 p-4 rounded-xl glass-card border border-zinc-800 text-xs">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 text-zinc-400 font-mono">
            <Filter className="w-3.5 h-3.5 text-brand-400" />
            <span>Filter By:</span>
          </div>

          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 outline-none"
          >
            <option value="ALL">All Roles ({interviews.length})</option>
            {roles.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 outline-none"
          >
            <option value="ALL">All Statuses</option>
            <option value="COMPLETED">Completed</option>
            <option value="ACTIVE">Active / In-Progress</option>
          </select>
        </div>

        <span className="font-mono text-zinc-500 text-[11px]">
          Showing {filtered.length} of {interviews.length} sessions
        </span>
      </div>

      {/* INTERVIEWS TABLE */}
      <div className="glass-card rounded-2xl border border-zinc-800 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-zinc-800 bg-zinc-900/50 text-zinc-400 font-mono uppercase text-[10px]">
                <th className="py-3 px-6">Date</th>
                <th className="py-3 px-6">Target Role</th>
                <th className="py-3 px-6">Type & Level</th>
                <th className="py-3 px-6">Questions</th>
                <th className="py-3 px-6">Readiness Score</th>
                <th className="py-3 px-6">Status</th>
                <th className="py-3 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 text-zinc-300">
              {filtered.length > 0 ? (
                filtered.map((item) => (
                  <tr key={item.interview_id} className="hover:bg-zinc-900/30 transition-colors">
                    <td className="py-3.5 px-6 font-mono text-zinc-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-zinc-500" />
                      <span>
                        {new Date(
                          (item.created_at || Date.now() / 1000) * 1000
                        ).toLocaleDateString()}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 font-semibold text-zinc-100">{item.role}</td>
                    <td className="py-3.5 px-6 capitalize text-zinc-400">
                      {item.interview_type} • {item.experience}
                    </td>
                    <td className="py-3.5 px-6 font-mono text-zinc-400">
                      {item.current_question_number} / {item.question_limit}
                    </td>
                    <td className="py-3.5 px-6 font-mono font-bold">
                      {item.readiness_score !== undefined && item.readiness_score !== null ? (
                        <span
                          className={
                            item.readiness_score >= 80
                              ? 'text-emerald-400'
                              : item.readiness_score >= 60
                              ? 'text-amber-400'
                              : 'text-rose-400'
                          }
                        >
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
                            : 'bg-brand-500/10 text-brand-400 border border-brand-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3.5 px-6 text-right space-x-1.5">
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
                            title="Drill weak competencies"
                          >
                            <Target className="w-3 h-3" />
                            Drill
                          </button>
                        </>
                      ) : (
                        <Link
                          to={`/interview/${item.interview_id}`}
                          className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-brand-600 hover:bg-brand-500 text-white transition-colors"
                        >
                          Resume
                        </Link>
                      )}

                      <button
                        onClick={() => handleDelete(item.interview_id)}
                        className="p-1.5 rounded hover:bg-rose-950/40 text-zinc-500 hover:text-rose-400 transition-colors"
                        title="Delete interview record"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-zinc-500">
                    No matching interviews found.
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
