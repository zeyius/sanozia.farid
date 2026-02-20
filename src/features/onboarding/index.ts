// Public API for onboarding feature
export { OnboardingProvider } from './components/OnboardingProvider';
export { useOnboarding } from './hooks/useOnboarding';
export { onboardingService, type QuestionnaireResponse, type SignatureResult } from './services/onboardingService';
export { OnboardingPage } from './pages/OnboardingPage';
export type { OnboardingData, OnboardingStep } from './types';
