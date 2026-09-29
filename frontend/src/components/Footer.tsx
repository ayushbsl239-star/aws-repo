import React from 'react';
import { Link } from 'react-router-dom';
import { Cpu, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-zinc-900 bg-zinc-950 text-zinc-400 text-xs py-10 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          <div className="md:col-span-2 space-y-3">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm text-zinc-100">AI Adaptive Interview Coach</span>
              <span className="px-2 py-0.5 rounded bg-brand-500/10 text-brand-400 border border-brand-500/20 font-mono text-[10px]">
                AWS Innovation Challenge 2026
              </span>
            </div>
            <p className="text-zinc-400 leading-relaxed max-w-md">
              A dynamic, generative interview training platform powered by Amazon Bedrock, AgentCore orchestration,
              Amazon Transcribe, Amazon Polly, and DynamoDB. Every response changes future interview difficulty and competency focus.
            </p>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-3 uppercase tracking-wider text-[11px]">AWS Stack</h4>
            <ul className="space-y-1.5 text-zinc-400">
              <li>Amazon Bedrock Runtime (Converse)</li>
              <li>Amazon Bedrock AgentCore</li>
              <li>Amazon DynamoDB Single-Table</li>
              <li>Amazon Transcribe & Polly</li>
              <li>AWS Lambda & API Gateway</li>
              <li>Amazon Cognito & S3</li>
            </ul>
          </div>

          <div>
            <h4 className="font-semibold text-zinc-200 mb-3 uppercase tracking-wider text-[11px]">Resources</h4>
            <ul className="space-y-1.5">
              <li>
                <Link to="/architecture" className="hover:text-brand-400 transition-colors flex items-center gap-1.5">
                  <Cpu className="w-3.5 h-3.5" />
                  System Architecture
                </Link>
              </li>
              <li>
                <span className="flex items-center gap-1.5 text-zinc-400">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                  Least-Privilege IAM & Guardrails
                </span>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-6 border-t border-zinc-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-zinc-400">
          <p>© 2026 AI Adaptive Interview Coach. Built for AWS Innovation Challenge 2026.</p>
          <p className="flex items-center gap-1">
            Engineered with <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" /> and Serverless Cloud Architecture
          </p>
        </div>
      </div>
    </footer>
  );
};
