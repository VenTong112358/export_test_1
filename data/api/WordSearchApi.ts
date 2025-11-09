import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from './ApiConfig';

export interface WordSearchResponse {
  definition: string;
  review: 'oui' | 'none';
}

/**
 * 单词搜索API类
 * 使用HttpClient进行HTTP请求，自动处理JWT认证和token刷新
 */
export class WordSearchApi {
  private static instance: WordSearchApi;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): WordSearchApi {
    if (!WordSearchApi.instance) {
      WordSearchApi.instance = new WordSearchApi();
    }
    return WordSearchApi.instance;
  }

  /**
   * 搜索单词中文定义
   * @param logId 学习日志ID
   * @param word 要搜索的单词
   * @returns 单词搜索响应
   */
  public async searchWord(logId: number, word: string): Promise<WordSearchResponse> {
    try {
      const response = await this.httpClient.get<string>(
        API_ENDPOINTS.WORD_SEARCH(logId, word)
      );
      
      return {
        definition: response,
        review: response === 'oui' ? 'oui' : 'none',
      };
    } catch (error: any) {
      console.error('[WordSearchApi] Word search failed for word:', word, error);
      throw error;
    }
  }

  /**
   * 搜索单词英文定义
   * @param logId 学习日志ID
   * @param word 要搜索的单词
   * @returns 单词搜索响应
   */
  public async searchWordEnglish(logId: number, word: string): Promise<WordSearchResponse> {
    try {
      const response = await this.httpClient.get<string>(
        API_ENDPOINTS.ENGLISH_WORD_SEARCH(logId, word)
      );
      
      return {
        definition: response,
        review: response === 'oui' ? 'oui' : 'none',
      };
    } catch (error: any) {
      console.error('[WordSearchApi] English word search failed for word:', word, error);
      throw error;
    }
  }
}