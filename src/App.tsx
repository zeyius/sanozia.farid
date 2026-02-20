import React from 'react';
import { AppProviders, AppLayout } from './app/index';


/**
 * Point d'entrée principal de l'application
 * Utilise l'architecture centralisée dans app/ pour une meilleure organisation
 */

function App() {
  return (
    <AppProviders>
      <AppLayout />
    </AppProviders>
  );
}

export default App;