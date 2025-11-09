import { HttpClient } from './HttpClient';
import { API_CONFIG, API_ENDPOINTS } from './ApiConfig'; // 添加 API_ENDPOINTS 导入
import { DeepSeekClient } from './DeepSeekClient';

// Types
export interface ArticleRequest {
  difficulty: 'easy' | 'medium' | 'hard';
  topic?: string;
  length?: 'short' | 'medium' | 'long';
  language?: 'en' | 'zh';
}

export interface ArticleResponse {
  id: string;
  title: string;
  content: string;
  difficulty: 'easy' | 'medium' | 'hard';
  wordCount: number;
  estimatedReadingTime: number;
  words: WordAnalysis[];
}

export interface WordAnalysis {
  text: string;
  type: 'unlearned' | 'reviewing' | 'known';
  translation?: string;
  definition?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  frequency: number;
}

export interface TranslationRequest {
  text: string;
  from: 'en' | 'zh';
  to: 'en' | 'zh';
}

export interface TranslationResponse {
  originalText: string;
  translatedText: string;
  pronunciation?: string;
}

export class ArticleApi {
  private static instance: ArticleApi;
  private httpClient: HttpClient;
  private deepSeekClient: DeepSeekClient;
  private baseURL: string;
  private timeout: number;
  private headers: Record<string, string>;

  private constructor() {
    this.httpClient = HttpClient.getInstance();
    this.deepSeekClient = DeepSeekClient.getInstance();
    this.baseURL = API_CONFIG.BASE_URL;
    this.timeout = API_CONFIG.TIMEOUT;
    this.headers = API_CONFIG.HEADERS;
  }

  public static getInstance(): ArticleApi {
    if (!ArticleApi.instance) {
      ArticleApi.instance = new ArticleApi();
    }
    return ArticleApi.instance;
  }

  /**
   * 生成文章
   */
  public async generateArticle(request: ArticleRequest): Promise<ArticleResponse> {
    console.log('[ArticleApi] Starting article generation with request:', {
      difficulty: request.difficulty,
      topic: request.topic,
      length: request.length
    });

    try {
      // 使用DeepSeek API生成文章内容
      console.log('[ArticleApi] Calling DeepSeek API to generate article content...');
      const articleContent = await this.deepSeekClient.generateArticle(
        request.difficulty,
        request.topic,
        request.length
      );
      console.log('[ArticleApi] Article content generated successfully, length:', articleContent.length);

      // 分析文章中的单词
      console.log('[ArticleApi] Starting word analysis...');
      const wordsAnalysisText = await this.deepSeekClient.analyzeWords(articleContent);
      console.log('[ArticleApi] Word analysis completed, response length:', wordsAnalysisText.length);
      
      let words: WordAnalysis[] = [];
      
      try {
        // 尝试解析JSON格式的单词分析结果
        console.log('[ArticleApi] Attempting to parse word analysis JSON...');
        words = JSON.parse(wordsAnalysisText);
        console.log('[ArticleApi] Successfully parsed word analysis, found', words.length, 'words');
      } catch (parseError) {
        console.warn('[ArticleApi] Failed to parse words analysis, using fallback:', parseError);
        // 如果解析失败，使用简单的单词提取
        words = this.extractWordsFromText(articleContent);
        console.log('[ArticleApi] Using fallback word extraction, found', words.length, 'words');
      }

      // 计算文章统计信息
      const wordCount = articleContent.split(/\s+/).length;
      const estimatedReadingTime = Math.ceil(wordCount / 200); // 假设每分钟200个单词

      const result = {
        id: Date.now().toString(),
        title: this.generateTitle(articleContent),
        content: articleContent,
        difficulty: request.difficulty,
        wordCount,
        estimatedReadingTime,
        words
      };

      console.log('[ArticleApi] Article generation completed successfully:', {
        id: result.id,
        title: result.title,
        wordCount: result.wordCount,
        estimatedReadingTime: result.estimatedReadingTime,
        wordsCount: result.words.length
      });

      return result;
    } catch (error) {
      console.error('[ArticleApi] Failed to generate article:', error);
      throw new Error('Failed to generate article. Please try again.');
    }
  }

  /**
   * 从文本中提取单词（备用方法）
   */
  private extractWordsFromText(text: string): WordAnalysis[] {
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 2)
      .slice(0, 20); // 只取前20个单词

    return words.map(word => ({
      text: word,
      type: 'unlearned' as const,
      difficulty: 'medium' as const,
      frequency: 1
    }));
  }

  /**
   * 生成文章标题
   */
  private generateTitle(content: string): string {
    const sentences = content.split('.');
    const firstSentence = sentences[0].trim();
    return firstSentence.length > 50 ? firstSentence.substring(0, 50) + '...' : firstSentence;
  }

  /**
   * 翻译文本
   */
  public async translateText(request: TranslationRequest): Promise<TranslationResponse> {
    try {
      const translationText = await this.deepSeekClient.translateWord(request.text);
      
      // 解析翻译结果
      const lines = translationText.split('\n');
      let translatedText = '';
      let pronunciation = '';

      for (const line of lines) {
        if (line.startsWith('翻译：')) {
          translatedText = line.replace('翻译：', '').trim();
        } else if (line.startsWith('例句：')) {
          const example = line.replace('例句：', '').trim();
          const parts = example.split('/');
          if (parts.length >= 2) {
            pronunciation = parts[1].trim();
          }
        }
      }

      return {
        originalText: request.text,
        translatedText: translatedText || translationText,
        pronunciation
      };
    } catch (error) {
      console.error('Failed to translate text:', error);
      throw new Error('Failed to translate text. Please try again.');
    }
  }

  /**
   * 分析文章中的单词
   */
  public async analyzeWords(text: string): Promise<WordAnalysis[]> {
    try {
      const response = await this.httpClient.post<WordAnalysis[]>(
        API_ENDPOINTS.WORDS.LIST, // 修复：使用 API_ENDPOINTS 而不是 API_CONFIG.ENDPOINTS
        { text }
      );
      return response;
    } catch (error) {
      console.error('Failed to analyze words:', error);
      throw new Error('Failed to analyze words. Please try again.');
    }
  }

  /**
   * 获取单词详情
   */
  public async getWordDetail(word: string): Promise<WordAnalysis> {
    try {
      const response = await this.httpClient.get<WordAnalysis>(
        API_ENDPOINTS.WORDS.DETAIL(word) // 修复：使用 API_ENDPOINTS 而不是 API_CONFIG.ENDPOINTS
      );
      return response;
    } catch (error) {
      console.error('Failed to get word detail:', error);
      throw new Error('Failed to get word detail. Please try again.');
    }
  }

  /**
   * 保存用户学习进度
   */
  public async saveProgress(sessionId: string, progress: any): Promise<void> {
    try {
      await this.httpClient.post(
        '/articles/progress', // 修复：使用正确的端点路径
        { sessionId, progress }
      );
    } catch (error) {
      console.error('Failed to save progress:', error);
      // 不抛出错误，因为进度保存失败不应该影响用户体验
    }
  }

  /**
   * 获取用户学习进度
   */
  public async getProgress(sessionId: string): Promise<any> {
    try {
      const response = await this.httpClient.get(
        `/articles/progress/${sessionId}` // 修复：使用正确的端点路径，包含sessionId参数
      );
      return response;
    } catch (error) {
      console.error('Failed to get progress:', error);
      return null;
    }
  }

  /**
   * 评价文章
   */
  public async rateArticle(id: string, level: string): Promise<void> {
    try {
      await this.httpClient.post('/articles/rate', {
        id,
        level
      });
      console.log('[ArticleApi] Article rated successfully');
    } catch (error) {
      console.error('[ArticleApi] Failed to rate article:', error);
      throw error;
    }
  }
}