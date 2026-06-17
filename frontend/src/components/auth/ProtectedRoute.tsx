import React from 'react';
import { Navigate, useLocation } from 'react-router';
import { useAuthStore } from '@/stores/authStore';
import { Spinner } from '@/components/ui/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { session, isLoading, isOnboarded } = useAuthStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex flex-col items-center justify-center font-sans">
        <Spinner size="lg" variant="primary" />
        <span className="text-sm font-semibold text-slate-400 mt-4 animate-pulse">
          Loading StoryBridge...
        </span>
      </div>
    );
  }

  // Redirect to login if no active session is found
  if (!session) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Redirect to onboarding page if user has not completed onboarding
  // Allow rendering the onboarding page itself (handled in Route mapping)
  if (!isOnboarded && location.pathname !== '/onboarding') {
    return <Navigate to="/onboarding" replace />;
  }

  // Allow entering dashboard if already onboarded or on onboarding page itself
  if (isOnboarded && location.pathname === '/onboarding') {
    return <Navigate to="/feed" replace />;
  }

  return <>{children}</>;
}
