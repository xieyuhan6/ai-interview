# Verification notes

Environment: macOS, Node.js 24, Next.js 16.3.7.

- `npm test`: 13 service and upload tests. AI and Firestore dependencies are mocked; PDF extraction uses the real parser.
- `npm run typecheck`: TypeScript validation.
- `npm run lint`: lint checks.
- `npm run build`: webpack production build.
- Dependency audit after installation: 0 known vulnerabilities at the time of the last audit.
- `node tests/browser-smoke.mjs`: actual production home and authentication pages, desktop/mobile rendering, protected-page redirects, registration navigation, 401/403/410 API responses, and browser runtime errors.
- `node tests/ui-flow.mjs`: isolated Vite test harness with mocked API responses. Covers resume review → interview transfer → three answers → feedback → refresh → export → interview and resume history. Also checks mobile overflow. The harness is outside the production Next.js routes and does not bypass production authentication.

The UI retains the original dark theme, PrepWise branding, robot banner, interview cards, and two-avatar layout. New resume, history, and feedback features use the same design. Current interface text and test fixtures are English.

## Screenshots

- `home-desktop.png`, `home-mobile.png`, `register-desktop.png`: actual production pages.
- `resume-test-fixture.png`, `interview-test-fixture.png`: isolated test harness using sample data, not real AI-generated results.

## Requires real service configuration

Real Firebase registration/login, Firestore rules and indexes, Gemini requests, cross-device persistence, and microphone recognition require actual service setup or device testing. Mock tests do not establish that those external integrations have been verified.

Browser scripts use the macOS Google Chrome path. Adjust `executablePath` or install Playwright Chromium on another platform. Before running production-page checks, start the server with:

```bash
npm run start -- --hostname 127.0.0.1 --port 3000
```
