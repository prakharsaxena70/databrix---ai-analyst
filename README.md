# DataChat — AI-Powered Data Analysis

Upload files (CSV, XLSX, PDF) and ask questions in plain English. Get instant insights, interactive Plotly charts, and generated Python code.

## Architecture

```
/frontend  → Next.js 16 (App Router) + Tailwind CSS + shadcn/ui
/backend   → FastAPI (Python)
```

- **LLM**: Google Gemini API (gemini-2.5-flash)
- **Code Execution**: E2B sandbox
- **Charts**: Plotly (Python generates JSON → frontend renders with react-plotly.js)
- **Database**: Neon PostgreSQL (optional — falls back to in-memory)

---

## Quick Start

### 1. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
# source venv/bin/activate  # macOS/Linux

pip install -r requirements.txt

# Create .env from template
copy .env.example .env
# Fill in your API keys:
#   GEMINI_API_KEY=...
#   E2B_API_KEY=...
#   DATABASE_URL=...  (optional)

uvicorn main:app --reload --port 8000
```

### 2. Frontend

```bash
cd frontend

# Create .env.local from template
copy .env.local.example .env.local

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Deploy (Render)

Render’s default Python is **3.14.x**, which often forces a **source build of pandas** and can fail. This repo pins **Python 3.12** via `.python-version` at the repo root and under `backend/` (use the one that matches your service **Root Directory**). Alternatively set the Render env var **`PYTHON_VERSION`** to a full version such as `3.12.8`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `GEMINI_API_KEY` | Yes | Google Gemini API key |
| `E2B_API_KEY` | Yes | E2B Code Interpreter API key |
| `DATABASE_URL` | No | Neon PostgreSQL connection string (format: `postgresql+asyncpg://user:pass@host/db`) |
| `NEXT_PUBLIC_API_URL` | No | Backend URL (default: `http://localhost:8000`) |

---

## Features

- **Drag & drop file upload** with instant data preview
- **Natural language chat** for data analysis
- **Interactive Plotly charts** with zoom, hover, and PNG download
- **Generated code** display (collapsible per response)
- **Session management** persisted via localStorage
- **Export** full Q&A as markdown report
- **Error recovery** — auto-retries failed code generation once
