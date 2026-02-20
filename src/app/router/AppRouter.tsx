import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from '../../shared/components/ProtectedRoute';
import { OnboardingProvider } from '../../features/onboarding';

// Pages d'authentification
import { SignIn, SignUp, ForgotPassword } from '../../features/auth';

// Pages protégées
import { OnboardingPage } from '../../features/onboarding';
import { DashboardPage } from '../../features/dashboard';
import { ConsumptionPage } from '../../features/consumption';
import { StoolPage } from '../../features/stool';
import { SymptomPage } from '../../features/symptom-tracking';
import { HistoryPage } from '../../features/history';
import { ProfilePage } from '../../features/profile';

/**
 * Configuration centralisée de toutes les routes de l'application
 * Sépare les routes publiques des routes protégées pour une meilleure lisibilité
 */
export function AppRouter() {
  return (
    <Routes>
      {/* Routes publiques - Authentification */}
      <Route path="/auth/signin" element={<SignIn />} />
      <Route path="/auth/signup" element={<SignUp />} />
      <Route path="/auth/forgot-password" element={<ForgotPassword />} />
      
      {/* Routes protégées - Application principale */}
      <Route 
        path="/onboarding" 
        element={
          <ProtectedRoute>
            <OnboardingProvider>
              <OnboardingPage />
            </OnboardingProvider>
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/meal" 
        element={
          <ProtectedRoute>
            <ConsumptionPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/stool" 
        element={
          <ProtectedRoute>
            <StoolPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/symptom" 
        element={
          <ProtectedRoute>
            <SymptomPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/history" 
        element={
          <ProtectedRoute>
            <HistoryPage />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/profile" 
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        } 
      />

      {/* Redirections par défaut */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
