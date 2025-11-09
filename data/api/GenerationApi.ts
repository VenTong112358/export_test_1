import { HttpClient } from './HttpClient';
import { Platform } from 'react-native';
import { GenerationResponse } from '@data/model/Generation';
import { API_CONFIG, API_ENDPOINTS } from './ApiConfig';

export class GenerationApi {
  private static instance: GenerationApi;
  private httpClient: HttpClient;
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.headers = API_CONFIG.HEADERS;
  }

  public static getInstance(): GenerationApi {
    if (!GenerationApi.instance) {
      GenerationApi.instance = new GenerationApi();
    }
    return GenerationApi.instance;
  }

  async generateArticle(logId: number): Promise<GenerationResponse> {
    // 此方法如果你的后端需要，还可以保留（非流式一次性返回型接口）
    try {
      // 通常这里还是POST/GET HTTP一次性返回接口
      // ... existing implementation ...
      // 具体见原内容
      return {
        success: true,
        content: 'Dummy',
      };
    } catch (error: any) {
      // ... error处理 ...
      return {
        success: false,
        error: 'Generation failed',
      };
    }
  }

  /**
   * WebSocket 版本的流式生成
   */
  async generateArticleStreamWS(
    logId: number,
    onChunk: (chunk: string) => void,
    onComplete: (fullContent: string) => void,
    onError: (error: string) => void,
    accessToken?: string
  ): Promise<void> {
    let ws: WebSocket | null = null;
    let fullContent = '';
    try {
      // 构造 ws url
      const base = API_CONFIG.WS_BASE_URL.replace(/\/$/, '');
      let url = `${base}/${logId}`;
      // 认证：web 端用 query，原生用 header（用 Platform.OS 判断！）
      console.log('[GenerationApi] Platform.OS:', Platform.OS);
      console.log('[GenerationApi] accessToken:', accessToken);
      if (Platform.OS === 'web' && accessToken) {
        // 浏览器端：token 拼在 URL param
        const qp = new URLSearchParams();
        qp.set('authorization', accessToken);
        qp.set('accesstoken', accessToken); // 兼容后端
        url += `?${qp.toString()}`;
        console.log('[GenerationApi] WebSocket URL (with token query):', url);
        ws = new WebSocket(url);
      } else if (accessToken) {
        // iOS/Android 真机/模拟器/原生端：token 放 header
        const RNWebSocket: any = WebSocket as any;
        console.log('[GenerationApi] WebSocket URL (native):', url);
        ws = new RNWebSocket(url, null, { headers: { Authorization: accessToken } });
      } else {
        ws = new WebSocket(url);
      }
      if (!ws) throw new Error('Failed to create WebSocket');
      ws.onopen = () => {
        try {
          // 连接建立后，立即发送 logId 启动推流
          ws.send(logId.toString());
        } catch (e) {
          onError('Failed to send logId after ws open');
          if (ws !== null) {
            ws.close();
            ws = null;
          }
        }
      };
      ws.onmessage = (event: any) => {
        const data = String(event.data ?? '');
        if (data === '[END]') {
          try { ws && ws.close(); } catch {}
          ws = null;
          onComplete(fullContent);
          return;
        }
        fullContent += data;
        onChunk(data);
      };
      ws.onerror = (e: any) => {
        onError('WebSocket error');
        if (ws !== null) {
          ws.close();
          ws = null;
        }
      };
      ws.onclose = (e: any) => {
        if (ws !== null) {
          ws = null;
          onComplete(fullContent);
        }
      };
    } catch (err: any) {
      onError(err?.message || 'WebSocket connection failed');
      if (ws !== null) {
        ws.close();
        ws = null;
      }
    }
  }

  async checkLogStatus(logId: number): Promise<{ ready: boolean; error?: string }> {
    try {
      // 保留或删去均可，看你是否还要用
      return { ready: true };
    } catch (error: any) {
      return {
        ready: false,
        error: error.message || 'Failed to check log status'
      };
    }
  }

  async finishReading(logId: number): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('[GenerationApi] Calling finish_reading API for logId:', logId);
      const endpoint = API_ENDPOINTS.FINISH_READING(logId);
      console.log('[GenerationApi] Finish reading endpoint:', endpoint);
      
      const response = await this.httpClient.post(endpoint, {});
      console.log('[GenerationApi] Finish reading API response:', response);
      
      return { success: true };
    } catch (error: any) {
      console.error('[GenerationApi] Finish reading API error:', error);
      return {
        success: false,
        error: error.message || 'Failed to finish reading'
      };
    }
  }
}