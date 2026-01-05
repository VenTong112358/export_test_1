import AsyncStorage from '@react-native-async-storage/async-storage';

export interface LocalArticle {
  id: string;
  logId: number;
  englishTitle: string;
  chineseTitle: string;
  date: string;
  newWords: LocalNewWord[];
  reviewedWords?: LocalNewWord[];
  completedAt: string;
}

export interface LocalNewWord {
  id: number;
  word: string;
  phonetic: string;
  definition: string;
}

const STORAGE_KEYS = {
  LOCAL_ARTICLES: (userId: string | number) => `@local_articles_${userId}`,
};

export class LocalArticleStorage {
  private static instance: LocalArticleStorage;

  private constructor() {}

  static getInstance(): LocalArticleStorage {
    if (!LocalArticleStorage.instance) {
      LocalArticleStorage.instance = new LocalArticleStorage();
    }
    return LocalArticleStorage.instance;
  }

  /**
   * 保存完成的文章和生词到本地存储（账号隔离）
   */
  async saveCompletedArticle(userId: string | number, article: LocalArticle): Promise<void> {
    try {
      const key = STORAGE_KEYS.LOCAL_ARTICLES(userId);
      console.log('[LocalArticleStorage] Saving completed article:', {
        userId,
        id: article.id,
        logId: article.logId,
        title: article.englishTitle,
        newWordsCount: article.newWords.length,
        reviewedWordsCount: article.reviewedWords?.length || 0
      });

      // 获取现有的文章列表
      const existingArticles = await this.getCompletedArticles(userId);
      
      // 检查是否已存在相同logId的文章
      const existingIndex = existingArticles.findIndex(a => a.logId === article.logId);
      
      if (existingIndex >= 0) {
        // 更新现有文章
        existingArticles[existingIndex] = article;
      } else {
        // 添加新文章
        existingArticles.push(article);
      }

      // 按完成时间排序（最新的在前）
      existingArticles.sort((a, b) => 
        new Date(b.completedAt).getTime() - new Date(a.completedAt).getTime()
      );

      // 保存到AsyncStorage
      await AsyncStorage.setItem(key, JSON.stringify(existingArticles));
      
      console.log('[LocalArticleStorage] Successfully saved article, total articles:', existingArticles.length);
    } catch (error) {
      console.error('[LocalArticleStorage] Error saving completed article:', error);
      throw error;
    }
  }

  /**
   * 获取所有完成的文章（账号隔离）
   */
  async getCompletedArticles(userId: string | number): Promise<LocalArticle[]> {
    try {
      const key = STORAGE_KEYS.LOCAL_ARTICLES(userId);
      const data = await AsyncStorage.getItem(key);
      if (data) {
        const articles = JSON.parse(data) as LocalArticle[];
        console.log('[LocalArticleStorage] Retrieved articles:', articles.length, 'for user', userId);
        return articles;
      }
      return [];
    } catch (error) {
      console.error('[LocalArticleStorage] Error getting completed articles:', error);
      return [];
    }
  }

  /**
   * 获取指定日期的文章（账号隔离）
   */
  async getArticlesByDate(userId: string | number, date: string): Promise<LocalArticle[]> {
    try {
      const articles = await this.getCompletedArticles(userId);
      return articles.filter(article => article.date === date);
    } catch (error) {
      console.error('[LocalArticleStorage] Error getting articles by date:', error);
      return [];
    }
  }

  /**
   * 获取所有生词（去重，账号隔离）
   */
  async getAllNewWords(userId: string | number): Promise<LocalNewWord[]> {
    try {
      const articles = await this.getCompletedArticles(userId);
      const allWords: LocalNewWord[] = [];
      const seenWords = new Set<string>();

      articles.forEach(article => {
        article.newWords.forEach(word => {
          const wordKey = `${word.word}-${word.definition}`;
          if (!seenWords.has(wordKey)) {
            seenWords.add(wordKey);
            allWords.push(word);
          }
        });
      });

      console.log('[LocalArticleStorage] Retrieved unique new words:', allWords.length, 'for user', userId);
      return allWords;
    } catch (error) {
      console.error('[LocalArticleStorage] Error getting all new words:', error);
      return [];
    }
  }

  /**
   * 删除指定logId的文章（账号隔离）
   */
  async deleteArticle(userId: string | number, logId: number): Promise<void> {
    try {
      const key = STORAGE_KEYS.LOCAL_ARTICLES(userId);
      const articles = await this.getCompletedArticles(userId);
      const filteredArticles = articles.filter(article => article.logId !== logId);
      await AsyncStorage.setItem(key, JSON.stringify(filteredArticles));
      console.log('[LocalArticleStorage] Deleted article with logId:', logId, 'for user', userId);
    } catch (error) {
      console.error('[LocalArticleStorage] Error deleting article:', error);
      throw error;
    }
  }

  /**
   * 清空所有本地存储的文章（账号隔离）
   */
  async clearAllArticles(userId: string | number): Promise<void> {
    try {
      const key = STORAGE_KEYS.LOCAL_ARTICLES(userId);
      await AsyncStorage.removeItem(key);
      console.log('[LocalArticleStorage] Cleared all articles for user', userId);
    } catch (error) {
      console.error('[LocalArticleStorage] Error clearing articles:', error);
      throw error;
    }
  }
} 