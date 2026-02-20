# 🛠️ Sanozia  - Guide de Développement

> Documentation technique complète pour les développeurs et l'assistance IA

## 🎯 Vue d'ensemble

Application React TypeScript pour le suivi médical des maladies inflammatoires de l'intestin (IBD/MICI).

**Stack technique**: React 18 + TypeScript + Vite + Tailwind CSS + Supabase + React Router v7

---

## 🏗️ Architecture Feature-Driven

### ✅ Structure modulaire par domaine métier

### ✅ Authentification robuste
- **Service centralisé**: `features/auth/services/authService.ts`
- **Hook global**: `features/auth/hooks/useAuth.ts` 
- **Navigation intelligente**: `shared/components/NavigationController.tsx`
- **Types unifiés**: `AuthUser`, `UserProfile`, `User`

### ✅ Gestion d'erreurs centralisée
- **Service**: `shared/services/errorService.ts` (15+ types d'erreurs)
- **Hook UI**: `shared/hooks/useErrorHandler.ts`
- **Composant**: `shared/components/ErrorDisplay.tsx` (notifications toast)

### ✅ Logging centralisé
- **Logger**: `shared/utils/logger.ts` avec contextes prédéfinis
- **Contextes**: AUTH, NAVIGATION, API, PROFILE, MEAL, STOOL, SYMPTOM, UI
- **Documentation**: JSDoc complète avec exemples d'usage
- **Migration**: 40+ console.log remplacés par le système centralisé

---

## 🔑 Composants et services critiques

https://supabase.com/dashboard/project/dbbaeobzvapfrkfnrbto/database/schemas

### 🔐 Authentification
- **Service**: `authService` - Gestion complète auth Supabase
- **Hook**: `useAuth` - État d'authentification global
- **Types**: `AuthUser`, `UserProfile` (unifiés)

### 🚨 Gestion d'erreurs
- **Service**: `errorService` - Centralisation des erreurs
- **Hook**: `useErrorHandler` - Interface React pour erreurs
- **Composant**: `ErrorDisplay` - Affichage UI des erreurs

### 🧭 Navigation
- **Composant**: `NavigationController` - Logique de redirection centralisée
- **Composant**: `ProtectedRoute` - Protection des routes authentifiées

### 📊 Logging
- **Utilitaire**: `logger` - Système de logging centralisé avec contextes
- **Usage**: `logger.debug(message, data, context)` avec contextes prédéfinis

---

## 💡 Conventions de développement

### 📝 Nommage
- **Composants**: PascalCase (`ProfilePage`, `ErrorDisplay`)
- **Hooks**: camelCase avec préfixe `use` (`useAuth`, `useErrorHandler`)
- **Services**: camelCase avec suffixe `Service` (`authService`, `errorService`)
- **Types**: PascalCase (`AuthUser`, `UserProfile`, `ErrorType`)

### Gestion d'erreurs centralisée
```typescript
try {
  await operation();
} catch (error) {
  errorService.handleError(ErrorType.OPERATION_FAILED, error as Error);
}
```

**Pourquoi** : Évite les console.error éparpillés, centralise l'affichage avec ErrorDisplay.

---

## 🤖 Guide d'assistance IA

### 🔍 Recherche de code
- **Authentification**: Chercher `useAuth`, `authService`, `AuthUser`
- **Erreurs**: Chercher `errorService`, `ErrorType`, `useErrorHandler`
- **Navigation**: Chercher `NavigationController`, `ProtectedRoute`
- **Données**: Chercher `useDashboardData`, services spécifiques
- **Logging**: Chercher `logger`, `loggerContexts`

### 📋 Tâches courantes

#### 1. Ajouter une nouvelle page
```typescript
// 1. Créer dans features/[domain]/pages/
// 2. Ajouter route dans App.tsx
// 3. Utiliser ProtectedRoute si nécessaire
// 4. Implémenter navigation avec NavigationController
```

#### 2. Gérer une erreur
```typescript
// 1. Utiliser errorService.handleError()
// 2. Définir ErrorType approprié
// 3. Afficher avec useErrorHandler + ErrorDisplay
```

#### 3. Ajouter du logging
```typescript
// 1. Importer logger et loggerContexts
// 2. Choisir niveau approprié (debug/info/warn/error)
// 3. Utiliser contexte prédéfini
// 4. Inclure données pertinentes
```

#### 4. Créer un nouveau service
```typescript
// 1. Créer dans features/[domain]/services/
// 2. Suivre pattern singleton
// 3. Gérer erreurs avec errorService
// 4. Ajouter logging approprié
// 5. Exporter types dans features/[domain]/types/
```

### 🎯 Patterns recommandés

#### Service Pattern
```typescript
class ExampleService {
  private static instance: ExampleService;
  
  static getInstance(): ExampleService {
    if (!ExampleService.instance) {
      ExampleService.instance = new ExampleService();
    }
    return ExampleService.instance;
  }
  
  async performOperation(): Promise<Result> {
    try {
      logger.debug('Starting operation', null, loggerContexts.API);
      // ... logic
      logger.info('Operation completed', { result }, loggerContexts.API);
      return result;
    } catch (error) {
      logger.error('Operation failed', error, loggerContexts.API);
      errorService.handleError(ErrorType.OPERATION_FAILED, error as Error);
      throw error;
    }
  }
}

export const exampleService = ExampleService.getInstance();
```

#### Hook Pattern
```typescript
export function useExample() {
  const [state, setState] = useState();
  const { handleError } = useErrorHandler();
  
  const performAction = useCallback(async () => {
    try {
      logger.debug('Hook action started', null, loggerContexts.UI);
      const result = await exampleService.performOperation();
      setState(result);
    } catch (error) {
      handleError(error as Error);
    }
  }, [handleError]);
  
  return { state, performAction };
}
```

---

## 🚀 Scripts de développement

```bash
# Développement
yarn dev              # Serveur de développement (Vite)
yarn build            # Build de production
yarn preview          # Prévisualisation du build
yarn lint             # Vérification ESLint
yarn lint:fix         # Correction automatique ESLint
yarn tsc              # Vérification TypeScript
```

---

## 📦 Configuration

### Variables d'environnement
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Configuration Vite
- Configuration dans `.config/vite.config.ts`
- Alias `@/` pointant vers `src/`
- Support TypeScript complet

### Configuration ESLint
- Configuration dans `.config/eslint.config.js`
- Rules TypeScript strictes
- Support React et hooks

## 📚 Optimisation IA

### 📝 Documentation
- **JSDoc complet** sur services critiques
- **Guide consolidé** dans ce fichier
- **Exemples d'usage** pour chaque pattern

### 🔍 Recherche facilitée
- **Conventions cohérentes** (PascalCase, camelCase)
- **Noms explicites** (`useAuth`, `errorService`, `NavigationController`)
- **Architecture feature-driven** pour navigation intuitive
