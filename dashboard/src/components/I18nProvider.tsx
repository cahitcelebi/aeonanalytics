'use client';

import React from 'react';

interface I18nProviderProps {
  children: React.ReactNode;
}

export default function I18nProvider({ children }: I18nProviderProps) {
  // Just a placeholder component that returns children directly
  return <>{children}</>;
} 