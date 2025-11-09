import { httpClient } from './HttpClient';
import { API_ENDPOINTS } from './ApiConfig';

export class TranslationApi {
  // 中文查词 - 使用 word_search 端点
  static async searchWordChinese(logId: string, word: string): Promise<string> {
    try {
      const endpoint = API_ENDPOINTS.WORD_SEARCH(parseInt(logId), word);
      console.log('[TranslationApi] Chinese word search endpoint:', endpoint);
      
      const response = await httpClient.get(endpoint);
      console.log('[TranslationApi] Chinese search response:', response);
      
      if (typeof response === 'string') {
        return response.trim();
      }
      return (response as any).data || (response as any) || '';
    } catch (error) {
      console.error('[TranslationApi] Chinese word search error:', error);
      throw error;
    }
  }

  // 英文查词翻译 - 使用 english_word_search 端点
  static async translateWord(logId: string, word: string): Promise<string> {
    try {
      const endpoint = API_ENDPOINTS.ENGLISH_WORD_SEARCH(parseInt(logId), word);
      console.log('[TranslationApi] Calling endpoint:', endpoint);
      console.log('[TranslationApi] Full URL:', `https://masterwordai.com${endpoint}`);
      
      // 首先测试网络连接
      try {
        // 使用简单的fetch测试连接
        const testUrl = `https://masterwordai.com${endpoint}`;
        console.log('[TranslationApi] Testing connection to:', testUrl);
        
        const testResponse = await fetch(testUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            // 暂时不使用认证头进行测试
          },
          // 添加超时控制
          signal: AbortSignal.timeout(10000) // 10秒超时
        });
        
        console.log('[TranslationApi] Test response status:', testResponse.status);
        
        if (testResponse.ok) {
          // 根据API文档，响应是字符串格式的定义和音标
          const responseText = await testResponse.text();
          console.log('[TranslationApi] Test response data:', responseText);
          // 如果响应是有效的字符串且不为空，直接返回
          if (responseText && responseText.trim() !== '') {
            return responseText.trim();
          }
        } else {
          console.log('[TranslationApi] Test response not ok, status:', testResponse.status);
          console.log('[TranslationApi] Trying with HttpClient');
        }
      } catch (fetchError: any) {
        console.error('[TranslationApi] Direct fetch failed:', fetchError);
        console.log('[TranslationApi] Falling back to HttpClient');
      }
      
      // 如果直接fetch失败，尝试使用HttpClient
      try {
        const response = await httpClient.get(endpoint);
        console.log('[TranslationApi] HttpClient response:', response);
        // 根据API文档，响应应该是字符串格式
        if (typeof response === 'string') {
          return response.trim();
        }
        // 兼容可能的JSON格式响应
        return (response as any).data?.translation || (response as any).translation || (response as any) || '';
      } catch (httpError: any) {
        console.error('[TranslationApi] HTTP Client error:', {
          message: httpError.message,
          status: httpError.status,
          endpoint: endpoint,
          fullUrl: `https://masterwordai.com${endpoint}`
        });
        
        // 检查是否是认证问题
        if (httpError.message?.includes('401') || httpError.status === 401) {
          throw new Error('认证失败：请重新登录');
        }
        
        // 检查是否是网络问题或CORS问题
        if (httpError.message?.includes('Failed to fetch') || 
            httpError.message?.includes('ERR_FAILED') ||
            httpError.message?.includes('ERR_ABORTED') ||
            httpError.message?.includes('CORS') ||
            httpError.message?.includes('Network request failed')) {
          throw new Error('网络连接失败：可能是CORS限制或网络问题，请检查网络连接或联系管理员');
        }
        
        // 检查是否是404错误
        if (httpError.message?.includes('404') || httpError.status === 404) {
          throw new Error('翻译服务暂时不可用：API端点未找到');
        }
        
        throw httpError;
      }
    } catch (error) {
      console.error('[TranslationApi] Translation error:', error);
      throw error;
    }
  }

  // 新增：翻译整篇文章的方法
  static async translateArticle(logId: string, content: string): Promise<string> {
    try {
      console.log('[TranslationApi] Starting article translation for logId:', logId);
      console.log('[TranslationApi] Content length:', content.length);
      
      // 简化翻译策略：只翻译少量关键词，避免大量API调用
      const words = content.match(/\b[a-zA-Z]{4,}\b/g) || [];
      const uniqueWords = [...new Set(words.map(w => w.toLowerCase()))];
      
      // 只翻译前10个关键词，避免网络请求过多
      const keyWords = uniqueWords.slice(0, 10);
      console.log('[TranslationApi] Key words to translate:', keyWords);
      
      const translationMap = new Map<string, string>();
      
      // 逐个翻译关键词，遇到错误就跳过
      for (const word of keyWords) {
        try {
          const translation = await this.translateWord(logId, word);
          if (translation && translation !== word) {
            translationMap.set(word.toLowerCase(), translation);
            console.log('[TranslationApi] Translated:', word, '->', translation);
          }
        } catch (error) {
          console.log('[TranslationApi] Failed to translate word:', word, error);
          // 跳过失败的单词，继续翻译其他单词
          continue;
        }
      }
      
      // 如果没有成功翻译任何单词，返回原文
      if (translationMap.size === 0) {
        console.log('[TranslationApi] No words translated, returning original content');
        return content;
      }
      
      // 替换原文中的单词为翻译
      let translatedContent = content;
      translationMap.forEach((translation, word) => {
        const regex = new RegExp(`\\b${word}\\b`, 'gi');
        translatedContent = translatedContent.replace(regex, `${word}(${translation})`);
      });
      
      console.log('[TranslationApi] Article translation completed, translated', translationMap.size, 'words');
      return translatedContent;
    } catch (error) {
      console.error('[TranslationApi] Article translation error:', error);
      // 如果翻译失败，返回原文而不是抛出错误
      return content;
    }
  }
}