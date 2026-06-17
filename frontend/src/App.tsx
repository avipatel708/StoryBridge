import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'sonner';

// Providers
import { QueryProvider } from '@/app/providers/QueryProvider';
import { AuthProvider } from '@/app/providers/AuthProvider';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

// Layout
import { MainLayout } from '@/components/layout/MainLayout';

// Stores
import { useUIStore } from '@/stores/uiStore';
import { useAuthStore } from '@/stores/authStore';

// Pages
import Landing from '@/pages/Landing';
import Login from '@/pages/Login';
import SignUp from '@/pages/SignUp';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Onboarding from '@/pages/Onboarding';
import Feed from '@/pages/Feed';
import Profile from '@/pages/Profile';
import Explore from '@/pages/Explore';
import Notifications from '@/pages/Notifications';
import Messages from '@/pages/Messages';
import SavedPosts from '@/pages/SavedPosts';
import Settings from '@/pages/Settings';
import NotFound from '@/pages/NotFound';
import Capsules from '@/pages/Capsules';
import CapsuleDetail from '@/pages/CapsuleDetail';
import Communities from '@/pages/Communities';
import CommunityDetail from '@/pages/CommunityDetail';
import FriendshipJourney from '@/pages/FriendshipJourney';
import YearWrapped from '@/pages/YearWrapped';
import Reels from '@/pages/Reels';
import PostDetail from '@/pages/PostDetail';
import CreatePage from '@/pages/CreatePage';

import { Spinner } from '@/components/ui/Spinner';

function AuthenticatedRedirect() {
  const { session, isLoading, isOnboarded } = useAuthStore();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0B0F19] flex items-center justify-center">
        <Spinner size="lg" variant="primary" />
      </div>
    );
  }

  if (session && isOnboarded) {
    return <Navigate to="/feed" replace />;
  }

  if (session && !isOnboarded) {
    return <Navigate to="/onboarding" replace />;
  }

  return <Landing />;
}

export default function App() {
  const { theme } = useUIStore();

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  return (
    <HelmetProvider>
      <QueryProvider>
        <AuthProvider>
          <BrowserRouter>
            <ErrorBoundary title="StoryBridge ran into a problem">
            <Routes>
              {/* Public Routes */}
              <Route path="/" element={<AuthenticatedRedirect />} />
              <Route path="/login" element={<Login />} />
              <Route path="/signup" element={<SignUp />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset-password" element={<ResetPassword />} />

              {/* Onboarding Route (Requires auth, but not onboarded yet) */}
              <Route
                path="/onboarding"
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                }
              />

              {/* Dashboard Layout Protected Routes */}
              <Route
                element={
                  <ProtectedRoute>
                    <MainLayout />
                  </ProtectedRoute>
                }
              >
                <Route path="feed" element={<Feed />} />
                <Route path="profile/:username" element={<Profile />} />
                <Route path="@::username" element={<Profile />} />
                <Route path="explore" element={<Explore />} />
                <Route path="notifications" element={<Notifications />} />
                <Route path="messages" element={<Messages />} />
                <Route path="saved" element={<SavedPosts />} />
                <Route path="settings" element={<Settings />} />
                <Route path="capsules" element={<Capsules />} />
                <Route path="capsules/:id" element={<CapsuleDetail />} />
                <Route path="communities" element={<Communities />} />
                <Route path="communities/:slug" element={<CommunityDetail />} />
                <Route path="friendship/:userId" element={<FriendshipJourney />} />
                <Route path="reels" element={<Reels />} />
                <Route path="post/:id" element={<PostDetail />} />
                <Route path="create" element={<CreatePage />} />
                <Route path="create/post" element={<CreatePage />} />
                <Route path="create/story" element={<CreatePage />} />
                <Route path="posts/new" element={<CreatePage />} />
                <Route path="stories/new" element={<CreatePage />} />
                <Route path="*" element={<NotFound embedded />} />
              </Route>

              {/* Immersive standalone protected routes */}
              <Route
                path="wrapped"
                element={
                  <ProtectedRoute>
                    <YearWrapped />
                  </ProtectedRoute>
                }
              />

              {/* Global 404 for unknown top-level paths */}
              <Route path="*" element={<NotFound />} />
            </Routes>
            </ErrorBoundary>
          </BrowserRouter>
          
          {/* Universal Toast Notifications */}
          <Toaster
            position="top-right"
            theme={theme}
            toastOptions={{
              className: theme === 'dark' 
                ? 'bg-slate-900 border border-slate-800 text-slate-200 rounded-xl font-sans' 
                : 'bg-white border border-slate-200 text-slate-800 rounded-xl font-sans shadow-lg shadow-slate-100/50',
            }}
          />
        </AuthProvider>
      </QueryProvider>
    </HelmetProvider>
  );
}
