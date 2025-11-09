import { HttpClient } from './HttpClient';
import { API_CONFIG, API_ENDPOINTS } from './ApiConfig';

export interface SpeakApiOptions {
  word: string;
  voice?: string;
}

export class SpeakApi {
  private static instance: SpeakApi;
  private httpClient: HttpClient;
  private baseURL: string;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
    this.baseURL = API_CONFIG.BASE_URL;
  }

  public static getInstance(): SpeakApi {
    if (!SpeakApi.instance) {
      SpeakApi.instance = new SpeakApi();
    }
    return SpeakApi.instance;
  }

  /**
   * 获取TTS音频流URL
   * @param options { word: string, voice?: string }
   * @returns 返回音频流的URL（audio/wav）
   */
//   public async getSpeechUrl(options: SpeakApiOptions): Promise<string> {
//     const { word, voice } = options;
//
//     try {
//       // 构建URL参数
//       const params = new URLSearchParams({
//         word: encodeURIComponent(word),
//         ...(voice && { voice })
//       });
//
//       // 获取认证token
//       const token = this.httpClient.getAccessToken();
//       const authParam = token ? `&token=${encodeURIComponent(token)}` : '';
//
//       // 返回带认证的音频URL
//       return `${this.baseURL}${API_ENDPOINTS.SPEAK}?${params.toString()}${authParam}`;
//     } catch (error) {
//       console.error('[SpeakApi] Error generating speech URL:', error);
//       throw error;
//     }
//   }
  public async getSpeechUrl(options: SpeakApiOptions): Promise<string> {
    const { word, voice } = options;

    try {
      // 构建URL参数
      const params = new URLSearchParams({
        word: encodeURIComponent(word),
        ...(voice && { voice })
      });



      // 获取认证token
      const token = this.httpClient.getAccessToken();
      const authParam = token ? `/token=${encodeURIComponent(token)}` : '';

      // 返回带认证的音频URL
      return `${this.baseURL}${API_ENDPOINTS.SPEAK}2?${params.toString()}`;
    } catch (error) {
      console.error('[SpeakApi] Error generating speech URL:', error);
      throw error;
    }
  }
}