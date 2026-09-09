import React from 'react';
import { GraduationCap, Sparkles } from 'lucide-react';

interface PreloaderProps {
  message?: string;
  subMessage?: string;
  fullScreen?: boolean;
}

export const Preloader: React.FC<PreloaderProps> = ({
  message = 'Loading your learning space...',
  subMessage = 'Personalizing your AI study tools',
  fullScreen = true,
}) => {
  const content = (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-sm w-full animate-in fade-in zoom-in-95 duration-300">
      {/* Animated Academic Logo */}
      <div className="relative mb-6">
        <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20 animate-bounce">
          <GraduationCap className="w-9 h-9" />
        </div>
        <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-amber-400 border-2 border-white flex items-center justify-center text-slate-900 shadow-sm animate-pulse">
          <Sparkles className="w-3.5 h-3.5 fill-slate-900" />
        </div>
      </div>

      {/* Brand Title */}
      <div className="mb-4">
        <h2 className="text-xl font-bold text-slate-900 tracking-tight">
          EduMentor <span className="text-blue-600">AI</span>
        </h2>
        <p className="text-xs font-semibold text-slate-700 mt-1">{message}</p>
        {subMessage && (
          <p className="text-[11px] text-slate-400 mt-0.5">{subMessage}</p>
        )}
      </div>

      {/* Elegant Progress Bar */}
      <div className="w-48 h-1.5 bg-slate-200 rounded-full overflow-hidden">
        <div className="h-full bg-blue-600 rounded-full animate-pulse w-2/3 mx-auto" />
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-50 flex items-center justify-center">
        {content}
      </div>
    );
  }

  return (
    <div className="min-h-[300px] flex items-center justify-center w-full">
      {content}
    </div>
  );
};
