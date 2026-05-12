# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

All tooling configs live in `.config/` (non-standard location — always pass the flag):

```bash
yarn dev                  # Vite dev server on port 5173
yarn dev:mobile           # Same with --host for LAN/mobile testing
yarn build                # tsc check + vite build → dist/
yarn lint                 # ESLint
yarn lint:fix             # ESLint with auto-fix
yarn tsc                  # Type-check only (no emit)
yarn validate             # lint + tsc + build (full pre-push check)
```

There is no test runner configured in this project.

## Architecture

Feature-driven structure under `src/features/`. Each domain owns its own `pages/`, `services/`, `types/`, `hooks/`, and `components/`. Shared infrastructure is in `src/shared/`. Routing is in `src/app/router/AppRouter.tsx`.

The 8 feature domains: `auth`, `dashboard`, `consumption`, `stool`, `symptom-tracking`, `history`, `profile`, `onboarding`.

## Key Patterns

**Service singleton** — all services follow this pattern; never instantiate directly:

```typescript
class ExampleService {
  private static instance: ExampleService;
  static getInstance(): ExampleService {
    if (!ExampleService.instance) ExampleService.instance = new ExampleService();
    return ExampleService.instance;
  }
}
export const exampleService = ExampleService.getInstance();
```

**Error handling** — always route through `errorService`, never use bare `console.error`:

```typescript
import { errorService, ErrorType } from '@/shared/services/errorService';
try {
  await operation();
} catch (error) {
  errorService.handleError(ErrorType.OPERATION_FAILED, error as Error);
}
```

`ErrorDisplay` (shared component) renders the toast. `useErrorHandler` (shared hook) connects component state to `errorService`.

**Logging** — use `logger` with a predefined context, not `console.log`:

```typescript
import { logger, loggerContexts } from '@/shared/utils/logger';
logger.debug('message', data, loggerContexts.API);
// Contexts: AUTH, NAVIGATION, API, PROFILE, MEAL, STOOL, SYMPTOM, UI
// Debug/info suppressed in production; warn/error always emitted.
```

## Supabase Edge Functions (Deno)

Functions live in `supabase/functions/`. They run on the Deno runtime, not Node. Each function folder has its own `deno.json` with an `imports` map.

The VS Code TypeScript LS will show false errors (`Deno` not found, `jsr:` imports unresolvable) unless the Deno extension is enabled. Add `.vscode/settings.json`:

```json
{
  "deno.enable": false,
  "deno.enablePaths": ["supabase/functions"]
}
```

When editing function callbacks, annotate the `req` parameter explicitly (`req: Request`) since the type can't be inferred without the Deno LSP active.

## Environment Variables

```env
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Edge functions read `LLM_API_KEY` and `LLM_MODEL` from Supabase secrets (set via `supabase secrets set`).

## Naming Conventions

- Components / Pages / Types: `PascalCase`
- Hooks: `camelCase` with `use` prefix
- Services: `camelCase` with `Service` suffix
- Feature route names match folder names (e.g. `symptom-tracking`)
