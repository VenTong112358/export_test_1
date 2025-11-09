import { useState, useEffect } from 'react';
import { LocalArticleStorage, LocalArticle, LocalNewWord } from '@data/sqlite/LocalArticleStorage';

export const useLocalArticles = (userId: string | number) => {
  const [articles, setArticles] = useState<LocalArticle[]>([]);
  const [newWords, setNewWords] = useState<LocalNewWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadArticles = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const localArticleStorage = LocalArticleStorage.getInstance();
      const loadedArticles = await localArticleStorage.getCompletedArticles(userId);
      const loadedNewWords = await localArticleStorage.getAllNewWords(userId);
      
      setArticles(loadedArticles);
      setNewWords(loadedNewWords);
      
      console.log('[useLocalArticles] Loaded articles:', loadedArticles.length, 'for user', userId);
      console.log('[useLocalArticles] Loaded new words:', loadedNewWords.length, 'for user', userId);
    } catch (err) {
      console.error('[useLocalArticles] Error loading articles:', err);
      setError(err instanceof Error ? err.message : 'Failed to load articles');
    } finally {
      setIsLoading(false);
    }
  };

  const refreshArticles = () => {
    loadArticles();
  };

  const getArticlesByDate = (date: string): LocalArticle[] => {
    return articles.filter(article => article.date === date);
  };

  const getMostRecentArticle = (): LocalArticle | null => {
    if (articles.length === 0) return null;
    return articles[0]; // 已经按完成时间排序，最新的在前
  };

  const getArticlesGroupedByDate = () => {
    const grouped: { [date: string]: LocalArticle[] } = {};
    
    articles.forEach(article => {
      if (!grouped[article.date]) {
        grouped[article.date] = [];
      }
      grouped[article.date].push(article);
    });
    
    return grouped;
  };

  // 初始化时加载数据
  useEffect(() => {
    if (userId) loadArticles();
  }, [userId]);

  return {
    articles,
    newWords,
    isLoading,
    error,
    refreshArticles,
    getArticlesByDate,
    getMostRecentArticle,
    getArticlesGroupedByDate,
  };
}; 