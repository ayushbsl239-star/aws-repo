import React from 'react';
import {
  Cpu,
  Layers,
  ShieldCheck,
  Database,
  Cloud,
  Mic,
  Volume2,
  FileText,
  Activity,
  ArrowDown,
  Terminal,
  Server,
  Lock,
} from 'lucide-react';

export const ArchitecturePage: React.FC = () => {
  const services = [
    {
      name: 'AWS Amplify',
      role: 'Frontend Hosting & CI/CD',
      desc: 'Hosts and deploys the React SPA across AWS global edge content delivery network with automated preview builds.',
      icon: Cloud,
      color: 'text-amber-400',
    },
    {
      name: 'Amazon Cognito',
      role: 'Authentication & JWT Security',
      desc: 'Manages user registration, secure SRP password verification, email confirmation, and signs JWT claims for API Gateway.',
      icon: Lock,
      color: 'text-rose-400',
    },
    {
      name: 'Amazon API Gateway',
      role: 'Secure REST/HTTP Gateway',
      desc: 'Enforces JWT authorizer validation on protected endpoints, configures CORS preflight, and proxies payloads to AWS Lambda.',
      icon: Server,
      color: 'text-indigo-400',
    },
    {
      name: 'AWS Lambda (Python 3.12)',
      role: 'Serverless Application Core',
      desc: 'Coordinates interview state transitions, document parsing, deterministic adaptive calculations, and Bedrock orchestration.',
      icon: Cpu,
      color: 'text-brand-400',
    },
    {
      name: 'Amazon Bedrock Runtime',
      role: 'Generative Intelligence (Converse API)',
      desc: 'Powers dynamic question generation, 5-criteria weighted answer evaluation, follow-up probes, and 7-day curriculum synthesis.',
      icon: Layers,
      color: 'text-purple-400',
    },
    {
      name: 'Bedrock AgentCore & Safety Boundary',
      role: 'Agentic AI Orchestration',
      desc: 'Autonomous pedagogical tool calling bounded by deterministic mathematical guards preventing invalid jumps or budget overflows.',
      icon: ShieldCheck,
      color: 'text-emerald-400',
    },
    {
      name: 'Amazon DynamoDB',
      role: 'Single-Table Persistence',
      desc: 'On-demand Pay-Per-Request table storing user profiles, interview sessions, questions, evaluations, and rolling skill scores.',
      icon: Database,
      color: 'text-cyan-400',
    },
    {
      name: 'Amazon S3',
      role: 'Secure Document & Media Storage',
      desc: 'Private bucket isolating candidate resumes, job descriptions, voice audio, and generated PDF reports via short-lived presigned URLs.',
      icon: FileText,
      color: 'text-amber-300',
    },
    {
      name: 'Amazon Transcribe & Polly',
      role: 'Speech-to-Text & Neural TTS',
      desc: 'Transcribe converts push-to-talk candidate answers; Polly Neural TTS reads interview questions aloud with realistic human cadence.',
      icon: Mic,
      color: 'text-rose-300',
    },
    {
      name: 'Amazon CloudWatch',
      role: 'Observability & Structured Logging',
      desc: 'Captures JSON-formatted telemetry with request latency, Bedrock response times, operation IDs, and sanitizes all PII/secrets.',
      icon: Activity,
      color: 'text-emerald-300',
    },
  ];

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12 animate-fade-in">
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-xs font-mono text-brand-400">
          <Terminal className="w-3.5 h-3.5" />
          <span>AWS INNOVATION CHALLENGE 2026 ARCHITECTURE</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-zinc-100 tracking-tight">
          Cloud Infrastructure & System Topology
        </h1>
        <p className="text-xs sm:text-sm text-zinc-400 leading-relaxed">
          The AI Adaptive Interview Coach is engineered using pure serverless AWS primitives to ensure zero idle cost,
          instant scalability, least-privilege security, and resilient AI evaluation.
        </p>
      </div>

      {/* INTERACTIVE PIPELINE FLOW */}
      <div className="glass-card p-8 rounded-3xl border border-zinc-800 space-y-8 shadow-2xl">
        <h2 className="text-sm font-mono uppercase tracking-wider text-zinc-400 font-semibold text-center">
          End-to-End Execution Sequence
        </h2>

        <div className="flex flex-col items-center space-y-3 text-xs font-mono max-w-xl mx-auto">
          <div className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center font-bold text-zinc-200">
            1. React 18 SPA (Vite + TypeScript + Tailwind CSS)
          </div>
          <ArrowDown className="w-4 h-4 text-brand-400 animate-bounce" />

          <div className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center font-bold text-rose-300">
            2. Amazon Cognito User Pool (JWT Verification & Claims)
          </div>
          <ArrowDown className="w-4 h-4 text-brand-400 animate-bounce" />

          <div className="w-full p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-center font-bold text-indigo-300">
            3. Amazon API Gateway HTTP API (JWT Authorizer & CORS)
          </div>
          <ArrowDown className="w-4 h-4 text-brand-400 animate-bounce" />

          <div className="w-full p-3 rounded-xl bg-zinc-900 border border-brand-500/40 text-center font-bold text-brand-300 shadow-lg shadow-brand-500/10">
            4. AWS Lambda Python 3.12 (Router, Documents & State Coordination)
          </div>
          <ArrowDown className="w-4 h-4 text-brand-400 animate-bounce" />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
            <div className="p-3 rounded-xl bg-purple-950/40 border border-purple-500/30 text-center text-purple-200">
              5a. Bedrock AgentCore
              <span className="block text-[10px] text-purple-400 font-normal mt-0.5">Autonomous action proposal</span>
            </div>
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 text-center text-emerald-200">
              5b. Python Safety Boundary
              <span className="block text-[10px] text-emerald-400 font-normal mt-0.5">Difficulty & budget clamping</span>
            </div>
          </div>
          <ArrowDown className="w-4 h-4 text-brand-400 animate-bounce" />

          <div className="w-full p-3.5 rounded-xl bg-zinc-900 border border-zinc-800 text-center font-bold text-purple-300">
            6. Amazon Bedrock Runtime Converse API
            <span className="block text-[10px] text-zinc-400 font-normal mt-0.5">
              `BEDROCK_MODEL_ID` (Claude 3.5 Sonnet / Nova Pro) + Guardrails
            </span>
          </div>
          <ArrowDown className="w-4 h-4 text-brand-400 animate-bounce" />

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 w-full text-center">
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-cyan-300">
              Amazon DynamoDB
              <span className="block text-[10px] text-zinc-500 font-normal">Single-Table State</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-amber-300">
              Amazon S3
              <span className="block text-[10px] text-zinc-500 font-normal">Private Storage</span>
            </div>
            <div className="p-3 rounded-xl bg-zinc-900/80 border border-zinc-800 text-rose-300">
              Polly & Transcribe
              <span className="block text-[10px] text-zinc-500 font-normal">Neural Audio I/O</span>
            </div>
          </div>
        </div>
      </div>

      {/* SERVICE DICTIONARY CARDS */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-zinc-100">AWS Service Architectural Roles</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((s) => {
            const Icon = s.icon;
            return (
              <div key={s.name} className="glass-card p-5 rounded-2xl border border-zinc-800 space-y-2">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg bg-zinc-900 border border-zinc-800 ${s.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-zinc-100">{s.name}</h3>
                    <p className="text-[11px] font-mono text-brand-400">{s.role}</p>
                  </div>
                </div>
                <p className="text-xs text-zinc-400 leading-relaxed pt-1">{s.desc}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
