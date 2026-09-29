import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  Award,
  Download,
  Target,
  ArrowRight,
  TrendingUp,
  CheckCircle2,
  AlertTriangle,
  Lightbulb,
  Calendar,
  Sparkles,
  HelpCircle,
  Clock,
  BookOpen,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import confetti from 'canvas-confetti';
import { api } from '../services/api';
import { InterviewReportResponse } from '../types';
import { LoadingIndicator } from '../components/LoadingIndicator';
import { ErrorAlert } from '../components/ErrorAlert';

export const ReportPage: React.FC = () => {
  const { id: interviewId } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [data, setData] = useState<InterviewReportResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [expandedQuestions, setExpandedQuestions] = useState<Record<number, boolean>>({ 1: true });

  useEffect(() => {
    if (interviewId) loadReport();
  }, [interviewId]);

  const loadReport = async () => {
    if (!interviewId) return;
    setLoading(true);
    setError(null);
    try {
      const res = await api.getReport(interviewId);
      setData(res);
      // Trigger subtle celebration confetti on high readiness
      if (res.readiness_score >= 70) {
        confetti({
          particleCount: 50,
          spread: 60,
          origin: { y: 0.6 },
          colors: ['#8b5cf6', '#06b6d4', '#10b981'],
        });
      }
    } catch (err: any) {
      setError(err.message || 'Could not load interview assessment report.');
    } finally {
      setLoading(false);
    }
  };

  const handlePracticeWeaknesses = async () => {
    if (!interviewId) return;
    try {
      const res = await api.practiceWeaknesses(interviewId);
      navigate(`/interview/${res.interview_id}`);
    } catch (err: any) {
      setError(err.message || 'Could not launch weakness practice session.');
    }
  };

  const handleDownloadPdf = () => {
    if (!data?.pdf_download_url) {
      window.print();
      return;
    }
    window.open(data.pdf_download_url, '_blank');
  };

  const toggleQuestion = (num: number) => {
    setExpandedQuestions((prev) => ({ ...prev, [num]: !prev[num] }));
  };

  if (loading) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <LoadingIndicator
          message="Synthesizing interview assessment..."
          subtext="Computing readiness score, skill breakdowns, and personalized 7-day study plan..."
        />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center space-y-4">
        <AlertTriangle className="w-10 h-10 text-amber-400 mx-auto" />
        <h2 className="text-xl font-bold text-zinc-100">Report Not Available</h2>
        <p className="text-xs text-zinc-400">
          This interview has not concluded or evaluations are currently being saved.
        </p>
        <Link to="/dashboard" className="inline-block px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-semibold">
          Return to Dashboard
        </Link>
      </div>
    );
  }

  // Format Recharts data for radar & bar charts
  const radarData = Object.entries(data.skill_profile || {}).map(([skill, item]) => ({
    skill,
    score: item.current_score,
    fullMark: 10,
  }));

  const readinessScore = data.readiness_score || 0;

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-10 animate-fade-in">
      {/* TOP SUMMARY HERO */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-zinc-800 shadow-2xl relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-brand-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 rounded-full bg-brand-500/10 text-brand-400 border border-brand-500/20 text-xs font-mono font-semibold">
                Completed Assessment
              </span>
              <span className="text-xs text-zinc-400 font-mono">
                {data.role} • {data.experience}
              </span>
            </div>
            <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
              Interview Performance Report
            </h1>
            <p className="text-xs text-zinc-400 max-w-xl leading-relaxed">
              {data.report?.executive_summary ||
                'Candidate demonstrated comprehensive technical understanding across key domain concepts with areas for tactical refinement.'}
            </p>
          </div>

          {/* READINESS SCORE BADGE */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 shrink-0">
            <div className="text-center sm:text-left">
              <div className="flex items-center gap-1.5 text-zinc-400 text-xs font-mono mb-1">
                <Award className="w-4 h-4 text-brand-400" />
                <span>Interview Readiness Score</span>
              </div>
              <div className="flex items-baseline gap-2">
                <span
                  className={`text-5xl font-black font-mono tracking-tight ${
                    readinessScore >= 80 ? 'text-emerald-400' : readinessScore >= 60 ? 'text-amber-400' : 'text-rose-400'
                  }`}
                >
                  {readinessScore}
                </span>
                <span className="text-zinc-500 font-bold text-lg">/ 100</span>
              </div>
              <p className="text-[10px] text-zinc-500 mt-2 max-w-[240px] leading-tight">
                {data.score_disclaimer}
              </p>
            </div>

            <div className="flex flex-col gap-2 w-full sm:w-auto">
              <button
                onClick={handlePracticeWeaknesses}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all"
              >
                <Target className="w-4 h-4" />
                Practice Weak Areas
              </button>
              <button
                onClick={handleDownloadPdf}
                className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold border border-zinc-700 transition-colors"
              >
                <Download className="w-4 h-4" />
                Download PDF Report
              </button>
            </div>
          </div>
        </div>
      </div>

      {error && <ErrorAlert message={error} />}

      {/* SKILL GAP VISUALIZATION & BREAKDOWN */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Radar Chart Card */}
        <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                Competency Radar Profile
              </h2>
              <p className="text-xs text-zinc-400">Multi-dimensional assessment across evaluated skills</p>
            </div>
            <span className="text-xs font-mono text-zinc-500">0–10 Scale</span>
          </div>

          <div className="h-72 w-full flex items-center justify-center pt-2">
            {radarData.length > 2 ? (
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                  <PolarGrid stroke="#27272a" />
                  <PolarAngleAxis dataKey="skill" stroke="#a1a1aa" fontSize={11} />
                  <PolarRadiusAxis angle={30} domain={[0, 10]} stroke="#52525b" fontSize={10} />
                  <Radar
                    name="Candidate Score"
                    dataKey="score"
                    stroke="#8b5cf6"
                    fill="#8b5cf6"
                    fillOpacity={0.4}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#18181b',
                      borderColor: '#3f3f46',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                      fontFamily: 'monospace',
                    }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={radarData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                  <XAxis dataKey="skill" stroke="#a1a1aa" fontSize={11} />
                  <YAxis domain={[0, 10]} stroke="#a1a1aa" fontSize={11} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#3f3f46', fontSize: '12px' }}
                  />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Accessible Text Alternative Table */}
          <div className="sr-only">
            <table>
              <caption>Competency Performance Breakdown</caption>
              <thead>
                <tr><th>Competency</th><th>Score (out of 10)</th></tr>
              </thead>
              <tbody>
                {radarData.map((d) => (
                  <tr key={d.skill}><td>{d.skill}</td><td>{d.score}</td></tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Strengths & Development Areas */}
        <div className="space-y-6">
          {/* Key Strengths */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-3">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              Observed Strengths
            </h2>
            <ul className="space-y-2">
              {data.report?.strengths?.map((str, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-1.5" />
                  <span>{str}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Key Growth Focus */}
          <div className="glass-card p-6 rounded-2xl border border-zinc-800 space-y-3">
            <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              Priority Development Areas
            </h2>
            <ul className="space-y-2">
              {data.report?.key_development_areas?.map((dev, idx) => (
                <li key={idx} className="flex items-start gap-2.5 text-xs text-zinc-300 leading-relaxed">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                  <span>{dev}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* QUESTION-BY-QUESTION BREAKDOWN WITH IMPROVED SAMPLE ANSWERS */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-bold text-zinc-100">Question-by-Question Evaluation</h2>
          <p className="text-xs text-zinc-400 mt-0.5">
            Transparent breakdown of rubric scoring, strengths, gaps, and example improved responses.
          </p>
        </div>

        <div className="space-y-4">
          {data.questions_history?.map((q) => {
            const isExpanded = expandedQuestions[q.number] ?? false;
            const evalObj = q.evaluation;
            const overallQScore = evalObj?.overall_score || 5.0;

            // Find matching improved answer if available
            const imp = data.report?.question_improvements?.find((i) => i.question_number === q.number);

            return (
              <div key={q.number} className="glass-card rounded-2xl border border-zinc-800 overflow-hidden">
                <button
                  onClick={() => toggleQuestion(q.number)}
                  className="w-full p-5 text-left flex items-start sm:items-center justify-between gap-4 hover:bg-zinc-900/40 transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs font-mono">
                      <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-semibold">
                        Q{q.number}
                      </span>
                      <span className="text-brand-400 font-medium">{q.skill}</span>
                      <span className="text-zinc-500">• Difficulty {q.difficulty}/5</span>
                    </div>
                    <p className="text-sm font-semibold text-zinc-100 line-clamp-1">{q.question}</p>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold font-mono text-zinc-100">
                        {overallQScore.toFixed(1)} / 10.0
                      </div>
                      <span className="text-[10px] text-zinc-500 font-mono">Rubric Score</span>
                    </div>
                    {isExpanded ? <ChevronUp className="w-4 h-4 text-zinc-400" /> : <ChevronDown className="w-4 h-4 text-zinc-400" />}
                  </div>
                </button>

                {isExpanded && (
                  <div className="px-5 pb-6 pt-2 border-t border-zinc-800/80 space-y-5 text-xs">
                    {/* Candidate Answer */}
                    <div className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800">
                      <h4 className="text-[11px] font-mono uppercase tracking-wider text-zinc-400 font-semibold mb-1.5">
                        Your Submitted Response
                      </h4>
                      <p className="text-zinc-200 leading-relaxed font-normal">
                        {q.candidate_answer || 'No answer recorded.'}
                      </p>
                    </div>

                    {/* Rubric Breakdown Grid */}
                    {evalObj && (
                      <div className="grid grid-cols-2 sm:grid-cols-5 gap-2 text-center font-mono">
                        <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800">
                          <span className="text-zinc-500 text-[10px] block">Accuracy</span>
                          <span className="font-bold text-zinc-200">{evalObj.technical_accuracy ?? '—'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800">
                          <span className="text-zinc-500 text-[10px] block">Relevance</span>
                          <span className="font-bold text-zinc-200">{evalObj.relevance ?? '—'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800">
                          <span className="text-zinc-500 text-[10px] block">Completeness</span>
                          <span className="font-bold text-zinc-200">{evalObj.completeness ?? '—'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800">
                          <span className="text-zinc-500 text-[10px] block">Clarity</span>
                          <span className="font-bold text-zinc-200">{evalObj.communication ?? '—'}</span>
                        </div>
                        <div className="p-2.5 rounded-lg bg-zinc-900/40 border border-zinc-800 col-span-2 sm:col-span-1">
                          <span className="text-zinc-500 text-[10px] block">Reasoning</span>
                          <span className="font-bold text-zinc-200">{evalObj.problem_solving ?? '—'}</span>
                        </div>
                      </div>
                    )}

                    {/* Missing Concepts Callout */}
                    {evalObj?.missing_concepts && evalObj.missing_concepts.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-500/20 text-amber-300">
                        <span className="font-semibold block mb-1">Concepts missed or unaddressed:</span>
                        <span className="text-amber-200/90">{evalObj.missing_concepts.join(' • ')}</span>
                      </div>
                    )}

                    {/* Example Improved Answer (Preserving candidate reasoning, labeled correctly) */}
                    {imp && (
                      <div className="p-4 rounded-xl bg-brand-950/20 border border-brand-500/30 space-y-2">
                        <div className="flex items-center gap-1.5 text-brand-300 font-semibold text-xs">
                          <Lightbulb className="w-4 h-4 text-brand-400" />
                          <span>Example Improved Answer</span>
                          <span className="text-[10px] text-zinc-500 font-normal">
                            (Illustrative coaching response, not the only valid answer)
                          </span>
                        </div>
                        <p className="text-zinc-200 leading-relaxed font-normal">
                          {imp.example_improved_answer}
                        </p>
                        {imp.coaching_tip && (
                          <p className="text-[11px] text-brand-300 font-mono pt-1">
                            Coaching Tip: {imp.coaching_tip}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* 7-DAY PERSONALIZED IMPROVEMENT PLAN */}
      <div className="glass-card p-6 sm:p-8 rounded-3xl border border-zinc-800 space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono text-brand-400 uppercase tracking-wider mb-1">
            <Calendar className="w-4 h-4" />
            <span>Targeted Curriculum</span>
          </div>
          <h2 className="text-2xl font-bold text-zinc-100">7-Day Personalized Improvement Plan</h2>
          <p className="text-xs text-zinc-400 mt-1">
            Structured roadmap calibrated strictly from your interview gaps and evaluated rubric weaknesses.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 pt-2">
          {data.report?.personalized_improvement_plan?.seven_day_schedule?.map((item) => (
            <div
              key={item.day}
              className="p-4 rounded-xl bg-zinc-900/60 border border-zinc-800 space-y-2 hover:border-brand-500/30 transition-colors"
            >
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 font-bold">
                  Day {item.day}
                </span>
                <span className="text-zinc-500 text-[11px]">Recommended</span>
              </div>
              <h3 className="font-semibold text-xs text-zinc-100 line-clamp-1">{item.topic}</h3>
              <p className="text-[11px] text-zinc-400 leading-snug">{item.task}</p>
            </div>
          ))}
        </div>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-900">
          <div className="flex items-center gap-2 text-xs text-zinc-400">
            <BookOpen className="w-4 h-4 text-brand-400" />
            <span>Focus for Next Session: {data.report?.personalized_improvement_plan?.next_mock_focus || 'Target Weak Competencies'}</span>
          </div>

          <button
            onClick={handlePracticeWeaknesses}
            className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs shadow-lg shadow-brand-500/20 transition-all"
          >
            <Target className="w-4 h-4" />
            Launch Practice Session for Weak Areas
          </button>
        </div>
      </div>
    </div>
  );
};
