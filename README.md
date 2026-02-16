# Tasks Generator - Option A

A small planning web app that turns a feature brief into user stories and engineering tasks.

## What is done
- Feature brief form (`goal`, `users`, `constraints`, template, optional risks/unknowns)
- LLM-backed generation endpoint with safe fallback when key is missing
- Generation telemetry tracking (latency, token usage, fallback state, estimated cost)
- Editable and reorderable tasks (drag-and-drop within section + group/status/priority updates)
- Export as markdown or plain text (copy + file download)
- Last 5 generated specs on home page
- Status page for backend, database, and LLM checks
- Basic validation and input error handling

Note: generation telemetry is currently stored in DB (`GenerationHistory`) and is not yet rendered in the UI.

## What is not done
- Authentication / multi-user separation
- Cross-section drag-and-drop (reorder is kept inside the same section)
- Advanced task metadata (assignees, due dates)

## Tech stack
- Next.js 16 (App Router) + TypeScript
- Tailwind CSS (utility-first styling)
- Prisma + PostgreSql
- Google Gemini API

## Run locally
1. Install dependencies:
```bash
npm install
```
2. Copy env file and update values:
```bash
cp .env.example .env
```
3. Prepare database:
```bash
npm run setup
```
4. Start app:
```bash
npm run dev
```
5. Open `http://localhost:3000`

## Environment
- `DATABASE_URL` for your database connection
- `GEMINI_API_KEY` for Google AI Studio / Gemini API
- `GEMINI_BASE_URL` should be `https://generativelanguage.googleapis.com/v1beta/openai/`
- `GEMINI_MODEL` default is `gemini-2.5-flash-lite`
- `GEMINI_INPUT_USD_PER_MILLION` optional override for estimated input token cost
- `GEMINI_OUTPUT_USD_PER_MILLION` optional override for estimated output token cost
