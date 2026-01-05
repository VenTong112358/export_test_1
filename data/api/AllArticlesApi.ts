import { API_ENDPOINTS } from './ApiConfig';
import { HttpClient } from './HttpClient';

export interface AllArticle {
  id: number;
  log_id: number;
  english_title: string;
  chinese_title: string;
  date: string;
  status: 'learning' | 'learned';
  tag?: string;
  CEFR?: string;
  daily_new_words_count?: number;
  daily_reviewed_words_count?: number;
}

export class AllArticlesApi {
  private static instance: AllArticlesApi;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): AllArticlesApi {
    if (!AllArticlesApi.instance) {
      AllArticlesApi.instance = new AllArticlesApi();
    }
    return AllArticlesApi.instance;
  }

  // 获取用户的所有文章
  public async getAllArticles(): Promise<AllArticle[]> {
    try {
      const response = await this.httpClient.get<AllArticle[]>(API_ENDPOINTS.ALL_ARTICLE);
      return response || [];
    } catch (error) {
      console.error('[AllArticlesApi] Error fetching all articles:', error);
      throw error;
    }
  }
}

