

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useState, Suspense, lazy } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { AppActionsProvider } from '@/hooks/useAppActions';
import { MainLayout } from '@/components/layout';
import { ROUTES } from '@/lib/constants';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import type { ViewMode } from '@/types';





const LoginPage = lazy(() => import('@/pages/Login'));
const SignupPage = lazy(() => import('@/pages/Signup'));
const DashboardPage = lazy(() => import('@/pages/Dashboard'));
const SharedPage = lazy(() => import('@/pages/Shared'));
const StarredPage = lazy(() => import('@/pages/Starred'));
const RecentPage = lazy(() => import('@/pages/Recent'));
const TrashPage = lazy(() => import('@/pages/Trash'));
const FolderPage = lazy(() => import('@/pages/Folder'));
const PublicLinkPage = lazy(() => import('@/pages/PublicLink'));
const ProfilePage = lazy(() => import('@/pages/Profile'));
const ActivityPage = lazy(() => import('@/pages/Activity'));
const ResetPasswordPage = lazy(() => import('@/pages/ResetPassword'));
const ForgotPasswordPage = lazy(() => import('@/pages/ForgotPassword'));

// Import Contexts
import { ViewModeProvider } from '@/context/ViewModeContext';
import { UploadProvider } from '@/context/UploadContext';
import { UploadProgressWidget } from '@/components/features/UploadProgressWidget';

function PageLoader() {
  return (
    <div className="flex items-center justify-center h-screen bg-[var(--color-background)]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-4 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
        <p className="text-[var(--color-text-secondary)]">Loading...</p>
      </div>
    </div>
  );
}

interface ProtectedRouteProps {
  children: React.ReactNode;
}

function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (!isAuthenticated) {
    return <Navigate to={ROUTES.login} replace />;
  }

  // ViewMode info is now inside MainLayout via Context, so we just wrap content
  return (
    <MainLayout>
      {children}
    </MainLayout>
  );
}

interface PublicRouteProps {
  children: React.ReactNode;
}

function PublicRoute({ children }: PublicRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isAuthenticated) {
    return <Navigate to={ROUTES.dashboard} replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <ErrorBoundary>
      <ViewModeProvider>
        <UploadProvider>
          <AppActionsProvider>
            <BrowserRouter>
              <Suspense fallback={<PageLoader />}>
                <Routes>
                  {/* Public Routes */}
                  <Route
                    path={ROUTES.login}
                    element={
                      <PublicRoute>
                        <LoginPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path={ROUTES.signup}
                    element={
                      <PublicRoute>
                        <SignupPage />
                      </PublicRoute>
                    }
                  />
                  <Route
                    path={ROUTES.forgotPassword}
                    element={
                      <PublicRoute>
                        <ForgotPasswordPage />
                      </PublicRoute>
                    }
                  />

                  {/* Shared Public Route */}
                  <Route path="/s/:token" element={<PublicLinkPage />} />

                  {/* Protected Routes */}
                  <Route
                    path={ROUTES.dashboard}
                    element={
                      <ProtectedRoute>
                        <DashboardPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/folder/:id"
                    element={
                      <ProtectedRoute>
                        <FolderPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.shared}
                    element={
                      <ProtectedRoute>
                        <SharedPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.starred}
                    element={
                      <ProtectedRoute>
                        <StarredPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.recent}
                    element={
                      <ProtectedRoute>
                        <RecentPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.trash}
                    element={
                      <ProtectedRoute>
                        <TrashPage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.settings}
                    element={
                      <ProtectedRoute>
                        <ProfilePage />
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path={ROUTES.activity}
                    element={
                      <ProtectedRoute>
                        <ActivityPage />
                      </ProtectedRoute>
                    }
                  />

                  {/* Reset Password */}
                  <Route path="/reset-password" element={<ResetPasswordPage />} />

                  {/* Fallback */}
                  <Route path="*" element={<Navigate to={ROUTES.dashboard} replace />} />
                </Routes>
              </Suspense>
              {/* Global Widgets */}
              <UploadProgressWidget />
            </BrowserRouter>
          </AppActionsProvider>
        </UploadProvider>
      </ViewModeProvider>
    </ErrorBoundary>
  );
}

export default App;
