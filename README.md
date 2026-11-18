# hamchick.github.io

Personal site: a static Next.js page with an interactive ASCII duck pond in the background.

- Content lives in `src/data/profile.ts`.
- The pond engine is `src/components/duck-pond/engine.ts` (canvas, no dependencies).

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # static export to ./out
```

Pushing to `main` builds and deploys through GitHub Actions
(repo Settings → Pages → Source must be set to **GitHub Actions**).
