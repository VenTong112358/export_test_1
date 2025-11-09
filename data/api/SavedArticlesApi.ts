import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from './ApiConfig';

export interface SavedArticle {
  id: number;
  title: string;
  content: string;
  saved_at: string;
  user_id: number;
}

export class SavedArticlesApi {
  private static instance: SavedArticlesApi;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): SavedArticlesApi {
    if (!SavedArticlesApi.instance) {
      SavedArticlesApi.instance = new SavedArticlesApi();
    }
    return SavedArticlesApi.instance;
  }

  // 获取用户收藏的文章
  public async getSavedArticles(): Promise<SavedArticle[]> {
    try {
      const response = await this.httpClient.get<SavedArticle[]>(API_ENDPOINTS.SAVED_ARTICLE);
      return response || [];
    } catch (error) {
      console.error('[SavedArticlesApi] Error fetching saved articles:', error);
      throw error;
    }
  }
 

  // 收藏文章
  public async saveArticle(articleData: { title: string; content: string }): Promise<any> {
    try {
      const response = await this.httpClient.post(API_ENDPOINTS.SAVED_ARTICLE, articleData);
      return response;
    } catch (error) {
      console.error('[SavedArticlesApi] Error saving article:', error);
      throw error;
    }
  }

  // 取消收藏文章
  public async unsaveArticle(articleId: number): Promise<any> {
    try {
      const response = await this.httpClient.delete(`${API_ENDPOINTS.SAVED_ARTICLE}/${articleId}`);
      return response;
    } catch (error) {
      console.error('[SavedArticlesApi] Error unsaving article:', error);
      throw error;
    }
  }
}