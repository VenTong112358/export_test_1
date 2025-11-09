import { HttpClient } from './HttpClient';
import { API_ENDPOINTS } from './ApiConfig';

export interface SentenceFavoriteRequest {
  content: string;
  translation: string;
  explication?: string;
  log_id: number;
  note?: string;
}

export interface SentenceFavoriteResponse {
  message: string;
  saved_phrase_id: number;
}

export interface UnsaveSentenceRequest {
  saved_phrase_id: number;
}

export interface UnsaveSentenceResponse {
  message: string;
  saved_phrase_id: number;
}

export interface SavedSentence {
  id: number;
  content: string;
  translation: string;
  explication?: string;
  log_id: number;
  note?: string;
  created_at: string;
  article_title?: string;
}

// 新增：按文章分组的收藏句子接口
export interface ArticleWithSavedSentences {
  log_id: number;
  article_title: string;
  created_at: string;
  saved_sentences: SavedSentence[];
}

// 新增：按月份分组的文章接口
export interface MonthlyArticleGroup {
  month: string; // 格式: "2025-01"
  articles: ArticleWithSavedSentences[];
}

/**
 * 句子收藏API类
 * 处理句子的收藏、取消收藏和获取收藏列表
 */
export class SentenceFavoriteApi {
  private static instance: SentenceFavoriteApi;
  private httpClient: HttpClient;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
  }

  public static getInstance(): SentenceFavoriteApi {
    if (!SentenceFavoriteApi.instance) {
      SentenceFavoriteApi.instance = new SentenceFavoriteApi();
    }
    return SentenceFavoriteApi.instance;
  }

  /**
   * 收藏句子
   * @param request 收藏请求数据
   * @returns 收藏响应
   */
  public async saveSentence(request: SentenceFavoriteRequest): Promise<SentenceFavoriteResponse> {
    try {
      console.log('🔍 [SentenceFavoriteApi] Saving sentence:', request);
      const response = await this.httpClient.post<SentenceFavoriteResponse>(
        API_ENDPOINTS.SAVE_PHRASE,
        request
      );
      console.log('✅ [SentenceFavoriteApi] Save sentence success:', response);
      return response;
    } catch (error) {
      console.error('❌ [SentenceFavoriteApi] Save sentence error:', error);
      throw error;
    }
  }

  /**
   * 取消收藏句子
   * @param savedPhraseId 收藏的短语ID
   * @returns 取消收藏响应
   */
  public async unsaveSentence(savedPhraseId: number): Promise<UnsaveSentenceResponse> {
    try {
      console.log('🔍 [SentenceFavoriteApi] Unsaving sentence:', savedPhraseId);
      const response = await this.httpClient.delete<UnsaveSentenceResponse>(
        API_ENDPOINTS.UNSAVE_PHRASE,
        { saved_phrase_id: savedPhraseId }
      );
      console.log('✅ [SentenceFavoriteApi] Unsave sentence success:', response);
      return response;
    } catch (error) {
      console.error('❌ [SentenceFavoriteApi] Unsave sentence error:', error);
      throw error;
    }
  }

  /**
   * 获取用户收藏的句子列表
   * @returns 收藏的句子列表
   */
  // 获取用户收藏的句子 - 确保使用JWT token中的user_id
  public async getSavedSentences(): Promise<SavedSentence[]> {
    try {
      // user_id会从JWT token中自动获取
      const response = await this.httpClient.get<SavedSentence[]>(API_ENDPOINTS.SAVED_PHRASES);
      return response || [];
    } catch (error) {
      console.error('[SentenceFavoriteApi] Error fetching saved sentences:', error);
      throw error;
    }
  }

  /**
   * 获取按文章分组的收藏句子
   * @returns 按文章分组的收藏句子数据
   */
  public async getSavedSentencesByArticle(): Promise<ArticleWithSavedSentences[]> {
    try {
      console.log('🔍 [SentenceFavoriteApi] Fetching saved sentences by article');
      const response = await this.httpClient.get<any[]>(API_ENDPOINTS.SAVED_PHRASES);
      
      console.log('🔍 [SentenceFavoriteApi] Raw API response:', response);
      
      // 检查响应数据格式
      if (!response || !Array.isArray(response)) {
        console.warn('❌ [SentenceFavoriteApi] Invalid response format:', response);
        return [];
      }
      
      // 转换API响应格式为ArticleWithSavedSentences格式
      const articleGroups: ArticleWithSavedSentences[] = response.map(item => {
        const savedSentences: SavedSentence[] = (item.phrases || []).map((phrase: any) => ({
          id: phrase.id || 0,
          content: phrase.content || '',
          translation: phrase.translation || '',
          explication: phrase.explication || '',
          log_id: item.log_id || 0,
          note: phrase.note || null,
          created_at: item.date || '',
          article_title: item.english_title || item.chinese_title || `文章 ${item.log_id}`
        }));
        
        return {
          log_id: item.log_id || 0,
          article_title: item.english_title || item.chinese_title || `文章 ${item.log_id}`,
          created_at: item.date || '',
          saved_sentences: savedSentences
        };
      }).filter(article => article.saved_sentences.length > 0); // 只保留有收藏句子的文章
      
      console.log('✅ [SentenceFavoriteApi] Converted article groups:', articleGroups);
      return articleGroups;
    } catch (error) {
      console.error('❌ [SentenceFavoriteApi] Error fetching saved sentences by article:', error);
      throw error;
    }
  }

  /**
   * 将收藏句子按文章分组
   * @param sentences 收藏句子列表
   * @returns 按文章分组的数据
   */
  private groupSentencesByArticle(sentences: SavedSentence[]): ArticleWithSavedSentences[] {
    const articleMap = new Map<number, ArticleWithSavedSentences>();
    
    sentences.forEach(sentence => {
      // 添加空值检查
      if (!sentence.created_at) {
        console.warn('Sentence missing created_at:', sentence);
        return; // 跳过没有创建时间的句子
      }
      
      if (!articleMap.has(sentence.log_id)) {
        articleMap.set(sentence.log_id, {
          log_id: sentence.log_id,
          article_title: sentence.article_title || `文章 ${sentence.log_id}`,
          created_at: sentence.created_at,
          saved_sentences: []
        });
      }
      articleMap.get(sentence.log_id)!.saved_sentences.push(sentence);
    });
    
    return Array.from(articleMap.values()).sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
  }

  /**
   * 将文章按月份分组
   * @param articles 文章列表
   * @returns 按月份分组的文章数据
   */
  public groupArticlesByMonth(articles: ArticleWithSavedSentences[]): MonthlyArticleGroup[] {
    const monthMap = new Map<string, ArticleWithSavedSentences[]>();
    
    articles.forEach(article => {
      // 添加空值检查，防止 substring 调用失败
      if (!article.created_at) {
        console.warn('Article missing created_at:', article);
        return; // 跳过没有创建时间的文章
      }
      const month = article.created_at.substring(0, 7); // 提取 "YYYY-MM"
      if (!monthMap.has(month)) {
        monthMap.set(month, []);
      }
      monthMap.get(month)!.push(article);
    });
    
    return Array.from(monthMap.entries())
      .map(([month, articles]) => ({ month, articles }))
      .sort((a, b) => b.month.localeCompare(a.month)); // 按月份降序排列
  }
}