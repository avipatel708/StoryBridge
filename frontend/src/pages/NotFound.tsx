import React from 'react';
import { useNavigate } from 'react-router';
import { Compass } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

interface NotFoundProps {
  /** When true, renders inside MainLayout instead of full screen */
  embedded?: boolean;
}

export default function NotFound({ embedded = false }: NotFoundProps) {
  const navigate = useNavigate();

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center p-6 text-center select-none font-outfit',
        embedded ? 'py-16 min-h-[50vh]' : 'min-h-screen bg-[#0B0F19]'
      )}
    >
      <div className="w-full max-w-md p-8 rounded-2xl bg-[#1E293B]/40 border border-slate-800 backdrop-blur-md shadow-2xl flex flex-col items-center">
        <div className="h-16 w-16 bg-indigo-500/10 rounded-2xl flex items-center justify-center text-indigo-400 mb-6 border border-indigo-500/20">
          <Compass className="h-8 w-8" />
        </div>

        <p className="text-5xl font-extrabold text-indigo-400 mb-2">404</p>

        <h1 className="text-2xl font-extrabold text-[#F8FAFC] mb-3">
          Page Not Found
        </h1>

        <p className="text-slate-400 mb-6 text-sm leading-relaxed max-w-sm">
          The page you are trying to access does not exist, has been removed, or is
          temporarily unavailable.
        </p>

        <Button
          onClick={() => navigate('/feed', { replace: true })}
          variant="primary"
          size="md"
          className="w-full font-bold"
        >
          Go back home
        </Button>
      </div>
    </div>
  );
}
