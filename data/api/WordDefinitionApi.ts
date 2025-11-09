import { HttpClient } from './HttpClient';
import { Alert } from 'react-native';
import { API_ENDPOINTS } from './ApiConfig';

export interface WordDefinitionResponse {
  word: string;
  definition: string;
  distractors: string[];
}

/**
 * 单词定义API类
 * 使用HttpClient进行HTTP请求，自动处理JWT认证和token刷新
 */
export class WordDefinitionApi {
  private static instance: WordDefinitionApi;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): WordDefinitionApi {
    if (!WordDefinitionApi.instance) {
      WordDefinitionApi.instance = new WordDefinitionApi();
    }
    return WordDefinitionApi.instance;
  }

  /**
   * 查询单词释义与干扰项
   * @param wordId - 单词ID（数字类型）
   */
  public async getDefinitionAndDistractors(wordId: number): Promise<WordDefinitionResponse> {
    try {
      const response = await this.httpClient.get<WordDefinitionResponse>(
        API_ENDPOINTS.DEFINITION(wordId)
      );
      return response;
    } catch (error: any) {
      console.error('[WordDefinitionApi] 查询单词释义与干扰项失败:', wordId, error);
      
      // 处理HTTP错误
      if (error.status) {
        let errorMessage = error.message || 'Word definition failed';
        
        switch (error.status) {
          case 400:
            errorMessage = 'Invalid request data';
            break;
          case 404:
            errorMessage = 'Word not found';
            break;
          default:
            errorMessage = 'Unknown error occurred';
        }
        
        Alert.alert('错误', errorMessage);
        throw new Error(errorMessage);
      }
      
      throw new Error(error instanceof Error ? error.message : 'Word definition failed');
    }
  }
}