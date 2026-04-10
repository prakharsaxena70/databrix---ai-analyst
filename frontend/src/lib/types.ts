export interface ColumnInfo {
  name: string;
  dtype: string;
  null_count: number;
}

export interface DataPreview {
  shape: { rows: number; columns: number };
  columns: ColumnInfo[];
  preview: Record<string, string>[];
}

export interface PDFImage {
  page: number;
  index: number;
  format: string;
  base64: string;
  size: number;
}

export interface PDFPage {
  page: number;
  base64: string;
  width: number;
  height: number;
}

export interface PDFData {
  images_count: number;
  images: PDFImage[];
  pages: PDFPage[];
  text: string;
}

export interface UploadResponse {
  session_id: string;
  filename: string;
  preview: DataPreview;
  pdf_data?: PDFData;
}

export interface ReportData {
  title: string;
  summary?: string;
  description?: string;
  table_title?: string;
  columns?: string[];
  rows?: Record<string, string | number | boolean | null>[];
  metrics?: Array<{ label: string; value: string; icon?: "hash" | "dollar" | "chart" | "user" | "clock" | "star" }>;
  kpis?: Array<{ label: string; value: string }>;
  visuals?: Array<{ title: string; description: string; chart_index: number }>;
}

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
  plotly_json?: string | null;
  charts?: string[] | null; 
  code?: string | null;
  report?: ReportData | null;
  created_at?: string | null;
}

export interface ChatResponse {
  text: string;
  plotly_json?: string | null;
  charts?: string[] | null;
  code?: string | null;
  report?: ReportData | null;
}

export interface SessionData {
  id: string;
  session_id?: string;
  filename: string;
  nickname?: string | null;
  is_starred?: boolean;
  file_meta?: {
    filename?: string;
    size?: number;
    extension?: string;
    shape?: { rows: number; columns: number };
    columns?: ColumnInfo[];
    preview?: Record<string, string>[];
    pdf_data?: PDFData;
  };
  messages?: ChatMessage[];
  created_at?: string | null;
}

export interface StoredSession {
  id: string;
  filename: string;
  nickname?: string | null;
  is_starred?: boolean;
  created_at?: string | null;
  file_meta?: {
    shape?: { rows: number; columns: number };
    pdf_data?: PDFData;
  };
}

// Auth Types
export interface User {
  id: string;
  email: string;
  full_name?: string | null;
  is_active: boolean;
  created_at: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface AuthCheckResponse {
  is_authenticated: boolean;
  user?: User;
}
