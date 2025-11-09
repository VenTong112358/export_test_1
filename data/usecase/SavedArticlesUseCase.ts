import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { SavedArticlesApi, SavedArticle } from '../api/SavedArticlesApi';

export interface SavedArticlesState {
  articles: SavedArticle[];
  loading: boolean;
  error: string | null;
}

const initialState: SavedArticlesState = {
  articles: [],
  loading: false,
  error: null,
};

// 异步操作：获取收藏文章列表
export const fetchSavedArticles = createAsyncThunk(
  'savedArticles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const api = SavedArticlesApi.getInstance();
      const articles = await api.getSavedArticles();
      return articles;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fetch saved articles failed');
    }
  }
);

// 异步操作：收藏文章
export const saveArticle = createAsyncThunk(
  'savedArticles/save',
  async (articleData: { title: string; content: string }, { rejectWithValue }) => {
    try {
      const api = SavedArticlesApi.getInstance();
      const response = await api.saveArticle(articleData);
      return { articleData, response };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Save article failed');
    }
  }
);

// 异步操作：取消收藏文章
export const unsaveArticle = createAsyncThunk(
  'savedArticles/unsave',
  async (articleId: number, { rejectWithValue }) => {
    try {
      const api = SavedArticlesApi.getInstance();
      await api.unsaveArticle(articleId);
      return articleId;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Unsave article failed');
    }
  }
);

const savedArticlesSlice = createSlice({
  name: 'savedArticles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    // 添加本地文章到列表（用于实时更新UI）
    addLocalArticle: (state, action: PayloadAction<SavedArticle>) => {
      state.articles.unshift(action.payload);
    },
    // 从本地列表移除文章（用于实时更新UI）
    removeLocalArticle: (state, action: PayloadAction<number>) => {
      state.articles = state.articles.filter(article => article.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取收藏文章列表
      .addCase(fetchSavedArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
      })
      .addCase(fetchSavedArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 收藏文章
      .addCase(saveArticle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveArticle.fulfilled, (state, action) => {
        state.loading = false;
        const { articleData } = action.payload;
        // 添加新收藏的文章到列表开头
        const newArticle: SavedArticle = {
          id: Date.now(), // 临时ID，实际应该从API响应获取
          title: articleData.title,
          content: articleData.content,
          saved_at: new Date().toISOString(),
          user_id: 0, // 临时值，实际应该从用户状态获取
        };
        state.articles.unshift(newArticle);
      })
      .addCase(saveArticle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 取消收藏文章
      .addCase(unsaveArticle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(unsaveArticle.fulfilled, (state, action) => {
        state.loading = false;
        const articleId = action.payload;
        // 从列表中移除文章
        state.articles = state.articles.filter(article => article.id !== articleId);
      })
      .addCase(unsaveArticle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, addLocalArticle, removeLocalArticle } = savedArticlesSlice.actions;
export default savedArticlesSlice.reducer;

// 选择器
export const selectSavedArticles = (state: any) => state.savedArticles.articles;
export const selectSavedArticlesLoading = (state: any) => state.savedArticles.loading;
export const selectSavedArticlesError = (state: any) => state.savedArticles.error;