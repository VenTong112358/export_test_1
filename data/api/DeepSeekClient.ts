import { DEEPSEEK_CONFIG, DeepSeekRequest, DeepSeekResponse, PROMPT_TEMPLATES } from './DeepSeekConfig';

export class DeepSeekClient {
  private static instance: DeepSeekClient;

  private constructor() {}

  public static getInstance(): DeepSeekClient {
    if (!DeepSeekClient.instance) {
      DeepSeekClient.instance = new DeepSeekClient();
    }
    return DeepSeekClient.instance;
  }

  /**
   * 直接调用DeepSeek API
   */
  public async callDeepSeekAPI(
    prompt: string,
    options: {
      temperature?: number;
      maxTokens?: number;
      systemMessage?: string;
    } = {}
  ): Promise<string> {
    console.log('[DeepSeekClient] Starting API call with options:', {
      temperature: options.temperature,
      maxTokens: options.maxTokens,
      hasSystemMessage: !!options.systemMessage,
      promptLength: prompt.length
    });

    const { temperature = 0.7, maxTokens = 2000, systemMessage } = options;

    const messages: Array<{
      role: 'user' | 'assistant' | 'system';
      content: string;
    }> = [];

    if (systemMessage) {
      messages.push({
        role: 'system',
        content: systemMessage
      });
    }

    messages.push({
      role: 'user',
      content: prompt
    });

    const request: DeepSeekRequest = {
      model: DEEPSEEK_CONFIG.MODEL,
      messages,
      temperature,
      max_tokens: maxTokens,
      stream: false
    };

    console.log('[DeepSeekClient] Request payload:', {
      model: request.model,
      messageCount: request.messages.length,
      temperature: request.temperature,
      maxTokens: request.max_tokens,
      apiKey: DEEPSEEK_CONFIG.API_KEY ? '***' + DEEPSEEK_CONFIG.API_KEY.slice(-4) : 'NOT_SET'
    });

    try {
      console.log('[DeepSeekClient] Making fetch request to:', `${DEEPSEEK_CONFIG.BASE_URL}/chat/completions`);
      
      const response = await fetch(`${DEEPSEEK_CONFIG.BASE_URL}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${DEEPSEEK_CONFIG.API_KEY}`
        },
        body: JSON.stringify(request)
      });

      console.log('[DeepSeekClient] Response status:', response.status, response.statusText);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('[DeepSeekClient] API Error response:', errorData);
        throw new Error(`DeepSeek API Error: ${response.status} - ${errorData.error?.message || response.statusText}`);
      }

      const data: DeepSeekResponse = await response.json();
      console.log('[DeepSeekClient] Success response:', {
        id: data.id,
        model: data.model,
        choicesCount: data.choices?.length,
        usage: data.usage
      });
      
      if (data.choices && data.choices.length > 0) {
        const content = data.choices[0].message.content;
        console.log('[DeepSeekClient] Generated content length:', content.length);
        return content;
      } else {
        console.error('[DeepSeekClient] No choices in response:', data);
        throw new Error('No response content from DeepSeek API');
      }
    } catch (error) {
      console.error('[DeepSeekClient] API call failed:', error);
      throw error;
    }
  }

  /**
   * 生成文章标题
   */
  public async generateTitles(
    genre: 'News Report' | 'Explanation' | 'Argument' | 'Story Narration' | 'Essay' | 'Reflective Argument',
    topic: string,
    factualNews?: string,
    userInterest?: string
  ): Promise<string> {
    const prompt = PROMPT_TEMPLATES.GENERATE_TITLES(genre, topic, factualNews, userInterest);
    
    return this.callDeepSeekAPI(prompt, {
      temperature: 0.7,
      maxTokens: 800,
      systemMessage: '你是一个专业的标题创作专家，擅长为英语学习文章创作吸引人的标题。'
    });
  }

  /**
   * 生成文章（新版本，基于你的Python prompt）
   */
  public async generateArticleAdvanced(
    genre: 'News Report' | 'Explanation' | 'Argument' | 'Story Narration' | 'Essay' | 'Reflective Argument',
    topic: string,
    title: string,
    level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2',
    providedVocab?: string,
    factualNews?: string
  ): Promise<string> {
    const prompt = PROMPT_TEMPLATES.GENERATE_ARTICLE(genre, topic, title, level, providedVocab, factualNews);
    
    return this.callDeepSeekAPI(prompt, {
      temperature: 0.8,
      maxTokens: 2000,
      systemMessage: '你是一个专业的英语教育内容创作者，擅长根据学习者的水平生成适合的英语文章。'
    });
  }

  /**
   * 生成文章（简化版本，保持向后兼容）
   */
  public async generateArticle(
    difficulty: 'easy' | 'medium' | 'hard',
    topic?: string,
    length: 'short' | 'medium' | 'long' = 'medium'
  ): Promise<string> {
    const prompt = PROMPT_TEMPLATES.GENERATE_ARTICLE_SIMPLE(difficulty, topic, length);
    
    return this.callDeepSeekAPI(prompt, {
      temperature: 0.8,
      maxTokens: 1500,
      systemMessage: '你是一个专业的英语教育内容创作者，擅长根据学习者的水平生成适合的英语文章。'
    });
  }

  /**
   * 翻译单词
   */
  public async translateWord(word: string, context?: string): Promise<string> {
    const prompt = PROMPT_TEMPLATES.TRANSLATE_WORD(word, context);
    
    return this.callDeepSeekAPI(prompt, {
      temperature: 0.3,
      maxTokens: 500,
      systemMessage: '你是一个专业的英语翻译助手，提供准确的中英文翻译和释义。'
    });
  }

  /**
   * 分析文章中的单词
   */
  public async analyzeWords(text: string): Promise<string> {
    const prompt = PROMPT_TEMPLATES.ANALYZE_WORDS(text);
    
    return this.callDeepSeekAPI(prompt, {
      temperature: 0.2,
      maxTokens: 2000,
      systemMessage: '你是一个英语词汇分析专家，能够准确分析文章中的单词难度和含义。'
    });
  }

  /**
   * 评估文章难度
   */
  public async assessDifficulty(text: string): Promise<string> {
    const prompt = PROMPT_TEMPLATES.ASSESS_DIFFICULTY(text);
    
    return this.callDeepSeekAPI(prompt, {
      temperature: 0.1,
      maxTokens: 50,
      systemMessage: '你是一个英语教育专家，能够准确评估文章的难度级别。'
    });
  }

  /**
   * 改写句子
   */
  public async paraphraseSentence(sentence: string, level: 'A1' | 'A2' | 'B1' | 'B2' | 'C1' | 'C2'): Promise<string> {
    const prompt = PROMPT_TEMPLATES.PARAPHRASE_SENTENCE(sentence, level);
    
    return this.callDeepSeekAPI(prompt, {
      temperature: 0.3,
      maxTokens: 200,
      systemMessage: '你是一个专业的语言教师，擅长将复杂句子改写为适合学习者理解的形式。'
    });
  }
} 