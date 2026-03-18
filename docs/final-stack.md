# Final Stack

## Recommendation

Build this product as a `mobile-first PWA` with:

- `Next.js` App Router
- `TypeScript`
- `React`
- `Tailwind CSS`
- `IndexedDB` for local-first user data
- `Dexie` as the IndexedDB wrapper
- optional `Next.js Route Handlers` for server-side AI features
- `Bitbucket` as the Git remote
- `Vercel` for preview and production deployment

## Why this is the best fit

This project needs to be:

- excellent on iPhone
- deployable on Vercel
- low-cost and low-ops
- fast to iterate on
- suitable for a single-user or small private MVP before adding team or multi-user complexity

That makes a `web app with PWA behavior` the best fit, not a native iOS app.

Why:

- Vercel is optimized for web deployments, especially Next.js
- a PWA gives you home-screen install, app-like navigation, and offline-friendly patterns on iPhone
- Next.js is the most natural deployment target on Vercel
- local-first data avoids premature backend/auth complexity for a learning app whose core loop still needs validation

Current references:

- Vercel Git deployments support `Bitbucket` and automatic preview deployments  
  https://vercel.com/docs/git
- Bitbucket-specific import and integration flow on Vercel  
  https://vercel.com/bitbucket
- Next.js official PWA guide  
  https://nextjs.org/docs/app/guides/progressive-web-apps
- Next.js manifest file convention  
  https://nextjs.org/docs/app/api-reference/file-conventions/metadata/manifest

## Chosen architecture

### Frontend

- `Next.js App Router`
- `TypeScript`
- `React`
- `Tailwind CSS`

Reasoning:

- very strong Vercel fit
- fast path to a polished mobile UI
- good split between static screens, app screens, and interactive study flows

### Mobile model

This should be an `installable PWA`, not just a responsive website.

Required PWA pieces:

- app manifest
- installable home-screen experience
- service worker for offline support
- touch-first mobile navigation
- strong performance on unstable mobile networks

### Local-first data

Use `IndexedDB` as the default store for v1.

Store locally:

- phrase inbox
- SRS state
- lesson/session history
- quick reflections and pilot metrics
- cached prompts and recent content

Use `Dexie` to keep the storage layer simple and typed.

Reasoning:

- better offline behavior
- lower hosting cost
- simpler than standing up auth and database infrastructure before the learning loop is validated

## Backend strategy

Do **not** start with a full remote backend unless one of these becomes a real product requirement:

- cross-device sync
- user accounts
- team or coach access
- shared decks
- cloud-stored audio
- server-side AI features using secret API keys

When backend becomes necessary, add it in this order:

1. `Next.js Route Handlers` for secure server-side operations
2. external `Postgres` connected through Vercel Marketplace
3. object storage only if user audio or media truly needs cloud persistence

Current Vercel note:

- `Vercel Postgres` is not available for new signups; Vercel now points new projects to Marketplace database providers  
  https://vercel.com/docs/postgres

## AI and audio

For v1:

- keep audio capture local and simple
- support replay, re-recording, and prompt-based speaking
- avoid cloud audio storage unless it clearly improves the learning loop

If AI is added:

- call it only through server-side endpoints
- keep API secrets off the client
- use AI for prompt generation, speaking feedback, and simplification, not as the entire learning experience

## UI stack guidance

Use:

- `Tailwind CSS`
- a small internal component set
- purposeful mobile-first screens

Avoid:

- React Native / Expo for this version
- heavyweight design-system dependencies before product fit is proven
- backend-first architecture

## Git and deployment model

### Git

- keep the canonical repo in `Bitbucket`
- use `main` for production
- use short-lived feature branches for preview deployments

### Vercel

- import the Bitbucket repo directly into Vercel
- enable automatic deployments from Git
- use preview deployments for feature branches
- deploy `main` to production

Important current caveat:

- Vercel's permissions and deployment rules for private Bitbucket workspace repos differ by plan, and shared/private workspace setups may require `Pro` rather than `Hobby`  
  https://vercel.com/docs/git

Inference:

If this is a personal Bitbucket repo, setup is usually straightforward. If it lives in a shared/private workspace with multiple contributors, expect to move to Vercel Pro.

## Final answer in one line

Use `Next.js + TypeScript + Tailwind + PWA + IndexedDB/Dexie`, keep the repo in `Bitbucket`, and deploy directly to `Vercel` with preview deployments on branches and `main` as production.
