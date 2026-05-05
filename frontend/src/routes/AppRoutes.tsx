import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { ProtectedRoute } from './ProtectedRoute';
import { Layout } from '../components/layout';
import {
  LoginPage,
  RegisterPage,
  OnboardingPage,
  DashboardPage,
  NotFoundPage,
  ServicesPage,
  BranchesPage,
  SettingsPage,
  ProfessionalsPage,
} from '../pages';

export function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="professionals" element={<ProfessionalsPage />} />
            <Route path="settings" element={<SettingsPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
