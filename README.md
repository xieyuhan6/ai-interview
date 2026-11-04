# Interview Helper

Combines the interview workflow from `ai-interview-main` with the resume review workflow from `resumeHelper-main`. The original PrepWise appearance is preserved: logo, dark background, robot banner, lavender buttons, interview cards, sign-in form, and two-avatar interview layout.

All application labels, errors, downloads, and newly generated AI content use English. Resume analysis has been moved from Streamlit/Python into the Next.js server and shares Firebase authentication, Firestore storage, and Gemini with interviews.

## Features

- Email registration, sign-in, and sign-out with server-verified session cookies.
- Interviews tailored to the role, experience level, focus, resume, and job description.
- Text answers, browser voice input, and question read-aloud. Voice input is editable speech-to-text, rather than a continuous Vapi call.
- Per-user interview sessions with complete transcripts and timestamps; resume unfinished sessions from history.
- Four equally weighted scores: Technical Skills, Communication, Problem Solving, and Role Fit. Feedback includes evidence, strengths, and next steps. The server calculates the overall score.
- PDF/TXT resume import, pasted text, targeted review, editable revised drafts, and TXT downloads.
- Transfer a revised resume into interview preparation with one click.
- Interview and resume history, transcript downloads, and feedback exports.
- Input validation, ownership checks, same-origin mutations, concurrent-submission protection, and a daily limit of 100 AI requests per user.

## Run locally

Requires Node.js 24+, a Firebase project, and a Google AI Studio API key.

```bash
npm ci
cp .env.example .env.local
# Fill in the Firebase configuration and AI key.
npm run dev
```

Open http://localhost:3000. The home and authentication pages render without credentials. Actual registration, persistence, and AI calls require valid service configuration. No real credentials or accounts are included.

### Firebase

1. Create a Firebase project and register a Web app.
2. Enable Email/Password in Authentication. Add localhost and your deployment hostname to authorized domains.
3. Create a Firestore database.
4. Copy the Web app configuration into the `NEXT_PUBLIC_FIREBASE_*` variables in `.env.local`. The supplied project values are already listed in `.env.example`; `storageBucket`, `messagingSenderId`, and `measurementId` are included for the complete Web SDK configuration.
5. Obtain a service account from Project settings → Service accounts. Set `FIREBASE_PROJECT_ID`, `FIREBASE_CLIENT_EMAIL`, and `FIREBASE_PRIVATE_KEY`. Keep the private key quoted with escaped `\n` line breaks. Never commit `.env.local`.
6. Install the Firebase CLI and publish rules and indexes to your own project:

```bash
firebase deploy --only firestore:rules,firestore:indexes --project YOUR_PROJECT_ID
```

The rules deny direct browser access. Authenticated server routes use the Admin SDK and enforce record ownership. History queries require the supplied indexes to finish building.

### AI configuration

Set `GOOGLE_GENERATIVE_AI_API_KEY` to your Google AI Studio key. The default model is `gemini-3-flash-preview`; override it with `GOOGLE_GENERATIVE_AI_MODEL` if necessary. The model must support structured output. The Python project's `OPEN_API_KEY` is no longer used.

Resumes, job descriptions, and answers are sent to the configured AI provider. Original uploaded files are not saved; extracted text and analysis are stored in Firestore. Browser speech recognition may use the browser vendor's speech service.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run build
```

Service tests use mocked Firestore and AI dependencies to check access control, persistence, conflicting submissions, retry behavior, scoring, validation, and resume storage. PDF extraction tests use the actual parser. See [verification notes](docs/VERIFICATION.md) for browser checks and their limitations.

For real-service acceptance testing, register two accounts. Complete an interview with account A, refresh its details, and export the transcript. Account B must not be able to read A's session URL. Upload a resume, edit its revised draft, and transfer it to an interview. Provider failures must leave previously saved records intact.

## Data and endpoints

- `users/{uid}`: profile created from a verified Firebase token.
- `sessions/{id}`: owner ID, interview settings, resume context, messages, revision, status, and feedback.
- `resumes/{id}`: owner ID, source text, job description, analysis, and revised draft.
- `usage/{uid_date}`: daily AI request count using UTC dates. Failed requests also count toward the limit.
- `POST /api/helper`: `start`, `answer`, `finish`, or `resume`. The server derives the owner from the authenticated session.
- `GET /api/helper?id=...`: the current user's interview details.
- `GET /api/helper` and `?kind=resumes`: the current user's latest 100 records of each kind.
- `POST /api/resume/extract`: authenticated PDF/TXT text extraction.
- Legacy `/api/vapi/generate` and `/api/vapi/transcript` endpoints return 410.

## UI conventions

Use `ai-interview-main` as the visual baseline. Its theme is retained in `app/globals.css`; additional styles for new functionality are in `app/helper.css`. Keep the existing layout, colors, gradients, and rounded components. New functionality should extend this interface rather than redesign it.

## Current limits

- Voice uses browser speech-to-text and text-to-speech; audio recordings and continuous Vapi calls are not included.
- An answer is reported as saved only after successful processing and persistence. Failed submissions leave the answer in the editor. Unsubmitted text is not uploaded.
- PDF import supports text-based PDFs up to 5 MB and reads at most 20 pages. Scans need OCR first. Resume text is limited to 30,000 characters.
- Revised resumes export as TXT. Editing a draft affects the current export and interview transfer; history retains the original AI draft.
- History displays the latest 100 records of each kind. Older records remain in Firestore; pagination and deletion controls are not implemented.
- AI scores are practice feedback, not hiring decisions.
- User-entered content and previously saved records are preserved as entered; existing data is not automatically translated or overwritten.
- Deployment requires a Node.js runtime and support for requests up to 120 seconds. Keep private credentials server-side.

### LiveKit voice interviews

The interview room includes a LiveKit voice button. The browser connects to a
server-issued room token through `/api/livekit/token`; the LiveKit API secret is
never sent to the browser. The AI participant is defined in `livekit-agent/`.

Run the agent locally with the LiveKit CLI or the package script:

```bash
cd livekit-agent
npm install
npm run dev
```

To deploy it to LiveKit Cloud, install and authenticate the `lk` CLI, then run
`lk agent create` followed by `lk agent deploy` from the agent directory. The
agent uses LiveKit Inference models, so its credentials and deployment secrets
must be configured in LiveKit Cloud.

## Implementation notes

The original Downloads folders are unchanged. This integration fixes shared in-memory transcripts, missing imports, inconsistent collection/field names, disabled login protection, ineffective sign-out, and hardcoded service configuration.

Development and production builds use webpack for compatibility with the local execution environment. `pdf-parse` is a server external package. The `gaxios@6.7.1` dependency uses a compatible UUID v4 API from an overridden uuid 11.x version to address a dependency advisory.
