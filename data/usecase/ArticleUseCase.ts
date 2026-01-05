import { ArticleApi, ArticleRequest, ArticleResponse, TranslationRequest, WordAnalysis } from '@data/api/ArticleApi';
import { GenerationApi } from '@data/api/GenerationApi';
import { ArticleContent } from '@data/model/Generation';
import { LocalArticle, LocalArticleStorage } from '@data/sqlite/LocalArticleStorage';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface ArticleState {
  currentArticle: ArticleResponse | null;
  currentContent: ArticleContent | null;
  segments: ArticleSegment[];
  currentSegmentIndex: number;
  selectedWord: WordAnalysis | null;
  isLoading: boolean;
  error: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
  sessionId: string | null;
  isGenerating: boolean;
  // 新增：流式生成相关状态
  streamingContent: string;
  isStreaming: boolean;
  streamingError: string | null;
  selectedWords: WordAnalysis[];
}

export interface ArticleSegment {
  id: string;
  content: string;
  words: WordAnalysis[];
}

// Initial state
const initialState: ArticleState = {
  currentArticle: null,
  currentContent: null,
  segments: [],
  currentSegmentIndex: 0,
  selectedWord: null,
  isLoading: false,
  error: null,
  difficulty: 'medium',
  sessionId: null,
  isGenerating: false,
  // 新增：流式生成初始状态
  streamingContent: '',
  isStreaming: false,
  streamingError: null,
  selectedWords: [],
};

// Async thunks
export const generateArticle = createAsyncThunk(
  'article/generateArticle',
  async (request: ArticleRequest, { rejectWithValue }) => {
    // console.log('[ArticleUseCase] generateArticle thunk called with request:', request);
    
    try {
      const articleApi = ArticleApi.getInstance();
      // console.log('[ArticleUseCase] ArticleApi instance obtained, calling generateArticle...');
      
      const response = await articleApi.generateArticle(request);
      // console.log('[ArticleUseCase] Article generation successful, response received');
      
      return response;
    } catch (error) {
      console.error('[ArticleUseCase] Article generation failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate article');
    }
  }
);

export const generateArticleFromLog = createAsyncThunk(
  'article/generateArticleFromLog',
  async (logId: number, { rejectWithValue }) => {
    // console.log('[ArticleUseCase] generateArticleFromLog thunk called with logId:', logId);
    
    try {
      const generationApi = GenerationApi.getInstance();
      // console.log('[ArticleUseCase] GenerationApi instance obtained, calling generateArticle...');
      
      const response = await generationApi.generateArticle(logId);
      // console.log('[ArticleUseCase] Article generation from log successful, response received');
      
      if (!response.success) {
        return rejectWithValue(response.error || 'Generation failed');
      }
      
      // Create article content object
      const articleContent: ArticleContent = {
        id: `generated-${logId}-${Date.now()}`,
        title: `Generated Article for Log ${logId}`,
        content: response.content || '',
        logId: logId,
        generatedAt: new Date().toISOString(),
      };
      
      return articleContent;
    } catch (error) {
      console.error('[ArticleUseCase] Article generation from log failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate article from log');
    }
  }
);

// 新增：流式生成文章的 thunk（支持 WebSocket）
export const generateArticleStreamFromLog = createAsyncThunk(
  'article/generateArticleStreamFromLog',
  async (logId: number, { dispatch, rejectWithValue }) => {
    console.log('[ArticleUseCase] generateArticleStreamFromLog thunk called with logId:', logId);
    try {
      const generationApi = GenerationApi.getInstance();
      // 获取 accessToken
      const httpClient = require('../api/HttpClient').HttpClient.getInstance();
      const accessToken = httpClient.getAccessToken?.() || '';
      // 优先用 WebSocket 版本
      await generationApi.generateArticleStreamWS(
        logId,
        // onChunk 回调
        (chunk: string) => {
          dispatch(updateStreamingContent(chunk));
        },
        // onComplete 回调
        (fullContent: string) => {
          const articleContent = {
            id: `streaming-${logId}-${Date.now()}`,
            title: '',
            content: fullContent,
            logId: logId,
            generatedAt: new Date().toISOString(),
          };
          dispatch(setStreamingComplete(articleContent));
        },
        // onError 回调
        (error: string) => {
          console.error('[ArticleUseCase] [WS] Streaming generation failed:', error);
          dispatch(setStreamingError(error));
        },
        accessToken
      );
      return { success: true };
    } catch (error) {
      console.error('[ArticleUseCase] Failed to start streaming generation:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to start streaming generation');
    }
  }
);

export const translateWord = createAsyncThunk(
  'article/translateWord',
  async (request: TranslationRequest, { rejectWithValue }) => {
    try {
      const articleApi = ArticleApi.getInstance();
      const response = await articleApi.translateText(request);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Translation failed');
    }
  }
);

export const analyzeWords = createAsyncThunk(
  'article/analyzeWords',
  async (text: string, { rejectWithValue }) => {
    try {
      const articleApi = ArticleApi.getInstance();
      const response = await articleApi.analyzeWords(text);
      return response;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Word analysis failed');
    }
  }
);

export const saveProgress = createAsyncThunk(
  'article/saveProgress',
  async ({ sessionId, progress }: { sessionId: string; progress: any }, { rejectWithValue }) => {
    try {
      const articleApi = ArticleApi.getInstance();
      await articleApi.saveProgress(sessionId, progress);
      return { sessionId, progress };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save progress');
    }
  }
);

export const finishReading = createAsyncThunk(
  'article/finishReading',
  async (logId: number, { rejectWithValue, getState }) => {
    try {
      console.log('[ArticleUseCase] finishReading called with logId:', logId);
      const generationApi = GenerationApi.getInstance();
      const response = await generationApi.finishReading(logId);
      console.log('[ArticleUseCase] finishReading API response:', response);
      if (!response.success) {
        console.error('[ArticleUseCase] finishReading failed:', response.error);
        return rejectWithValue(response.error || 'Finish reading failed');
      }

      // 保存文章和生词到本地存储（账号隔离）
      try {
        const state = getState() as any;
        const userId = state.auth.user?.id;
        if (!userId) throw new Error('No userId found in state.auth.user');
        const currentContent = state.article.currentContent;
        const selectedWords = state.article.selectedWords;
        const logs = state.dailyLearningLogs.logs;
        const log = logs.find((l: any) => l.id === logId);
        const today = new Date().toISOString().split('T')[0];
        
        console.log('[ArticleUseCase] Saving article data:', {
          logId,
          userId,
          hasLog: !!log,
          logDailyNewWords: log?.daily_new_words?.length || 0,
          logDailyReviewedWords: log?.daily_reviewed_words?.length || 0,
          selectedWordsCount: selectedWords?.length || 0,
          logEnglishTitle: log?.english_title,
          logChineseTitle: log?.chinese_title,
          logDate: log?.date
        });
        
        // 优先用 log.daily_new_words
        const newWords = log?.daily_new_words && log.daily_new_words.length > 0
          ? log.daily_new_words
          : (selectedWords && selectedWords.length > 0 ? selectedWords : []);

        if (newWords.length === 0) {
          console.warn('[ArticleUseCase] No new words found for logId:', logId);
        }

        // Extract reviewed words from log
        const reviewedWords = log?.daily_reviewed_words && log.daily_reviewed_words.length > 0
          ? log.daily_reviewed_words
          : undefined;

        const localArticle: LocalArticle = {
          id: `article-${logId}-${Date.now()}`,
          logId: logId,
          englishTitle: log?.english_title || currentContent?.title || `Article ${logId}`,
          chineseTitle: log?.chinese_title || '',
          date: log?.date || today,
          newWords: newWords.map((word: any, index: number) => ({
            id: word.id || index + 1,
            word: word.word || word.text || '',
            phonetic: word.phonetic || '',
            definition: word.definition || '',
          })),
          reviewedWords: reviewedWords ? reviewedWords.map((word: any, index: number) => ({
            id: word.id || index + 1,
            word: word.word || '',
            phonetic: word.phonetic || '',
            definition: word.definition || '',
          })) : undefined,
          completedAt: new Date().toISOString(),
        };
        
        console.log('[ArticleUseCase] Local article to save:', {
          id: localArticle.id,
          logId: localArticle.logId,
          englishTitle: localArticle.englishTitle,
          chineseTitle: localArticle.chineseTitle,
          date: localArticle.date,
          newWordsCount: localArticle.newWords.length,
          reviewedWordsCount: localArticle.reviewedWords?.length || 0,
          firstWord: localArticle.newWords[0]
        });
        
        const localArticleStorage = LocalArticleStorage.getInstance();
        await localArticleStorage.saveCompletedArticle(userId, localArticle);
        console.log('[ArticleUseCase] Successfully saved article to local storage for user', userId);
      } catch (storageError) {
        console.error('[ArticleUseCase] Error saving to local storage:', storageError);
      }
      
      return { logId, success: true };
    } catch (error) {
      console.error('[ArticleUseCase] Finish reading failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to finish reading');
    }
  }
);

// Helper function to split article into segments
const splitArticleIntoSegments = (article: ArticleResponse): ArticleSegment[] => {
  const paragraphs = article.content.split('\n\n').filter(p => p.trim());
  return paragraphs.map((paragraph, index) => ({
    id: `segment-${index}`,
    content: paragraph.trim(),
    words: article.words.filter(word => 
      paragraph.toLowerCase().includes(word.text.toLowerCase())
    )
  }));
};
export const rateArticle = createAsyncThunk(
  'article/rateArticle',
  async ({ id, level }: { id: string, level: string }, { rejectWithValue }) => {
    try {
      const articleApi = ArticleApi.getInstance();
      await articleApi.rateArticle(id, level);
      return { id, level };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to rate article');
    }
  }
);

const articleSlice = createSlice({
  name: 'article',
  initialState,
  reducers: {
    setDifficulty: (state, action: PayloadAction<'easy' | 'medium' | 'hard'>) => {
      state.difficulty = action.payload;
    },
    setSelectedWord: (state, action: PayloadAction<WordAnalysis | null>) => {
      state.selectedWord = action.payload;
      // add selected word to selectedWords if not in selectedWords 
      if (!state.selectedWords.some(word => word.text === action.payload?.text)) {
        state.selectedWords = [...state.selectedWords, action.payload as WordAnalysis];
      }else{
        // remove selected word from selectedWords
        state.selectedWords = state.selectedWords.filter(word => word.text !== action.payload?.text);
      }
    },
    setCurrentSegmentIndex: (state, action: PayloadAction<number>) => {
      state.currentSegmentIndex = action.payload;
    },
    addSegment: (state, action: PayloadAction<ArticleSegment>) => {
      state.segments.push(action.payload);
    },
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    setSelectedWords: (state, action: PayloadAction<WordAnalysis[]>) => {
      state.selectedWords = action.payload;
    },
    resetArticle: (state) => {
      state.currentArticle = null;
      state.currentContent = null;
      state.segments = [];
      state.currentSegmentIndex = 0;
      state.selectedWord = null;
      state.error = null;
      state.isLoading = false;
      state.isGenerating = false;
      // 重置流式生成状态
      state.streamingContent = '';
      state.isStreaming = false;
      state.streamingError = null;
    },
    // 新增：流式生成相关的 reducers
    startStreaming: (state) => {
      state.isStreaming = true;
      state.streamingContent = '';
      state.streamingError = null;
    },
    updateStreamingContent: (state, action: PayloadAction<string>) => {
      state.streamingContent += action.payload;
    },
    setStreamingComplete: (state, action: PayloadAction<ArticleContent>) => {
      state.isStreaming = false;
      state.currentContent = action.payload;
      state.streamingContent = '';
      state.streamingError = null;
    },
    setStreamingError: (state, action: PayloadAction<string>) => {
      console.error('[ArticleSlice] setStreamingError - Streaming error:', action.payload);
      state.isStreaming = false;
      state.streamingError = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Generate Article
      .addCase(generateArticle.pending, (state) => {
        // console.log('[ArticleSlice] generateArticle.pending - Setting loading state');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(generateArticle.fulfilled, (state, action) => {
        // console.log('[ArticleSlice] generateArticle.fulfilled - Article received:', {
        //   id: action.payload.id,
        //   title: action.payload.title,
        //   wordCount: action.payload.wordCount
        // });
        
        state.isLoading = false;
        state.currentArticle = action.payload;
        // 将文章分割成段落
        const segments = splitArticleIntoSegments(action.payload);
        // console.log('[ArticleSlice] Article split into', segments.length, 'segments');
        state.segments = segments;
        state.currentSegmentIndex = 0;
      })
      .addCase(generateArticle.rejected, (state, action) => {
        // console.error('[ArticleSlice] generateArticle.rejected - Error:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Translate Word
      .addCase(translateWord.pending, (state) => {
        // 可以添加翻译加载状态
      })
      .addCase(translateWord.fulfilled, (state, action) => {
        // 更新选中单词的翻译
        if (state.selectedWord) {
          state.selectedWord.translation = action.payload.translatedText;
        }
      })
      .addCase(translateWord.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Analyze Words
      .addCase(analyzeWords.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(analyzeWords.fulfilled, (state, action) => {
        state.isLoading = false;
        // 更新当前段落的单词分析
        if (state.segments[state.currentSegmentIndex]) {
          state.segments[state.currentSegmentIndex].words = action.payload;
        }
      })
      .addCase(analyzeWords.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Generate Article From Log
      .addCase(generateArticleFromLog.pending, (state) => {
        // console.log('[ArticleSlice] generateArticleFromLog.pending - Setting generating state');
        state.isGenerating = true;
        state.error = null;
      })
      .addCase(generateArticleFromLog.fulfilled, (state, action) => {
        // console.log('[ArticleSlice] generateArticleFromLog.fulfilled - Article content received:', {
        //   id: action.payload.id,
        //   logId: action.payload.logId,
        //   contentLength: action.payload.content.length
        // });
        
        state.isGenerating = false;
        state.currentContent = action.payload;
        state.error = null;
      })
      .addCase(generateArticleFromLog.rejected, (state, action) => {
        // console.error('[ArticleSlice] generateArticleFromLog.rejected - Error:', action.payload);
        state.isGenerating = false;
        state.error = action.payload as string;
      })
      // 新增：流式生成文章的 reducers
      .addCase(generateArticleStreamFromLog.pending, (state) => {
        console.log('[ArticleSlice] generateArticleStreamFromLog.pending - Starting streaming');
        state.isStreaming = true;
        state.streamingContent = '';
        state.streamingError = null;
      })
      .addCase(generateArticleStreamFromLog.fulfilled, (state) => {
        console.log('[ArticleSlice] generateArticleStreamFromLog.fulfilled - Streaming started successfully');
      })
      .addCase(generateArticleStreamFromLog.rejected, (state, action) => {
        console.error('[ArticleSlice] generateArticleStreamFromLog.rejected - Error:', action.payload);
        state.isStreaming = false;
        state.streamingError = action.payload as string;
      })
      // Finish Reading
      .addCase(finishReading.pending, (state) => {
        // console.log('[ArticleSlice] finishReading.pending - Setting loading state');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(finishReading.fulfilled, (state, action) => {
        // console.log('[ArticleSlice] finishReading.fulfilled - Finish reading completed:', action.payload);
        state.isLoading = false;
        state.error = null;
      })
      .addCase(finishReading.rejected, (state, action) => {
        // console.error('[ArticleSlice] finishReading.rejected - Error:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
      })
      // Rate Article
      .addCase(rateArticle.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(rateArticle.fulfilled, (state, action) => {
        state.isLoading = false;
        state.error = null;
      })
      .addCase(rateArticle.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const {
  setDifficulty,
  setSelectedWord,
  setCurrentSegmentIndex,
  addSegment,
  setSessionId,
  clearError,
  resetArticle,
  // 新增：流式生成相关的 actions
  startStreaming,
  updateStreamingContent,
  setStreamingComplete,
  setStreamingError,
  setSelectedWords, // 新增导出
} = articleSlice.actions;

export default articleSlice.reducer; 