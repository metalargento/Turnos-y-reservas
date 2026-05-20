import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from '../contexts/AuthContext';
import { BusinessProvider } from '../contexts/BusinessContext';
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
  BookingsPage,
  AvailabilityPage,
  PublicBookingPage,
  PublicCancelPage,
  ClientBookingsPage,
} from '../pages';

export function AppRoutes() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/book/:slug" element={<PublicBookingPage />} />
          <Route path="/cancel/:slug" element={<PublicCancelPage />} />
          <Route path="/mis-reservas/:slug" element={<ClientBookingsPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <BusinessProvider>
                  <Layout />
                </BusinessProvider>
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="dashboard" element={<DashboardPage />} />
            <Route path="services" element={<ServicesPage />} />
            <Route path="branches" element={<BranchesPage />} />
            <Route path="professionals" element={<ProfessionalsPage />} />
            <Route path="bookings" element={<BookingsPage />} />
            <Route path="settings" element={<SettingsPage />} />
            <Route path="availability" element={<AvailabilityPage />} />
          </Route>

          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
