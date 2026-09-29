import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Cpu,
  Mic,
  FileText,
  TrendingUp,
  Brain,
  ShieldCheck,
  CheckCircle2,
  Terminal,
  Layers,
  ChevronRight,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="flex flex-col min-h-screen">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden pt-20 pb-24 md:pt-32 md:pb-36 border-b border-zinc-900">
        {/* Subtle grid background */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#18181b15_1px,transparent_1px),linear-gradient(to_bottom,#18181b15_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] pointer-events-none" />

        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-zinc-900/90 border border-zinc-800 text-xs font-mono text-zinc-300 mb-8 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse" />
            <span>AWS Innovation Challenge 2026</span>
            <span className="text-zinc-600">|</span>
            <span className="text-brand-400">Generative AI & Agentic Cloud</span>
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-extrabold text-zinc-100 tracking-tight leading-[1.1] mb-6">
            An interview that <br />
            <span className="bg-gradient-to-r from-brand-400 via-indigo-300 to-cyan-400 bg-clip-text text-transparent">
              adapts to you.
            </span>
          </h1>

          <p className="text-lg sm:text-xl text-zinc-400 max-w-2xl mx-auto mb-10 leading-relaxed font-normal">
            Practice realistic interviews that analyse every answer, identify your skill gaps, and dynamically decide what you should be asked next.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              to="/signup"
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-xl shadow-brand-500/20 hover:shadow-brand-500/30 transition-all duration-200"
            >
              Start Practising
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/login"
              className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-200 font-semibold text-sm border border-zinc-800 transition-colors"
            >
              Log In
            </Link>
          </div>

          {/* Core Central Loop Pill */}
          <div className="mt-14 inline-flex flex-wrap items-center justify-center gap-2 sm:gap-3 px-4 py-2.5 rounded-2xl bg-zinc-900/60 border border-zinc-800/80 text-[11px] sm:text-xs font-mono text-zinc-400 shadow-inner">
            <span className="text-zinc-200 font-semibold">THE ADAPTIVE LOOP:</span>
            <span>ASK</span>
            <span className="text-brand-500">→</span>
            <span>ANSWER</span>
            <span className="text-brand-500">→</span>
            <span>ANALYSE</span>
            <span className="text-brand-500">→</span>
            <span>SCORE</span>
            <span className="text-brand-500">→</span>
            <span>UPDATE PROFILE</span>
            <span className="text-brand-500">→</span>
            <span className="text-brand-300">ADAPT DIFFICULTY</span>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-20 border-b border-zinc-900 bg-zinc-950/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-wider text-brand-400 font-semibold mb-2">Workflow</h2>
            <h3 className="text-3xl font-bold text-zinc-100">How the Adaptive Coach Operates</h3>
            <p className="text-sm text-zinc-400 mt-3">
              Unlike static mock question banks, our platform listens to your answer content and dynamically tailors subsequent questions.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center font-mono font-bold text-sm">
                01
              </div>
              <h4 className="text-lg font-semibold text-zinc-100">Tailored Setup</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Choose from 8+ roles, target seniority, paste a job description, or upload your resume. Bedrock maps required technical and behavioural competencies.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center font-mono font-bold text-sm">
                02
              </div>
              <h4 className="text-lg font-semibold text-zinc-100">Real-Time Evaluation</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Answer via typed text or natural push-to-talk voice. Amazon Bedrock scores technical accuracy, relevance, completeness, clarity, and reasoning against weighted rubrics.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 space-y-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center font-mono font-bold text-sm">
                03
              </div>
              <h4 className="text-lg font-semibold text-zinc-100">Adaptive Decisions</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                A strong response escalates difficulty. An incomplete claim triggers an intelligent follow-up probe. A gap downshifts challenge to diagnose fundamentals.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CORE FEATURES GRID */}
      <section className="py-20 border-b border-zinc-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-xs font-mono uppercase tracking-wider text-brand-400 font-semibold mb-2">Capabilities</h2>
            <h3 className="text-3xl font-bold text-zinc-100">Designed for Serious Job Readiness</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-lg bg-brand-500/10 flex items-center justify-center text-brand-400">
                <Brain className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-100">Deterministic & Agentic AI</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Dual-layer architecture: Bedrock AgentCore autonomous decisions protected by hard mathematical safety boundaries ensuring difficulty and budget constraints.
              </p>
            </div>

            <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-lg bg-cyan-500/10 flex items-center justify-center text-cyan-400">
                <Mic className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-100">Push-to-Talk & Neural Voice</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Amazon Transcribe converts spoken responses with candidate editing preview. Amazon Polly neural speech reads interview questions aloud naturally.
              </p>
            </div>

            <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center text-amber-400">
                <FileText className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-100">Resume & JD Document Parsing</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Secure presigned S3 upload for PDF, DOCX, and TXT. Bedrock extracts candidate project claims without demographic bias to craft targeted interview probes.
              </p>
            </div>

            <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-100">Interview Readiness Score (0-100)</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Objective scoring calculated server-side from 5 weighted rubric dimensions. Transparently framed as readiness against job standards, not hiring speculation.
              </p>
            </div>

            <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-400">
                <Layers className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-100">7-Day Personalized Practice Plan</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Actionable schedule based on identified weaknesses. Includes study concepts, coding drills, and one-click 'Practice Weak Areas' adaptive re-testing.
              </p>
            </div>

            <div className="glass-card glass-card-hover p-6 rounded-2xl space-y-3">
              <div className="w-9 h-9 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <h4 className="text-base font-semibold text-zinc-100">Bedrock Guardrails & Fairness</h4>
              <p className="text-xs text-zinc-400 leading-relaxed">
                Explicit fairness boundaries: no demographic evaluation, no voice pitch or appearance heuristics. Rigorous evaluation of content and reasoning only.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ARCHITECTURE HIGHLIGHT */}
      <section className="py-20 border-b border-zinc-900 bg-zinc-950/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="p-8 md:p-12 rounded-3xl bg-gradient-to-b from-zinc-900 to-zinc-950 border border-zinc-800">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <span className="text-xs font-mono font-semibold uppercase tracking-wider text-brand-400">
                  Cloud Infrastructure
                </span>
                <h3 className="text-2xl sm:text-3xl font-bold text-zinc-100 mt-2 mb-4">
                  Built on 100% Serverless AWS Architecture
                </h3>
                <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed mb-6">
                  Engineered with Amazon Bedrock Converse API, DynamoDB Single-Table Design, Amazon Cognito JWT authentication,
                  Amazon S3 private presigned workflows, and AWS Lambda with structured CloudWatch observability.
                </p>
                <Link
                  to="/architecture"
                  className="inline-flex items-center gap-2 text-xs font-semibold text-brand-400 hover:text-brand-300 font-mono"
                >
                  Explore Interactive AWS Architecture Diagram
                  <ChevronRight className="w-4 h-4" />
                </Link>
              </div>

              <div className="bg-zinc-950/90 rounded-2xl p-5 border border-zinc-800 font-mono text-xs space-y-2 text-zinc-300 shadow-xl">
                <div className="flex items-center gap-2 pb-3 border-b border-zinc-800/80 text-zinc-400">
                  <Terminal className="w-4 h-4 text-emerald-400" />
                  <span>aws-services-runtime.json</span>
                </div>
                <div className="text-zinc-400">// Primary AWS Service Map</div>
                <div><span className="text-cyan-400">"Generative AI"</span>: "Amazon Bedrock (Converse API)",</div>
                <div><span className="text-cyan-400">"Orchestration"</span>: "Bedrock AgentCore + Python Safety Boundary",</div>
                <div><span className="text-cyan-400">"Database"</span>: "Amazon DynamoDB (Pay-Per-Request)",</div>
                <div><span className="text-cyan-400">"Storage"</span>: "Amazon S3 (Presigned URLs)",</div>
                <div><span className="text-cyan-400">"Audio"</span>: "Amazon Transcribe & Amazon Polly",</div>
                <div><span className="text-cyan-400">"Auth"</span>: "Amazon Cognito User Pools (JWT)",</div>
                <div><span className="text-cyan-400">"Compute"</span>: "AWS Lambda Python 3.12"</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="py-20 text-center">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <h2 className="text-3xl font-extrabold text-zinc-100 tracking-tight">
            Ready to experience an interview that adapts in real time?
          </h2>
          <p className="text-sm text-zinc-400 max-w-xl mx-auto">
            Take a 5-minute diagnostic mock interview. Uncover your hidden blind spots and get actionable 7-day preparation recommendations.
          </p>
          <div className="pt-2">
            <Link
              to="/signup"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-semibold text-sm shadow-xl shadow-brand-500/25 transition-all"
            >
              Start Free Adaptive Interview
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
