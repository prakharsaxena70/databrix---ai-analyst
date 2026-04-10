"""
DataBrix Backend – FastAPI
Full in-memory backend with auth, sessions, file uploads, and Gemini-powered chat.
"""

import os
import io
import uuid
import json
import time
import traceback
import asyncio
import urllib.request
from types import SimpleNamespace
from datetime import datetime, timedelta
from typing import Optional, Any

from fastapi import FastAPI, UploadFile, File, HTTPException, Depends, Form, Request
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

import pandas as pd
import plotly.express as px
from plotly.utils import PlotlyJSONEncoder

load_dotenv()

# ── CORS (explicit origins required when allow_credentials=True) ───────────────
CORS_ALLOW_ORIGINS = [
    "http://localhost:3000",
    "http://127.0.0.1:3000",
    "https://databrix.vercel.app",
]
_extra = os.getenv("CORS_ALLOW_ORIGINS", "").strip()
if _extra:
    for part in _extra.split(","):
        o = part.strip()
        if o and o not in CORS_ALLOW_ORIGINS:
            CORS_ALLOW_ORIGINS.append(o)

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(title="DataBrix API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ALLOW_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Gemini ─────────────────────────────────────────────────────────────────────
GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
gemini_model = None
GEMINI_MODELS = ["gemini-2.5-flash", "gemini-2.0-flash", "gemini-1.5-flash", "gemini-pro"]

def get_gemini(model_name: str = None):
    global gemini_model
    if GEMINI_API_KEY:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
        name = model_name or GEMINI_MODELS[0]
        return genai.GenerativeModel(name)
    return None

def generate_with_fallback(prompt, retries=3):
    """Try multiple models if one fails with quota error."""
    def _generate_via_rest(model_name: str, prompt_text: str):
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={GEMINI_API_KEY}"
        payload = {"contents": [{"parts": [{"text": prompt_text}]}]}
        req = urllib.request.Request(
            url,
            data=json.dumps(payload).encode("utf-8"),
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        with urllib.request.urlopen(req, timeout=20) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        candidates = body.get("candidates") or []
        if not candidates:
            raise Exception(f"No candidates in Gemini REST response for {model_name}")
        parts = ((candidates[0] or {}).get("content") or {}).get("parts") or []
        text = "".join([(p.get("text") or "") for p in parts if isinstance(p, dict)]).strip()
        if not text:
            raise Exception(f"Empty text in Gemini REST response for {model_name}")
        return SimpleNamespace(text=text)

    use_rest_fallback = False
    genai = None
    try:
        import google.generativeai as genai
        genai.configure(api_key=GEMINI_API_KEY)
    except Exception as e:
        print(f"[Gemini] SDK import failed ({e}), using REST fallback")
        use_rest_fallback = True
    
    for model_name in GEMINI_MODELS:
        try:
            if use_rest_fallback:
                result = _generate_via_rest(model_name, prompt)
            else:
                model = genai.GenerativeModel(model_name)
                result = model.generate_content(prompt)
            return result
        except Exception as e:
            error_str = str(e)
            if "429" in error_str or "quota" in error_str.lower():
                print(f"[Gemini] {model_name} quota exceeded, trying next model...")
                continue
            elif "404" in error_str or "not found" in error_str.lower():
                print(f"[Gemini] {model_name} not found, trying next model...")
                continue
            else:
                raise
    raise Exception("All Gemini models exceeded quota. Please try again later or check your API key billing.")

# ── In-Memory Stores ──────────────────────────────────────────────────────────
users_db: dict[str, dict] = {}           # email -> user record
tokens_db: dict[str, str] = {}           # token -> user_id
sessions_db: dict[str, dict] = {}        # session_id -> session data

UPLOAD_DIR = "C:/tmp/databrix_uploads/"
os.makedirs(UPLOAD_DIR, exist_ok=True)

def save_session_df(session_id: str, df: pd.DataFrame):
    df.to_pickle(os.path.join(UPLOAD_DIR, f"{session_id}.pkl"))

def load_session_df(session_id: str) -> Optional[pd.DataFrame]:
    path = os.path.join(UPLOAD_DIR, f"{session_id}.pkl")
    if os.path.exists(path):
        return pd.read_pickle(path)
    return None

def delete_session_df(session_id: str):
    path = os.path.join(UPLOAD_DIR, f"{session_id}.pkl")
    if os.path.exists(path):
        try:
            os.remove(path)
        except OSError:
            pass

# ── Auth Models ────────────────────────────────────────────────────────────────
class AuthRequest(BaseModel):
    email: str
    password: str
    full_name: Optional[str] = None

class ChatRequest(BaseModel):
    session_id: str
    question: str

class SessionUpdate(BaseModel):
    nickname: Optional[str] = None
    is_starred: Optional[bool] = None

class EnhanceRequest(BaseModel):
    prompt: str

# ── Auth helpers ──────────────────────────────────────────────────────────────
def create_token(user_id: str) -> str:
    token = str(uuid.uuid4())
    tokens_db[token] = user_id
    return token

def get_current_user(request: Request) -> Optional[dict]:
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        user_id = tokens_db.get(token)
        if user_id:
            for u in users_db.values():
                if u["id"] == user_id:
                    return u
    return None

# ── Auth Endpoints ────────────────────────────────────────────────────────────
@app.post("/auth/register")
async def register(body: AuthRequest):
    if body.email in users_db:
        raise HTTPException(400, "Email already registered")
    user_id = str(uuid.uuid4())
    user = {
        "id": user_id,
        "email": body.email,
        "password": body.password,
        "full_name": body.full_name or body.email.split("@")[0],
        "is_active": True,
        "created_at": datetime.utcnow().isoformat(),
    }
    users_db[body.email] = user
    token = create_token(user_id)
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {k: v for k, v in user.items() if k != "password"},
    }

@app.post("/auth/login")
async def login(body: AuthRequest):
    user = users_db.get(body.email)
    if not user or user["password"] != body.password:
        raise HTTPException(401, "Invalid credentials")
    token = create_token(user["id"])
    return {
        "access_token": token,
        "token_type": "bearer",
        "user": {k: v for k, v in user.items() if k != "password"},
    }

@app.get("/auth/check")
async def check_auth(request: Request):
    user = get_current_user(request)
    if user:
        return {
            "is_authenticated": True,
            "user": {k: v for k, v in user.items() if k != "password"},
        }
    return {"is_authenticated": False}

@app.post("/auth/logout")
async def logout(request: Request):
    auth = request.headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        token = auth[7:]
        tokens_db.pop(token, None)
    return {"status": "ok"}

@app.get("/auth/me")
async def me(request: Request):
    user = get_current_user(request)
    if not user:
        raise HTTPException(401, "Not authenticated")
    return {k: v for k, v in user.items() if k != "password"}

# ── Sessions ──────────────────────────────────────────────────────────────────
@app.get("/sessions")
async def list_sessions(request: Request):
    user = get_current_user(request)
    user_id = user["id"] if user else "anonymous"
    result = []
    for sid, s in sessions_db.items():
        if s.get("user_id") == user_id:
            result.append({
                "id": sid,
                "session_id": sid,
                "filename": s["filename"],
                "nickname": s.get("nickname"),
                "is_starred": s.get("is_starred", False),
                "created_at": s.get("created_at"),
                "file_meta": s.get("file_meta"),
            })
    return sorted(result, key=lambda x: x.get("created_at", ""), reverse=True)

@app.get("/session/{session_id}")
async def get_session(session_id: str):
    s = sessions_db.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    return {
        "id": session_id,
        "session_id": session_id,
        "filename": s["filename"],
        "nickname": s.get("nickname"),
        "is_starred": s.get("is_starred", False),
        "created_at": s.get("created_at"),
        "file_meta": s.get("file_meta"),
        "messages": s.get("messages", []),
    }

@app.put("/session/{session_id}")
async def update_session(session_id: str, body: SessionUpdate):
    s = sessions_db.get(session_id)
    if not s:
        raise HTTPException(404, "Session not found")
    if body.nickname is not None:
        s["nickname"] = body.nickname
    if body.is_starred is not None:
        s["is_starred"] = body.is_starred
    return {"status": "ok"}

@app.delete("/session/{session_id}")
async def delete_session(session_id: str):
    sessions_db.pop(session_id, None)
    delete_session_df(session_id)
    return {"status": "ok"}

# ── Upload ────────────────────────────────────────────────────────────────────
@app.post("/upload")
async def upload(request: Request, file: UploadFile = File(...)):
    user = get_current_user(request)
    user_id = user["id"] if user else "anonymous"
    
    content = await file.read()
    filename = file.filename or "unknown"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    
    session_id = str(uuid.uuid4())
    
    preview_data: dict = {"shape": {"rows": 0, "columns": 0}, "columns": [], "preview": []}
    pdf_data = None
    
    try:
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(content))
            save_session_df(session_id, df)
            preview_data = build_preview(df)
            del df # Free memory
        elif ext == "xlsx":
            df = pd.read_excel(io.BytesIO(content))
            save_session_df(session_id, df)
            preview_data = build_preview(df)
            del df # Free memory
        elif ext == "pdf":
            pdf_data = extract_pdf_data(content)
            # Try to extract tables from PDF text
            text = pdf_data.get("text", "")
            preview_data = {
                "shape": {"rows": len(text.split("\n")), "columns": 1},
                "columns": [{"name": "content", "dtype": "text", "null_count": 0}],
                "preview": [{"content": line} for line in text.split("\n")[:10] if line.strip()],
            }
        else:
            # Try reading as CSV
            try:
                df = pd.read_csv(io.BytesIO(content))
                session_dataframes[session_id] = df
                preview_data = build_preview(df)
            except:
                raise HTTPException(400, f"Unsupported file type: {ext}")
    except HTTPException:
        raise
    except Exception as e:
        print(f"Upload processing error: {e}")
        traceback.print_exc()

    session = {
        "user_id": user_id,
        "filename": filename,
        "created_at": datetime.utcnow().isoformat(),
        "messages": [],
        "file_meta": {
            "filename": filename,
            "size": len(content),
            "extension": ext,
            "shape": preview_data["shape"],
            "columns": preview_data["columns"],
            "preview": preview_data["preview"],
            "pdf_data": pdf_data,
        },
    }
    sessions_db[session_id] = session

    response: dict[str, Any] = {
        "session_id": session_id,
        "filename": filename,
        "preview": preview_data,
    }
    if pdf_data:
        response["pdf_data"] = pdf_data
    
    return response

def build_preview(df: pd.DataFrame) -> dict:
    columns = []
    for col in df.columns:
        columns.append({
            "name": str(col),
            "dtype": str(df[col].dtype),
            "null_count": int(df[col].isnull().sum()),
        })
    
    preview_rows = df.head(20).fillna("").astype(str).to_dict(orient="records")
    
    return {
        "shape": {"rows": len(df), "columns": len(df.columns)},
        "columns": columns,
        "preview": preview_rows,
    }

def extract_pdf_data(content: bytes) -> dict:
    """Extract text and images from PDF using PyMuPDF."""
    result = {"images_count": 0, "images": [], "pages": [], "text": ""}
    
    try:
        import fitz  # PyMuPDF
        doc = fitz.open(stream=content, filetype="pdf")
        all_text = []
        
        for page_num in range(len(doc)):
            page = doc[page_num]
            text = page.get_text()
            all_text.append(text)
            
            # Render page as image
            import base64
            pix = page.get_pixmap(dpi=150)
            img_bytes = pix.tobytes("png")
            b64 = base64.b64encode(img_bytes).decode()
            result["pages"].append({
                "page": page_num + 1,
                "base64": b64,
                "width": pix.width,
                "height": pix.height,
            })
            
            # Extract images
            for img_idx, img in enumerate(page.get_images(full=True)):
                try:
                    xref = img[0]
                    base_img = doc.extract_image(xref)
                    if base_img:
                        img_b64 = base64.b64encode(base_img["image"]).decode()
                        result["images"].append({
                            "page": page_num + 1,
                            "index": img_idx,
                            "format": base_img.get("ext", "png"),
                            "base64": img_b64,
                            "size": len(base_img["image"]),
                        })
                except:
                    pass
        
        result["text"] = "\n\n".join(all_text)
        result["images_count"] = len(result["images"])
        doc.close()
    except ImportError:
        result["text"] = "PDF processing requires PyMuPDF (fitz)"
    except Exception as e:
        result["text"] = f"PDF extraction error: {str(e)}"
    
    return result

# ── Chat (non-streaming) ─────────────────────────────────────────────────────
@app.post("/chat")
async def chat(body: ChatRequest, request: Request):
    session = sessions_db.get(body.session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    if not GEMINI_API_KEY:
        raise HTTPException(500, "Gemini API key not configured. Set GEMINI_API_KEY in backend/.env")
    
    # Build context
    context = build_chat_context(body.session_id, session)
    
    prompt = f"""{context}

User Question: {body.question}

Instructions:
- Answer the user question directly first in 2-3 lines.
- Then provide a concise McKinsey-style insight block:
  1) Key finding (quantified)
  2) Business implication
  3) Recommended action
- Include specific numbers, percentages, and comparisons from the data.
- If relevant, include up to 2 valid Plotly chart JSON blocks using ```plotly.
- Avoid generic statements; every claim must tie to observed data.
"""
    
    try:
        result = generate_with_fallback(prompt)
        response_text = result.text
        
        # Extract plotly charts
        charts = extract_plotly_charts(response_text)
        clean_text = clean_plotly_from_text(response_text)
        if not charts:
            df = load_session_df(body.session_id)
            if df is not None:
                auto_charts, _ = generate_default_charts(df)
                charts = auto_charts
                del df
        
        # Save messages
        session["messages"].append({"role": "user", "content": body.question, "created_at": datetime.utcnow().isoformat()})
        session["messages"].append({
            "role": "assistant",
            "content": clean_text,
            "charts": charts,
            "plotly_json": charts[0] if charts else None,
            "code": None,
            "created_at": datetime.utcnow().isoformat(),
        })
        
        return {
            "text": clean_text,
            "charts": charts,
            "plotly_json": charts[0] if charts else None,
            "code": None,
        }
    except Exception as e:
        traceback.print_exc()
        df = load_session_df(body.session_id)
        charts = []
        if df is not None:
            charts, _ = generate_default_charts(df)
            row_count = len(df)
            col_count = len(df.columns)
            del df
        else:
            row_count = 0
            col_count = 0
        df_for_summary = load_session_df(body.session_id)
        if df_for_summary is not None:
            fallback_text = build_structural_summary(df_for_summary, session["filename"])
            del df_for_summary
        else:
            fallback_text = (
                f"AI service is temporarily unavailable. Showing a data-backed fallback response. "
                f"Your dataset has {row_count:,} rows and {col_count} columns."
            )
        session["messages"].append({"role": "user", "content": body.question, "created_at": datetime.utcnow().isoformat()})
        session["messages"].append({
            "role": "assistant",
            "content": fallback_text,
            "charts": charts,
            "plotly_json": charts[0] if charts else None,
            "code": None,
            "created_at": datetime.utcnow().isoformat(),
        })
        return {
            "text": fallback_text,
            "charts": charts,
            "plotly_json": charts[0] if charts else None,
            "code": None,
            "warning": str(e),
        }

# ── Chat Stream ───────────────────────────────────────────────────────────────
@app.post("/chat/stream")
async def chat_stream(body: ChatRequest, request: Request):
    session = sessions_db.get(body.session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    if not GEMINI_API_KEY:
        raise HTTPException(500, "Gemini API key not configured")
    
    context = build_chat_context(body.session_id, session)
    
    prompt = f"""{context}

User Question: {body.question}

Instructions:
- Answer the user question directly first in 2-3 lines.
- Then provide a concise McKinsey-style insight block:
  1) Key finding (quantified)
  2) Business implication
  3) Recommended action
- Include specific numbers, percentages, and comparisons from the data.
- If relevant, include up to 2 valid Plotly chart JSON blocks using ```plotly.
- Avoid generic statements; every claim must tie to observed data.
"""

    async def stream_generator():
        try:
            # Send progress steps
            yield f"data: {json.dumps({'type': 'step', 'content': 'Analyzing your data...'})}\n\n"
            await asyncio.sleep(0.3)
            yield f"data: {json.dumps({'type': 'step', 'content': 'Generating insights...'})}\n\n"
            
            result = generate_with_fallback(prompt)
            response_text = result.text
            
            yield f"data: {json.dumps({'type': 'step', 'content': 'Preparing response...'})}\n\n"
            
            # Extract charts
            charts = extract_plotly_charts(response_text)
            clean_text = clean_plotly_from_text(response_text)
            if not charts:
                df = load_session_df(body.session_id)
                if df is not None:
                    auto_charts, _ = generate_default_charts(df)
                    charts = auto_charts
                    del df
            
            if charts:
                yield f"data: {json.dumps({'type': 'charts', 'count': len(charts)})}\n\n"
            
            # Send complete response
            yield f"data: {json.dumps({'type': 'complete', 'text': clean_text, 'charts': charts, 'code': None})}\n\n"
            
            # Save to session
            session["messages"].append({"role": "user", "content": body.question, "created_at": datetime.utcnow().isoformat()})
            session["messages"].append({
                "role": "assistant",
                "content": clean_text,
                "charts": charts,
                "plotly_json": charts[0] if charts else None,
                "code": None,
                "created_at": datetime.utcnow().isoformat(),
            })
            
        except Exception as e:
            traceback.print_exc()
            df = load_session_df(body.session_id)
            charts = []
            if df is not None:
                charts, _ = generate_default_charts(df)
                row_count = len(df)
                col_count = len(df.columns)
                del df
            else:
                row_count = 0
                col_count = 0
            df_for_summary = load_session_df(body.session_id)
            if df_for_summary is not None:
                fallback_text = build_structural_summary(df_for_summary, session["filename"])
                del df_for_summary
            else:
                fallback_text = (
                    f"AI service is temporarily unavailable. Showing a data-backed fallback response. "
                    f"Your dataset has {row_count:,} rows and {col_count} columns."
                )
            if charts:
                yield f"data: {json.dumps({'type': 'charts', 'count': len(charts)})}\n\n"
            yield f"data: {json.dumps({'type': 'complete', 'text': fallback_text, 'charts': charts, 'code': None})}\n\n"
            session["messages"].append({"role": "user", "content": body.question, "created_at": datetime.utcnow().isoformat()})
            session["messages"].append({
                "role": "assistant",
                "content": fallback_text,
                "charts": charts,
                "plotly_json": charts[0] if charts else None,
                "code": None,
                "created_at": datetime.utcnow().isoformat(),
            })
    
    return StreamingResponse(
        stream_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
        },
    )

# ── Enhance Prompt ────────────────────────────────────────────────────────────
@app.post("/enhance-prompt")
async def enhance_prompt(body: EnhanceRequest):
    if not GEMINI_API_KEY:
        return {"enhanced": body.prompt}
    
    try:
        result = generate_with_fallback(
            f"""Enhance this data analysis prompt to be more specific and useful. 
Keep it concise (1-2 sentences max). Return ONLY the enhanced prompt, nothing else.

Original: {body.prompt}

Enhanced:"""
        )
        enhanced = result.text.strip().strip('"').strip("'")
        return {"enhanced": enhanced if len(enhanced) > 5 else body.prompt}
    except:
        return {"enhanced": body.prompt}

# ── Explain Data (AI Summary) ─────────────────────────────────────────────────
@app.post("/api/explain-data/{session_id}")
async def explain_data(session_id: str, request: Request):
    """Generate an AI-powered executive summary of the uploaded dataset."""
    session = sessions_db.get(session_id)
    if not session:
        raise HTTPException(404, "Session not found")
    
    df = load_session_df(session_id)
    if df is None:
        raise HTTPException(400, "No data loaded for this session. Upload a file first.")
    
    if not GEMINI_API_KEY:
        raise HTTPException(500, "Gemini API key required for data explanation")
    
    try:
        # Build comprehensive data context
        df_cols = list(df.columns)
        len_rows = len(df)
        shape = f"{len_rows} rows × {len(df_cols)} columns"
        col_types = ", ".join([f"{c} ({df[c].dtype})" for c in df_cols[:20]])
        sample = df.head(15).to_string(index=False)
        
        stats = ""
        try:
            # Drop object columns to save token limit on massive descriptive strings
            numeric_df = df.select_dtypes(include=["number"])
            if not numeric_df.empty:
                stats = numeric_df.describe().to_string()
        except:
            pass
        
        missing = df.isnull().sum()
        missing_info = ", ".join([f"{c}: {v}" for c, v in missing.items() if v > 0][:10])
        
        prompt = f"""You are DataBrix AI, a senior strategy analytics consultant. Provide a McKinsey-grade executive brief for this dataset.

Dataset: {session['filename']}
Shape: {shape}
Columns: {col_types}

Data Sample:
{sample}

Statistics:
{stats}

Missing Values: {missing_info if missing_info else "None detected"}

Provide the following in markdown:
1. **Executive Summary** (4-6 lines, quantified)
2. **Performance Diagnosis** (key drivers, concentration, and trend shifts)
3. **Data Quality and Risk Flags** (missingness, outliers, reliability caveats)
4. **Strategic Implications** (what this means for decision-makers)
5. **Priority Actions (30/60/90 days)** with measurable outcomes

Use specific values and percentages from the dataset. Avoid generic wording.
Target depth: 600-900 words with clear, board-ready language."""

        result = generate_with_fallback(prompt)
        summary_text = result.text

        numeric_cols = len(df.select_dtypes(include=["number"]).columns)
        missing_total = int(df.isnull().sum().sum())
        auto_charts, auto_visuals = generate_default_charts(df)
        report = {
            "type": "report",
            "title": f"Analysis Report: {session['filename']}",
            "summary": summary_text,
            "kpis": [
                {"label": "Total Rows", "value": f"{len_rows:,}"},
                {"label": "Total Columns", "value": str(len(df_cols))},
                {"label": "Numeric Columns", "value": str(numeric_cols)},
                {"label": "Missing Values", "value": f"{missing_total:,}"},
            ],
            "visuals": auto_visuals,
        }

        del df # specific cleanup
        return {
            "summary": summary_text,
            "shape": shape,
            "columns": len(df_cols),
            "rows": len_rows,
            "report": report,
            "charts": auto_charts,
        }
    except Exception as e:
        traceback.print_exc()
        # Always return a usable report payload even if AI call fails.
        try:
            df_fallback = load_session_df(session_id)
            if df_fallback is not None:
                df_cols_fb = list(df_fallback.columns)
                rows_fb = len(df_fallback)
                shape_fb = f"{rows_fb} rows × {len(df_cols_fb)} columns"
                numeric_cols_fb = len(df_fallback.select_dtypes(include=["number"]).columns)
                missing_total_fb = int(df_fallback.isnull().sum().sum())
                charts_fb, visuals_fb = generate_default_charts(df_fallback)
                del df_fallback
            else:
                df_cols_fb = []
                rows_fb = 0
                shape_fb = "0 rows × 0 columns"
                numeric_cols_fb = 0
                missing_total_fb = 0
                charts_fb, visuals_fb = [], []

            if df_cols_fb:
                df_for_summary = load_session_df(session_id)
                if df_for_summary is not None:
                    summary_fb = build_structural_summary(df_for_summary, session["filename"])
                    del df_for_summary
                else:
                    summary_fb = (
                        "AI summary temporarily unavailable. "
                        "Generated structural report and charts from your dataset."
                    )
            else:
                summary_fb = (
                    "AI summary temporarily unavailable. "
                    "Generated structural report and charts from your dataset."
                )
            report_fb = {
                "type": "report",
                "title": f"Analysis Report: {session['filename']}",
                "summary": summary_fb,
                "kpis": [
                    {"label": "Total Rows", "value": f"{rows_fb:,}"},
                    {"label": "Total Columns", "value": str(len(df_cols_fb))},
                    {"label": "Numeric Columns", "value": str(numeric_cols_fb)},
                    {"label": "Missing Values", "value": f"{missing_total_fb:,}"},
                ],
                "visuals": visuals_fb,
            }
            return {
                "summary": summary_fb,
                "shape": shape_fb,
                "columns": len(df_cols_fb),
                "rows": rows_fb,
                "report": report_fb,
                "charts": charts_fb,
                "warning": str(e),
            }
        except Exception:
            raise HTTPException(500, f"Failed to explain data: {str(e)}")

# ── Tools Endpoints ───────────────────────────────────────────────────────────
@app.get("/tools/list")
async def list_tools():
    return {"tools": [
        {"id": "image-to-excel", "name": "Image to Excel", "description": "Convert image tables to Excel"},
        {"id": "image-to-csv", "name": "Image to CSV", "description": "Convert image tables to CSV"},
        {"id": "html-to-csv", "name": "HTML to CSV", "description": "Convert HTML table to CSV"},
        {"id": "pdf-to-excel", "name": "PDF to Excel", "description": "Convert PDF tables to Excel"},
        {"id": "pdf-to-csv", "name": "PDF to CSV", "description": "Convert PDF tables to CSV"},
        {"id": "excel-to-csv", "name": "Excel to CSV", "description": "Convert Excel to CSV"},
        {"id": "json-to-excel", "name": "JSON to Excel", "description": "Convert JSON to Excel"},
        {"id": "merge-excel", "name": "Merge Excel", "description": "Merge multiple Excel files"},
        {"id": "merge-csv", "name": "Merge CSV", "description": "Merge multiple CSV files"},
        {"id": "generate-sql", "name": "Generate SQL", "description": "Generate SQL from data"},
        {"id": "remove-duplicates", "name": "Remove Duplicates", "description": "Remove duplicate rows"},
        {"id": "smart-clean", "name": "Smart Data Cleaning", "description": "AI-powered data cleaning"},
    ]}

@app.post("/tools/excel-to-csv")
async def excel_to_csv(file: UploadFile = File(...)):
    content = await file.read()
    df = pd.read_excel(io.BytesIO(content))
    output = io.BytesIO()
    df.to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename=converted.csv"},
    )

@app.post("/tools/pdf-to-csv")
async def pdf_to_csv(file: UploadFile = File(...)):
    content = await file.read()
    pdf_data = extract_pdf_data(content)
    lines = [line for line in pdf_data["text"].split("\n") if line.strip()]
    output = io.BytesIO()
    output.write("line,content\n".encode())
    for i, line in enumerate(lines):
        clean = line.replace('"', '""')
        output.write(f'{i+1},"{clean}"\n'.encode())
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=extracted.csv"},
    )

@app.post("/tools/pdf-to-excel")
async def pdf_to_excel(file: UploadFile = File(...)):
    content = await file.read()
    pdf_data = extract_pdf_data(content)
    lines = [line for line in pdf_data["text"].split("\n") if line.strip()]
    df = pd.DataFrame({"Line": range(1, len(lines)+1), "Content": lines})
    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=extracted.xlsx"},
    )

@app.post("/tools/image-to-excel")
async def image_to_excel(file: UploadFile = File(...)):
    # Use Gemini to extract table from image
    model = get_gemini()
    if not model:
        raise HTTPException(500, "Gemini API key required for image processing")
    
    content = await file.read()
    import base64
    b64 = base64.b64encode(content).decode()
    
    import google.generativeai as genai
    
    result = model.generate_content([
        "Extract all table data from this image. Return as CSV format with headers.",
        {"mime_type": f"image/{file.filename.split('.')[-1]}", "data": base64.b64decode(base64.b64encode(content))},
    ])
    
    csv_text = result.text
    df = pd.read_csv(io.StringIO(csv_text))
    output = io.BytesIO()
    df.to_excel(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=extracted.xlsx"},
    )

@app.post("/tools/image-to-csv")
async def image_to_csv(file: UploadFile = File(...)):
    model = get_gemini()
    if not model:
        raise HTTPException(500, "Gemini API key required")
    
    content = await file.read()
    import base64
    
    result = model.generate_content([
        "Extract all table data from this image. Return ONLY as CSV format with headers. No explanation.",
        {"mime_type": f"image/{file.filename.split('.')[-1]}", "data": content},
    ])
    
    output = io.BytesIO(result.text.encode())
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=extracted.csv"},
    )

@app.post("/tools/html-to-csv")
async def html_to_csv(html_content: str = Form(...)):
    try:
        dfs = pd.read_html(io.StringIO(html_content))
        if not dfs:
            raise HTTPException(400, "No tables found in HTML")
        df = dfs[0]
        output = io.BytesIO()
        df.to_csv(output, index=False)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="text/csv",
            headers={"Content-Disposition": "attachment; filename=converted.csv"},
        )
    except Exception as e:
        raise HTTPException(400, f"Failed to parse HTML: {str(e)}")

@app.post("/tools/merge-excel")
async def merge_excel(files: list[UploadFile] = File(...), merge_type: str = Form("concat")):
    dfs = []
    for f in files:
        content = await f.read()
        df = pd.read_excel(io.BytesIO(content))
        dfs.append(df)
    
    if merge_type == "concat":
        result = pd.concat(dfs, ignore_index=True)
    else:
        result = dfs[0]
        for df in dfs[1:]:
            common = list(set(result.columns) & set(df.columns))
            if common:
                result = result.merge(df, on=common[0], how="outer")
    
    output = io.BytesIO()
    result.to_excel(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        headers={"Content-Disposition": "attachment; filename=merged.xlsx"},
    )

@app.post("/tools/merge-csv")
async def merge_csv(files: list[UploadFile] = File(...)):
    dfs = []
    for f in files:
        content = await f.read()
        df = pd.read_csv(io.BytesIO(content))
        dfs.append(df)
    
    result = pd.concat(dfs, ignore_index=True)
    output = io.BytesIO()
    result.to_csv(output, index=False)
    output.seek(0)
    return StreamingResponse(
        output,
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=merged.csv"},
    )

@app.post("/tools/generate-sql")
async def generate_sql(file: UploadFile = File(...), table_name: str = Form("data_table")):
    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "csv"
    
    if ext == "csv":
        df = pd.read_csv(io.BytesIO(content))
    elif ext == "xlsx":
        df = pd.read_excel(io.BytesIO(content))
    else:
        raise HTTPException(400, "Unsupported file type")
    
    # Generate CREATE TABLE + INSERT statements
    type_map = {"int64": "INTEGER", "float64": "REAL", "object": "TEXT", "bool": "BOOLEAN", "datetime64[ns]": "TIMESTAMP"}
    
    columns_sql = []
    for col in df.columns:
        sql_type = type_map.get(str(df[col].dtype), "TEXT")
        columns_sql.append(f'    "{col}" {sql_type}')
    
    sql = f'CREATE TABLE "{table_name}" (\n' + ",\n".join(columns_sql) + "\n);\n\n"
    
    for _, row in df.head(100).iterrows():
        vals = []
        for v in row.values:
            if pd.isna(v):
                vals.append("NULL")
            elif isinstance(v, (int, float)):
                vals.append(str(v))
            else:
                vals.append(f"'{str(v).replace(chr(39), chr(39)+chr(39))}'")
        sql += f'INSERT INTO "{table_name}" VALUES ({", ".join(vals)});\n'
    
    output = io.BytesIO(sql.encode())
    return StreamingResponse(
        output,
        media_type="application/sql",
        headers={"Content-Disposition": f"attachment; filename={table_name}.sql"},
    )

@app.post("/tools/json-to-excel")
async def json_to_excel(file: UploadFile = File(...)):
    """Convert JSON data to Excel spreadsheet."""
    content = await file.read()
    try:
        data = json.loads(content)
        # Handle various JSON structures
        if isinstance(data, list):
            df = pd.json_normalize(data)
        elif isinstance(data, dict):
            # If it has a key with a list value, use that
            for key, val in data.items():
                if isinstance(val, list) and len(val) > 0:
                    df = pd.json_normalize(val)
                    break
            else:
                df = pd.json_normalize(data)
        else:
            raise HTTPException(400, "JSON must be an object or array")
        
        output = io.BytesIO()
        df.to_excel(output, index=False)
        output.seek(0)
        return StreamingResponse(
            output,
            media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            headers={"Content-Disposition": "attachment; filename=converted.xlsx"},
        )
    except json.JSONDecodeError:
        raise HTTPException(400, "Invalid JSON file")
    except Exception as e:
        raise HTTPException(500, f"Conversion failed: {str(e)}")

@app.post("/tools/remove-duplicates")
async def remove_duplicates(file: UploadFile = File(...)):
    """Remove duplicate rows from CSV or Excel files."""
    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "csv"
    
    try:
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(content))
        elif ext in ("xlsx", "xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(400, "Unsupported file type. Use CSV or Excel.")
        
        original_count = len(df)
        df_clean = df.drop_duplicates()
        removed_count = original_count - len(df_clean)
        
        output = io.BytesIO()
        if ext == "csv":
            df_clean.to_csv(output, index=False)
            media = "text/csv"
            fname = "deduplicated.csv"
        else:
            df_clean.to_excel(output, index=False)
            media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            fname = "deduplicated.xlsx"
        
        output.seek(0)
        return StreamingResponse(
            output,
            media_type=media,
            headers={
                "Content-Disposition": f"attachment; filename={fname}",
                "X-Original-Count": str(original_count),
                "X-Cleaned-Count": str(len(df_clean)),
                "X-Removed-Count": str(removed_count),
            },
        )
    except Exception as e:
        raise HTTPException(500, f"Deduplication failed: {str(e)}")

@app.post("/tools/smart-clean")
async def smart_clean(file: UploadFile = File(...)):
    """AI-powered data cleaning: trim whitespace, standardize formats, handle missing values."""
    content = await file.read()
    ext = file.filename.rsplit(".", 1)[-1].lower() if file.filename else "csv"
    
    try:
        if ext == "csv":
            df = pd.read_csv(io.BytesIO(content))
        elif ext in ("xlsx", "xls"):
            df = pd.read_excel(io.BytesIO(content))
        else:
            raise HTTPException(400, "Unsupported file type. Use CSV or Excel.")
        
        changes = []
        
        # 1. Trim whitespace from string columns
        for col in df.select_dtypes(include=["object"]).columns:
            trimmed = df[col].str.strip()
            if not df[col].equals(trimmed):
                df[col] = trimmed
                changes.append(f"Trimmed whitespace in '{col}'")
        
        # 2. Standardize text case for columns that look like categories
        for col in df.select_dtypes(include=["object"]).columns:
            unique_count = df[col].nunique()
            total_count = len(df[col].dropna())
            if 0 < unique_count <= 50 and total_count > 0:
                # Standardize to title case
                df[col] = df[col].str.title()
                changes.append(f"Standardized case in '{col}'")
        
        # 3. Fill missing numeric values with median
        for col in df.select_dtypes(include=["number"]).columns:
            missing = df[col].isnull().sum()
            if missing > 0:
                median_val = df[col].median()
                df[col] = df[col].fillna(median_val)
                changes.append(f"Filled {missing} missing values in '{col}' with median ({median_val:.2f})")
        
        # 4. Remove fully empty rows
        empty_before = len(df)
        df = df.dropna(how="all")
        empty_removed = empty_before - len(df)
        if empty_removed > 0:
            changes.append(f"Removed {empty_removed} empty rows")
        
        # 5. Remove duplicate rows
        dup_before = len(df)
        df = df.drop_duplicates()
        dup_removed = dup_before - len(df)
        if dup_removed > 0:
            changes.append(f"Removed {dup_removed} duplicate rows")
        
        output = io.BytesIO()
        if ext == "csv":
            df.to_csv(output, index=False)
            media = "text/csv"
            fname = "cleaned.csv"
        else:
            df.to_excel(output, index=False)
            media = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            fname = "cleaned.xlsx"
        
        output.seek(0)
        return StreamingResponse(
            output,
            media_type=media,
            headers={
                "Content-Disposition": f"attachment; filename={fname}",
                "X-Changes": json.dumps(changes),
                "X-Final-Rows": str(len(df)),
            },
        )
    except Exception as e:
        raise HTTPException(500, f"Smart cleaning failed: {str(e)}")

# ── Helpers ───────────────────────────────────────────────────────────────────
def build_chat_context(session_id: str, session: dict) -> str:
    """Build context string for Gemini from session data."""
    parts = ["You are DataBrix, an expert AI data analyst. Analyze the following data and answer questions about it.\n"]
    
    # Add file info
    meta = session.get("file_meta", {})
    parts.append(f"File: {session['filename']}")
    shape = meta.get("shape", {})
    if shape:
        parts.append(f"Data shape: {shape.get('rows', 0)} rows × {shape.get('columns', 0)} columns")
    
    # Add column info
    cols = meta.get("columns", [])
    if cols:
        col_info = ", ".join([f"{c['name']} ({c['dtype']})" for c in cols[:30]])
        parts.append(f"Columns: {col_info}")
    
    # Add data sample
    df = load_session_df(session_id)
    if df is not None:
        sample = df.head(30).to_string(index=False)
        parts.append(f"\nData Sample:\n{sample}")
        
        # Add basic stats
        try:
            numeric_df = df.select_dtypes(include=["number"])
            if not numeric_df.empty:
                stats = numeric_df.describe().to_string()
                parts.append(f"\nStatistics:\n{stats}")
        except:
            pass
        del df # explicit cleanup
    else:
        # PDF text data
        pdf_data = meta.get("pdf_data", {})
        if pdf_data and pdf_data.get("text"):
            text = pdf_data["text"][:5000]
            parts.append(f"\nDocument Text:\n{text}")
        else:
            preview = meta.get("preview", [])
            if preview:
                parts.append(f"\nData Preview: {json.dumps(preview[:10], default=str)}")
    
    # Add conversation history
    messages = session.get("messages", [])
    if messages:
        parts.append("\nConversation History:")
        for msg in messages[-10:]:  # Last 10 messages
            role = msg["role"].upper()
            content = msg["content"][:500]
            parts.append(f"{role}: {content}")
    
    return "\n".join(parts)

def extract_plotly_charts(text: str) -> list[str]:
    """Extract Plotly JSON from code blocks in the response."""
    import re
    charts = []
    
    # Match ```plotly ... ``` blocks
    patterns = [
        r'```plotly\s*\n([\s\S]*?)```',
        r'```json\s*\n(\{[\s\S]*?"data"[\s\S]*?\})```',
    ]
    
    for pattern in patterns:
        for match in re.finditer(pattern, text):
            try:
                chart_json = match.group(1).strip()
                parsed = json.loads(chart_json)
                # Validate it's a plotly chart
                if isinstance(parsed, dict) and ("data" in parsed or "layout" in parsed):
                    charts.append(json.dumps(parsed))
            except json.JSONDecodeError:
                pass
    
    return charts

def clean_plotly_from_text(text: str) -> str:
    """Remove plotly/json code blocks from response text."""
    import re
    text = re.sub(r'```plotly\s*\n[\s\S]*?```', '', text)
    text = re.sub(r'```json\s*\n\{[\s\S]*?"data"[\s\S]*?\}```', '', text)
    return text.strip()

def generate_default_charts(df: pd.DataFrame) -> tuple[list[str], list[dict]]:
    """Generate deterministic fallback charts from dataframe."""
    charts: list[str] = []
    visuals: list[dict] = []
    try:
        col_l = {c.lower(): c for c in df.columns}
        numeric_cols = [c for c in df.columns if pd.api.types.is_numeric_dtype(df[c])]
        cat_cols = [c for c in df.columns if (df[c].dtype == "object" or str(df[c].dtype) == "category")]

        def pick_col(candidates: list[str], pool: list[str]) -> Optional[str]:
            for col in pool:
                cl = col.lower()
                if any(token in cl for token in candidates):
                    return col
            return None

        value_col = pick_col(["revenue", "sales", "amount", "price", "value"], numeric_cols) or (numeric_cols[0] if numeric_cols else None)
        qty_col = pick_col(["qty", "quantity", "units", "volume"], numeric_cols)
        customer_col = pick_col(["customer", "client", "account", "buyer"], cat_cols)
        product_col = pick_col(["product", "item", "sku", "category"], cat_cols)
        region_col = pick_col(["region", "state", "city", "market", "territory"], cat_cols)

        date_col = None
        for c in df.columns:
            if "date" in c.lower() or "month" in c.lower() or "time" in c.lower():
                date_col = c
                break

        # 1) Time trend chart (if date + value exist)
        if date_col and value_col:
            tmp = df[[date_col, value_col]].copy()
            tmp[date_col] = pd.to_datetime(tmp[date_col], errors="coerce")
            tmp = tmp.dropna(subset=[date_col])
            if not tmp.empty:
                by_month = (
                    tmp.assign(period=tmp[date_col].dt.to_period("M").astype(str))
                    .groupby("period", as_index=False)[value_col]
                    .sum()
                    .sort_values("period")
                )
                if not by_month.empty:
                    fig = px.bar(by_month, x="period", y=value_col, title=f"{value_col} Trend by Month")
                    fig.update_layout(xaxis_title="Month", yaxis_title=value_col)
                    charts.append(json.dumps(fig.to_plotly_json(), cls=PlotlyJSONEncoder))
                    visuals.append({
                        "title": f"{value_col} Trend by Month",
                        "description": f"Monthly movement in {value_col}",
                        "chart_index": len(charts) - 1,
                    })

        # 2) Top customer/product/region contributors
        dim_col = customer_col or product_col or region_col or (cat_cols[0] if cat_cols else None)
        if dim_col and value_col:
            grouped = df.groupby(dim_col, dropna=False)[value_col].sum().reset_index().sort_values(value_col, ascending=False).head(10)
            if not grouped.empty:
                fig = px.bar(grouped, x=dim_col, y=value_col, title=f"Top {dim_col} by {value_col}")
                charts.append(json.dumps(fig.to_plotly_json(), cls=PlotlyJSONEncoder))
                visuals.append({
                    "title": f"Top {dim_col} by {value_col}",
                    "description": f"Concentration of {value_col} across {dim_col}",
                    "chart_index": len(charts) - 1,
                })

        # 3) Distribution of a key metric (parser-friendly explicit x/y)
        dist_col = value_col or qty_col or (numeric_cols[0] if numeric_cols else None)
        if dist_col:
            s = df[dist_col].dropna()
            if not s.empty:
                try:
                    binned = pd.qcut(s, q=min(10, s.nunique()), duplicates="drop")
                except Exception:
                    binned = pd.cut(s, bins=min(10, max(3, int(s.nunique()))), include_lowest=True)
                dist = binned.value_counts().sort_index()
                dist_df = pd.DataFrame({"bin": [str(idx) for idx in dist.index], "count": dist.values})
                fig = px.bar(dist_df, x="bin", y="count", title=f"Distribution of {dist_col}")
                fig.update_layout(xaxis_title=dist_col, yaxis_title="Count")
                charts.append(json.dumps(fig.to_plotly_json(), cls=PlotlyJSONEncoder))
                visuals.append({
                    "title": f"Distribution of {dist_col}",
                    "description": f"Binned frequency distribution for {dist_col}",
                    "chart_index": len(charts) - 1,
                })
    except Exception:
        pass

    return charts, visuals

def build_structural_summary(df: pd.DataFrame, filename: str) -> str:
    """Create a rich markdown fallback summary when AI service is unavailable."""
    rows = len(df)
    cols = len(df.columns)
    numeric_df = df.select_dtypes(include=["number"])
    numeric_cols = list(numeric_df.columns)
    missing_total = int(df.isnull().sum().sum())

    key_stats = []
    for col in numeric_cols[:3]:
        series = numeric_df[col].dropna()
        if not series.empty:
            key_stats.append(
                f"- **{col}**: min {series.min():,.2f}, max {series.max():,.2f}, mean {series.mean():,.2f}"
            )

    top_levels = []
    cat_cols = [c for c in df.columns if (df[c].dtype == "object" or str(df[c].dtype) == "category")]
    if cat_cols:
        c = cat_cols[0]
        vc = df[c].astype(str).value_counts().head(3)
        if not vc.empty:
            top_levels.append(
                f"- **Top {c} values**: " + ", ".join([f"{k} ({v})" for k, v in vc.items()])
            )

    stats_block = "\n".join(key_stats) if key_stats else "- No numeric columns available for statistical profiling."
    pattern_block = "\n".join(top_levels) if top_levels else "- Categorical pattern extraction is limited for this dataset."

    completeness_pct = 100.0
    if rows > 0 and cols > 0:
        completeness_pct = max(0.0, 100.0 - ((missing_total / float(rows * cols)) * 100.0))

    quality_notes = []
    if missing_total == 0:
        quality_notes.append("- No missing values detected across the current dataset snapshot.")
    else:
        quality_notes.append(f"- Missing-value load is **{missing_total:,}** cells (~{100.0 - completeness_pct:.2f}% of all cells).")
    quality_notes.append(f"- Dataset completeness is approximately **{completeness_pct:.2f}%**.")

    outlier_note = "- Outlier scan unavailable (insufficient numeric depth)."
    if numeric_cols:
        c = numeric_cols[0]
        s = numeric_df[c].dropna()
        if len(s) >= 5:
            q1, q3 = s.quantile(0.25), s.quantile(0.75)
            iqr = q3 - q1
            if iqr > 0:
                lower = q1 - 1.5 * iqr
                upper = q3 + 1.5 * iqr
                outliers = int(((s < lower) | (s > upper)).sum())
                outlier_note = f"- Outlier scan on **{c}** found **{outliers}** potential outliers using IQR bounds ({lower:,.2f} to {upper:,.2f})."

    # Business concentration estimates
    concentration_note = "- Concentration analysis is limited because no suitable categorical business dimension was identified."
    cat_cols = [c for c in df.columns if (df[c].dtype == "object" or str(df[c].dtype) == "category")]
    if cat_cols and numeric_cols:
        best_cat = cat_cols[0]
        best_num = numeric_cols[0]
        grouped = df.groupby(best_cat, dropna=False)[best_num].sum().sort_values(ascending=False)
        if not grouped.empty and grouped.sum() != 0:
            top3_share = float(grouped.head(3).sum() / grouped.sum()) * 100.0
            concentration_note = (
                f"- Top 3 **{best_cat}** entities contribute approximately **{top3_share:.2f}%** "
                f"of aggregated **{best_num}**, indicating {'high' if top3_share >= 60 else 'moderate'} concentration."
            )

    return f"""### Executive Summary
This report provides a **McKinsey-style structural assessment** of **{filename}**, focusing on performance signals, quality constraints, and action-oriented implications.  
At current scale, the dataset supports directional decision-making and prioritization analysis, provided metric definitions are validated with business owners.

### 1) Dataset Scope and Coverage
- **Rows**: {rows:,}
- **Columns**: {cols}
- **Numeric Columns**: {len(numeric_cols)}
- **Missing Values**: {missing_total:,}

### 2) Statistical Profile
{stats_block}

### 3) Data Quality and Reliability
{chr(10).join(quality_notes)}
{outlier_note}

### 4) Pattern Highlights
{pattern_block}
{concentration_note}

### 5) Senior Analyst Recommendations
- Validate metric semantics (e.g., IDs vs true measures) before using aggregates in executive decisions.
- Prioritize trend segmentation by customer, product, region, and time to isolate value drivers and variance sources.
- Investigate outliers and sparsity before forecasting or anomaly workflows.
- Build a 30/60/90-day analytics roadmap: (1) KPI stabilization, (2) driver decomposition, (3) scenario and sensitivity modelling.
"""

# ── Health ────────────────────────────────────────────────────────────────────
@app.get("/")
async def root():
    return {"status": "ok", "service": "DataBrix API", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy", "gemini_configured": bool(GEMINI_API_KEY)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
