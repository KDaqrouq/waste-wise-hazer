// Typed client for the Flask backend (proxied from /api by Vite in development).

export interface Detection {
  class_id: number;
  class_name: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x1, y1, x2, y2] in image pixels
}

export interface DetectionResponse {
  success: boolean;
  id: number;
  detections: Detection[];
  annotated_image_url: string;
  total_detections: number;
  class_counts: Record<string, number>;
  confidence_threshold: number;
  processing_time: number;
  saved_as?: string;
}

export interface ModelMetrics {
  run: string;
  epochs: number;
  best_epoch: number;
  map50: number;
  map50_95: number;
  precision: number;
  recall: number;
}

export interface ModelInfo {
  source: string;
  custom: boolean;
  class_names: string[];
  metrics: ModelMetrics | null;
}

export interface HealthResponse {
  status: string;
  model: ModelInfo;
}

export interface HistoryItem {
  id: number;
  timestamp: string;
  image_filename: string;
  source: "camera" | "upload";
  total_detections: number;
  class_counts: Record<string, number>;
  processing_time: number | null;
  has_image: boolean;
}

export interface StatsResponse {
  total_images: number;
  total_items: number;
  class_totals: Record<string, number>;
  top_class: string | null;
  daily: { date: string; images: number; items: number }[];
  model: ModelInfo;
}

const OFFLINE_MESSAGE =
  "Can't reach the detection server. Start it with `python app.py` in the backend folder (or run start.bat).";

export class ApiError extends Error {
  constructor(message: string, readonly status?: number, readonly offline = false) {
    super(message);
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, init);
  } catch {
    throw new ApiError(OFFLINE_MESSAGE, undefined, true);
  }

  const isJson = response.headers.get("content-type")?.includes("application/json");
  const body = isJson ? await response.json().catch(() => null) : null;

  if (!response.ok || body?.success === false) {
    if (body?.error) throw new ApiError(body.error, response.status);
    // The Vite proxy answers with an empty 5xx when Flask isn't running
    if (response.status >= 500 || !isJson) throw new ApiError(OFFLINE_MESSAGE, response.status, true);
    throw new ApiError(`Request failed (${response.status})`, response.status);
  }
  return body as T;
}

export const api = {
  health: () => request<HealthResponse>("/api/health"),
  stats: () => request<StatsResponse>("/api/stats"),
  history: (limit = 6) => request<{ items: HistoryItem[] }>(`/api/history?limit=${limit}`),
  historyImageUrl: (id: number) => `/api/history/${id}/image`,

  detect: (image: File, confidence: number, source: "upload" | "camera") => {
    const form = new FormData();
    form.append("image", image);
    form.append("conf", String(confidence));
    const path = source === "camera" ? "/api/camera-capture" : "/api/predict";
    return request<DetectionResponse>(path, { method: "POST", body: form });
  },
};

const FRUIT_EMOJI: Record<string, string> = {
  apple: "🍎",
  tangerine: "🍊",
  pear: "🍐",
  watermelon: "🍉",
  lemon: "🍋",
  grape: "🍇",
  pineapple: "🍍",
  cantaloupe: "🍈",
  "korean melon": "🍈",
};

export const fruitLabel = (name: string) => (FRUIT_EMOJI[name] ? `${FRUIT_EMOJI[name]} ${name}` : name);
