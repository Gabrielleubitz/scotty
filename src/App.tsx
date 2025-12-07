import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './hooks/useAuth';
import { useTeam } from './hooks/useTeam';
import { HomePage } from './pages/HomePage';
import { AdminLayout } from './components/AdminLayout';
import { AdminDashboard } from './components/AdminDashboard';
import { CreatePostPage } from './pages/CreatePostPage';
import { EditPostPage } from './pages/EditPostPage';
import { SettingsPage } from './pages/SettingsPage';
import { GodAdminPage } from './pages/GodAdminPage';

function App() {
  const { user, loading: authLoading } = useAuth();
  const { currentTeam, loading: teamLoading } = useTeam();

  // Show loading state while auth or team is loading
  if (authLoading || teamLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-sm text-gray-600 font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<HomePage />} />

        {/* Protected admin routes */}
        <Route
          path="/admin"
          element={
            (user?.role === 'admin' || user?.role === 'god') ? (
              <AdminLayout>
                <AdminDashboard />
              </AdminLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/posts/new"
          element={
            (user?.role === 'admin' || user?.role === 'god') ? (
              <AdminLayout>
                <CreatePostPage />
              </AdminLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/posts/:id/edit"
          element={
            (user?.role === 'admin' || user?.role === 'god') ? (
              <AdminLayout>
                <EditPostPage />
              </AdminLayout>
            ) : (
              <Navigate to="/" replace />
            )
          }
        />
        <Route
          path="/admin/god"
          element={
            user?.role === 'god' ? (
              <AdminLayout>
                <GodAdminPage />
              </AdminLayout>
            ) : (
              <Navigate to="/admin" replace />
            )
          }
        />

        {/* Settings route */}
        <Route
          path="/settings"
          element={
            user ? (
              <SettingsPage />
            ) : (
              <Navigate to="/" replace />
            )
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
