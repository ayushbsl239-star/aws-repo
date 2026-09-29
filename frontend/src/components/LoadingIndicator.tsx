import React from 'react';
import { Loader2 } from 'lucide-react';

interface LoadingIndicatorProps {
  message?: string;
  subtext?: string;
}

export const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({
  message = 'Analysing your response...',
  subtext = 'Amazon Bedrock is calculating rubric evaluation and updating candidate profile...',
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center space-y-4 animate-fade-in">
      <div className="relative">
        <div className="w-12 h-12 rounded-full border-2 border-brand-500/20 border-t-brand-500 animate-spin" />
        <Loader2 className="w-6 h-6 text-brand-400 absolute inset-0 m-auto animate-pulse" />
      </div>
      <div>
        <h4 className="text-sm font-semibold text-zinc-100">{message}</h4>
        {subtext && <p className="text-xs text-zinc-400 mt-1 max-w-sm">{subtext}</p>}
      </div>
    </div>
  );
};
