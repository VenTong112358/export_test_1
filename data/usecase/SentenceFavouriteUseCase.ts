import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SentenceFavoriteApi, SavedSentence, SentenceFavoriteRequest, ArticleWithSavedSentences, MonthlyArticleGroup } from '@data/api/SentenceFavoriteApi';

export interface SentenceFavoriteState {
  savedSentences: SavedSentence[];
  articleGroups: ArticleWithSavedSentences[]; // 按文章分组的收藏句子
  monthlyGroups: MonthlyArticleGroup[]; // 按月份分组的文章
  loading: boolean;
  error: string | null;
  favoritedSentences: Set<string>; // 用于快速查找句子是否已收藏
  expandedArticles: Set<number>; // 展开的文章ID
}

const initialState: SentenceFavoriteState = {
  savedSentences: [],
  articleGroups: [],
  monthlyGroups: [],
  loading: false,
  error: null,
  favoritedSentences: new Set(),
  expandedArticles: new Set(),
};

// 异步操作
export const saveSentence = createAsyncThunk(
  'sentenceFavorite/save',
  async (request: SentenceFavoriteRequest, { rejectWithValue }) => {
    try {
      const api = SentenceFavoriteApi.getInstance();
      const response = await api.saveSentence(request);
      return { request, response };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Save sentence failed');
    }
  }
);

export const unsaveSentence = createAsyncThunk(
  'sentenceFavorite/unsave',
  async ({ savedPhraseId, content }: { savedPhraseId: number; content: string }, { rejectWithValue }) => {
    try {
      const api = SentenceFavoriteApi.getInstance();
      const response = await api.unsaveSentence(savedPhraseId);
      return { savedPhraseId, content, response };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unsave sentence failed');
    }
  }
);

export const fetchSavedSentences = createAsyncThunk(
  'sentenceFavorite/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const api = SentenceFavoriteApi.getInstance();
      const sentences = await api.getSavedSentences();
      return sentences;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fetch saved sentences failed');
    }
  }
);

// 新增：获取按文章分组的收藏句子
export const fetchSavedSentencesByArticle = createAsyncThunk(
  'sentenceFavorite/fetchByArticle',
  async (_, { rejectWithValue }) => {
    try {
      const api = SentenceFavoriteApi.getInstance();
      const articleGroups = await api.getSavedSentencesByArticle();
      const monthlyGroups = api.groupArticlesByMonth(articleGroups);
      return { articleGroups, monthlyGroups };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fetch saved sentences by article failed');
    }
  }
);

const sentenceFavoriteSlice = createSlice({
  name: 'sentenceFavorite',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // 添加本地收藏状态管理
    addLocalFavorite: (state, action: PayloadAction<{ content: string; savedPhraseId: number }>) => {
      state.favoritedSentences.add(action.payload.content);
    },
    removeLocalFavorite: (state, action: PayloadAction<string>) => {
      state.favoritedSentences.delete(action.payload);
    },
    // 新增：文章展开/收起管理
    toggleArticleExpansion: (state, action: PayloadAction<number>) => {
      const logId = action.payload;
      if (state.expandedArticles.has(logId)) {
        state.expandedArticles.delete(logId);
      } else {
        state.expandedArticles.add(logId);
      }
    },
    setArticleExpanded: (state, action: PayloadAction<{ logId: number; expanded: boolean }>) => {
      const { logId, expanded } = action.payload;
      if (expanded) {
        state.expandedArticles.add(logId);
      } else {
        state.expandedArticles.delete(logId);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      // Save sentence
      .addCase(saveSentence.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveSentence.fulfilled, (state, action) => {
        state.loading = false;
        const { request, response } = action.payload;
        // 添加到收藏列表
        const newSentence: SavedSentence = {
          id: response.saved_phrase_id,
          content: request.content,
          translation: request.translation,
          explication: request.explication,
          log_id: request.log_id,
          note: request.note,
          created_at: new Date().toISOString(),
        };
        state.savedSentences.unshift(newSentence);
        state.favoritedSentences.add(request.content);
      })
      .addCase(saveSentence.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Unsave sentence
      .addCase(unsaveSentence.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unsaveSentence.fulfilled, (state, action) => {
        state.loading = false;
        const { savedPhraseId, content } = action.payload;
        // 从收藏列表中移除
        state.savedSentences = state.savedSentences.filter(s => s.id !== savedPhraseId);
        state.favoritedSentences.delete(content);
      })
      .addCase(unsaveSentence.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch saved sentences
      .addCase(fetchSavedSentences.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedSentences.fulfilled, (state, action) => {
        state.loading = false;
        state.savedSentences = action.payload;
        // 更新收藏状态集合
        state.favoritedSentences = new Set(action.payload.map(s => s.content));
      })
      .addCase(fetchSavedSentences.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Fetch saved sentences by article
      .addCase(fetchSavedSentencesByArticle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedSentencesByArticle.fulfilled, (state, action) => {
        state.loading = false;
        const { articleGroups, monthlyGroups } = action.payload;
        state.articleGroups = articleGroups;
        state.monthlyGroups = monthlyGroups;
        // 更新收藏状态集合
        const allSentences = articleGroups.flatMap(article => article.saved_sentences);
        state.favoritedSentences = new Set(allSentences.map(s => s.content));
      })
      .addCase(fetchSavedSentencesByArticle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, addLocalFavorite, removeLocalFavorite, toggleArticleExpansion, setArticleExpanded } = sentenceFavoriteSlice.actions;
export default sentenceFavoriteSlice.reducer;