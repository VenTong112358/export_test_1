import { httpClient } from './HttpClient';
import { API_ENDPOINTS } from './ApiConfig';

// API响应接口
interface SaveArticleResponse {
  log_id: number;
  save_status: 1 | 0; // 1表示已收藏，0表示未收藏
}

export class FavoriteApi {
  static async saveArticle(logId: string): Promise<SaveArticleResponse> {
    try {
      const logIdNum = parseInt(logId, 10);
      const endpoint = API_ENDPOINTS.SAVE_ARTICLE(logIdNum);
      console.log('🔍 [FavoriteApi] Save article endpoint:', endpoint);
      console.log('🔍 [FavoriteApi] LogId:', logId, 'LogIdNum:', logIdNum);
      
      // 根据API文档使用GET方法，需要JWT认证
      const response = await httpClient.get<SaveArticleResponse>(endpoint);
      console.log('✅ [FavoriteApi] Save article success:', response);
      return response;
    } catch (error) {
      console.error('❌ [FavoriteApi] Save article error:', error);
      throw error;
    }
  }

  static async unsaveArticle(logId: string): Promise<SaveArticleResponse> {
    try {
      const logIdNum = parseInt(logId, 10);
      const endpoint = API_ENDPOINTS.UNSAVE_ARTICLE(logIdNum);
      console.log('🔍 [FavoriteApi] Unsave article endpoint:', endpoint);
      console.log('🔍 [FavoriteApi] LogId:', logId, 'LogIdNum:', logIdNum);
      
      // 根据API文档使用GET方法，需要JWT认证
      const response = await httpClient.get<SaveArticleResponse>(endpoint);
      console.log('✅ [FavoriteApi] Unsave article success:', response);
      return response;
    } catch (error) {
      console.error('❌ [FavoriteApi] Unsave article error:', error);
      throw error;
    }
  }
}