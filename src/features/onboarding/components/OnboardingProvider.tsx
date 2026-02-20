import React from 'react';
import { OnboardingContext, useOnboardingProvider } from '../hooks/useOnboarding';

interface OnboardingProviderProps {
  children: React.ReactNode;
}

export function OnboardingProvider({ children }: OnboardingProviderProps) {
  const onboardingValue = useOnboardingProvider();

  return (
    <OnboardingContext.Provider value={onboardingValue}>
      {children}
    </OnboardingContext.Provider>
  );
}
