// sentenceApi.ts
// Class-based API with WebSocket callers and graceful HttpClient fallback.
// Provides singleton getInstance() method for Redux thunk integration.
//
// DEBUGGING:
// This module now includes comprehensive logging with [WebSocket] prefix.
// Check console logs in this order when debugging connection issues:
// 1. "[WebSocket] Connecting to:" - Shows the full WebSocket URL
// 2. "[WebSocket] Payload:" - Shows the exact JSON being sent
// 3. "[WebSocket] Connection opened" - Connection established
// 4. "[WebSocket] Sending payload:" - Payload transmission attempt
// 5. "[WebSocket] Received message:" - Incoming data chunks
// 6. "[WebSocket] Connection closed" - Disconnection with code/reason
//
// Common issues:
// - "Connection closed with no data received" + Fast close = Server rejected the connection/payload
// - "Error sending payload" = Invalid payload format
// - "Server error:" = Server returned error message
// - No "[WebSocket] Received message:" logs = Server not sending data back

import { Platform } from "react-native";
import { API_CONFIG } from "./ApiConfig"; // <-- adjust if your config path differs
import { HttpClient } from "./HttpClient";

// --- Request/Response Types ---
export interface SentenceTranslationRequest {
  content: string;
}

export interface SentenceAnalysisRequest {
  content: string;
}

type OnToken = (textChunk: string) => void;
type MaybeBody = string | { content: string };
type WSOptions = { signal?: AbortSignal };

// --- helpers ---
function httpToWs(url: string): string {
  if (url.startsWith("https://")) return "wss://" + url.slice("https://".length);
  if (url.startsWith("http://")) return "ws://" + url.slice("http://".length);
  return url; // already ws/wss
}
function joinUrl(base: string, path: string): string {
  const b = base.endsWith("/") ? base.slice(0, -1) : base;
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${b}${p}`;
}
function adaptForEmu(url: string): string {
  return Platform.OS === "android" ? url.replace("://localhost", "://10.0.2.2") : url;
}

/** Get JWT: prefer API_CONFIG.HEADERS.Authorization, fallback to HttpClient.getInstance() if available */
function getAuthToken(): string {
  // 1) Prefer API config header (works even if HttpClient export is undefined)
  const hdrAuth = (API_CONFIG as any)?.HEADERS?.Authorization || (API_CONFIG as any)?.HEADERS?.authorization;
  if (hdrAuth && typeof hdrAuth === "string" && hdrAuth.trim()) {
    // Accept "Bearer XXX" or raw token
    return hdrAuth.toLowerCase().startsWith("bearer ")
      ? hdrAuth.slice(7).trim()
      : hdrAuth.trim();
  }

  // 2) Fallback: try HttpClient.getInstance().getAccessToken() if present
  try {
    const hc = HttpClient.getInstance();
    const tok = hc?.getAccessToken?.();
    if (tok && typeof tok === "string") return tok;
  } catch {
    // ignore — we'll throw a clean error below
  }

  throw new Error("Not authenticated: missing access token");
}

/** Get base URL: prefer API_CONFIG.BASE_URL; fallback to env if available */
function getBaseUrl(): string {
  const fromConfig = (API_CONFIG as any)?.BASE_URL;
  if (fromConfig && typeof fromConfig === "string") return fromConfig;

  const fromEnv = (process as any)?.env?.API_BASE_URL as string | undefined;
  if (fromEnv) return fromEnv;

  throw new Error("Missing API base URL");
}

async function openWsAndStream(
  wsUrl: string,
  bearerToken: string,
  firstPayload: Record<string, unknown>,
  onToken?: OnToken,
  options?: WSOptions
): Promise<string> {
  console.log('[WebSocket] Connecting to:', wsUrl);
  console.log('[WebSocket] Payload:', JSON.stringify(firstPayload));

  return await new Promise<string>((resolve, reject) => {
    let buffer = "";
    let aborted = false;
    let resolved = false;

    const signal = options?.signal;

    // Setup abort handler FIRST
    const abortHandler = () => {
      console.log('[WebSocket] Abort signal received');
      aborted = true;
      try { 
        (ws as any).close?.(4000, "aborted"); 
      } catch (e) {
        console.warn('[WebSocket] Error closing on abort:', e);
      }
    };

    if (signal) {
      signal.addEventListener("abort", abortHandler);
    }

    const cleanup = () => {
      try {
        (ws as any).onopen = null;
        (ws as any).onmessage = null;
        (ws as any).onerror = null;
        (ws as any).onclose = null;
        if (signal) signal.removeEventListener("abort", abortHandler);
      } catch (e) {
        console.warn('[WebSocket] Error during cleanup:', e);
      }
    };

    const finalize = (result: string | null, error: Error | null) => {
      if (resolved) {
        console.warn('[WebSocket] Already resolved, ignoring:', error ? `error: ${error.message}` : `result: ${result?.substring(0, 50)}`);
        return;
      }
      resolved = true;
      cleanup();

      if (error) {
        console.error('[WebSocket] Rejecting with error:', error.message);
        reject(error);
      } else {
        console.log('[WebSocket] Resolving with result length:', result?.length ?? 0);
        resolve(result || "");
      }
    };

    // Create WebSocket
    let ws: WebSocket;
    try {
      ws = new (WebSocket as any)(
        wsUrl,
        undefined,
        { headers: { Authorization: `Bearer ${bearerToken}` } }
      );
      console.log('[WebSocket] WebSocket object created');
    } catch (e) {
      console.error('[WebSocket] Failed to create WebSocket:', e);
      finalize(null, e instanceof Error ? e : new Error(String(e)));
      return;
    }

    // Setup event handlers BEFORE connection might fire events
    (ws as any).onopen = () => {
      console.log('[WebSocket] Connection opened');
      if (aborted) {
        console.log('[WebSocket] Aborted, closing connection');
        try { (ws as any).close?.(); } catch {}
        return;
      }

      try {
        const payload = JSON.stringify(firstPayload);
        console.log('[WebSocket] Sending payload:', payload);
        (ws as any).send(payload);
        console.log('[WebSocket] Payload sent successfully');
      } catch (e) {
        console.error('[WebSocket] Error sending payload:', e);
        cleanup();
        finalize(null, e instanceof Error ? e : new Error(String(e)));
      }
    };

    (ws as any).onmessage = (evt: any) => {
      try {
        const data = String(evt?.data ?? "");
        console.log('[WebSocket] Received message:', data.substring(0, 100));

        if (data === "[END]") {
          console.log('[WebSocket] Stream ended');
          cleanup();
          try { (ws as any).close?.(); } catch {}
          finalize(buffer, null);
          return;
        }

        if (data.startsWith("Error:") || data.startsWith("error:")) {
          console.error('[WebSocket] Server error:', data);
          cleanup();
          try { (ws as any).close?.(1011, "server error"); } catch {}
          finalize(null, new Error(data));
          return;
        }

        buffer += data;
        console.log('[WebSocket] Buffer length:', buffer.length);

        if (onToken) {
          try {
            onToken(data);
          } catch (e) {
            console.warn('[WebSocket] Error in onToken callback:', e);
          }
        }
      } catch (e) {
        console.error('[WebSocket] Error in onmessage handler:', e);
      }
    };

    (ws as any).onerror = (e: any) => {
      console.error('[WebSocket] Connection error:', e?.message || String(e));
      cleanup();
      finalize(null, new Error(e?.message || "WebSocket error"));
    };

    (ws as any).onclose = (closeEvent?: any) => {
      console.log('[WebSocket] Connection closed. Code:', closeEvent?.code, 'Reason:', closeEvent?.reason);
      
      if (resolved) {
        console.log('[WebSocket] Already resolved in onclose');
        return;
      }

      // If we already got [END], the connection closing is normal
      // Otherwise, resolve with whatever data we have
      if (!aborted && buffer.length > 0 && !buffer.endsWith("[END]")) {
        console.log('[WebSocket] Server closed without [END], but we have data. Resolving with partial data.');
        finalize(buffer, null);
        return;
      }

      if (buffer.length === 0) {
        console.warn('[WebSocket] Connection closed with no data received');
        finalize("", null);
      } else {
        cleanup();
      }
    };

    console.log('[WebSocket] Event handlers set up, waiting for connection...');
  });
}

// --- SentenceTranslationApi Class ---
export class SentenceTranslationApi {
  private static instance: SentenceTranslationApi;

  private constructor() {}

  /**
   * Get singleton instance
   */
  public static getInstance(): SentenceTranslationApi {
    if (!SentenceTranslationApi.instance) {
      SentenceTranslationApi.instance = new SentenceTranslationApi();
    }
    return SentenceTranslationApi.instance;
  }

  /**
   * Get sentence explanation (with category for user context)
   * Maps to /content_search/{category} endpoint
   */
  public async getSentenceTranslation(
    userId: number,
    request: SentenceTranslationRequest,
    onToken?: OnToken,
    abortController?: AbortController
  ): Promise<string> {
    const category = `sentence`;
    const baseUrl = getBaseUrl();
    const token = getAuthToken();

    let url = joinUrl(baseUrl, `/content_search2/${encodeURIComponent(category)}`);
    url = httpToWs(url);
    url = adaptForEmu(url);

    return openWsAndStream(
      url,
      token,
      { content: request.content },
      onToken,
      abortController ? { signal: abortController.signal } : undefined
    );
  }

  /**
   * Get sentence translation (phrase explanation)
   * Maps to /phrase_explanation endpoint
   */
  public async getSentenceExplanation(
    category: string,
    request: SentenceAnalysisRequest,
    onToken?: OnToken,
    abortController?: AbortController
  ): Promise<string> {
    const baseUrl = getBaseUrl();
    const token = getAuthToken();

    let url = joinUrl(baseUrl, `/phrase_explanation2`);
    url = httpToWs(url);
    url = adaptForEmu(url);

    return openWsAndStream(
      url,
      token,
      { content: request.content },
      onToken,
      abortController ? { signal: abortController.signal } : undefined
    );
  }
}
