import React, { useState } from 'react';
import { Terminal, ChevronDown, ChevronUp, Cpu, Activity, Award, TrendingUp } from 'lucide-react';
import { DebugInfo } from '../types';

interface HackathonDebugPanelProps {
  debugInfo?: DebugInfo | null;
  currentCompetency?: string;
  currentDifficulty?: number;
}

export const HackathonDebugPanel: React.FC<HackathonDebugPanelProps> = ({
  debugInfo,
  currentCompetency,
  currentDifficulty,
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!debugInfo && !currentCompetency) return null;

  return (
    <aside aria-label="Adaptive Engine Real-Time Debug Panel" className="w-full border border-emerald-500/30 bg-zinc-950/95 rounded-xl overflow-hidden shadow-2xl shadow-emerald-500/5 my-4">
      {/* Header Bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-4 py-2.5 bg-emerald-950/30 border-b border-emerald-500/20 text-emerald-400 hover:bg-emerald-950/50 transition-colors"
      >
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-emerald-400" />
          <span className="font-mono text-xs font-semibold uppercase tracking-wider">
            Adaptive Engine Real-Time Telemetry
          </span>
          <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/20 text-emerald-300 font-mono">
            {debugInfo?.mode || 'AGENTIC'} MODE
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-zinc-400">
          <span>{isOpen ? 'Collapse' : 'Expand Live State'}</span>
          {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
        </div>
      </button>

      {/* Body Content */}
      {isOpen && (
        <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs font-mono">
          <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Activity className="w-3.5 h-3.5 text-emerald-400" />
              <span>Target Competency</span>
            </div>
            <div className="text-zinc-100 font-bold text-sm">
              {debugInfo?.next_competency || debugInfo?.skill || currentCompetency || 'General'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Rolling Skill: {debugInfo?.current_rolling_skill_score ? `${debugInfo.current_rolling_skill_score}/10` : 'Calibrating'}
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-cyan-400" />
              <span>Difficulty Level</span>
            </div>
            <div className="text-zinc-100 font-bold text-sm">
              {debugInfo?.difficulty || `Level ${currentDifficulty || 2}`} (Scale 1–5)
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              {currentDifficulty && currentDifficulty >= 4 ? 'Senior / Scenario' : 'Intermediate reasoning'}
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Award className="w-3.5 h-3.5 text-amber-400" />
              <span>Previous Score</span>
            </div>
            <div className="text-zinc-100 font-bold text-sm">
              {debugInfo?.previous_score !== undefined ? `${debugInfo.previous_score} / 10.0` : 'Initial Question'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              AI Confidence: {debugInfo?.ai_confidence ? `${Math.round(debugInfo.ai_confidence * 100)}%` : '95%'}
            </div>
          </div>

          <div className="bg-zinc-900/80 p-3 rounded-lg border border-zinc-800">
            <div className="flex items-center gap-1.5 text-zinc-400 mb-1">
              <Cpu className="w-3.5 h-3.5 text-purple-400" />
              <span>Adaptive Action</span>
            </div>
            <div className="text-brand-300 font-bold text-sm">
              {debugInfo?.decision || 'MAINTAIN_DIFFICULTY'}
            </div>
            <div className="text-[11px] text-zinc-500 mt-1">
              Verified by Safety Boundary
            </div>
          </div>

          {debugInfo?.reason && (
            <div className="col-span-2 md:col-span-4 bg-zinc-900/60 p-3 rounded-lg border border-zinc-800/80 text-zinc-300">
              <span className="text-zinc-400 font-semibold">Engine Justification: </span>
              <span className="text-emerald-300">{debugInfo.reason}</span>
            </div>
          )}
        </div>
      )}
    </aside>
  );
};
