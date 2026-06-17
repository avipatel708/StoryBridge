import React from 'react';
import { Logo } from '@/components/ui/Logo';

type AuthPageLayoutProps = {
  children: React.ReactNode;
};

/** Auth screens — soft gradient background, no grid lines */
export function AuthPageLayout({ children }: AuthPageLayoutProps) {
  return (
    <div className="min-h-screen relative flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans overflow-hidden bg-gradient-to-br from-slate-50 via-white to-indigo-50/40 dark:from-[#0B0F19] dark:via-[#0d1220] dark:to-[#151c2e] transition-colors duration-300">
      <div className="pointer-events-none absolute -top-32 -left-24 h-[420px] w-[420px] rounded-full bg-indigo-400/15 dark:bg-indigo-600/10 blur-[100px]" />
      <div className="pointer-events-none absolute -bottom-24 -right-16 h-[380px] w-[380px] rounded-full bg-purple-400/12 dark:bg-purple-600/10 blur-[90px]" />
      <div className="pointer-events-none absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[300px] w-[300px] rounded-full bg-pink-400/8 dark:bg-pink-600/5 blur-[80px]" />

      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center flex flex-col items-center gap-4 mb-6 relative z-10">
        <Logo size="lg" />
      </div>

      <div className="mt-2 sm:mx-auto sm:w-full sm:max-w-md relative z-10 px-4 sm:px-0">
        {children}
      </div>
    </div>
  );
}
