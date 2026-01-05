import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { AllArticle, AllArticlesApi } from '../api/AllArticlesApi';

export interface AllArticlesState {
  articles: AllArticle[];
  loading: boolean;
  error: string | null;
}

const initialState: AllArticlesState = {
  articles: [],
  loading: false,
  error: null,
};

// 异步操作：获取所有文章列表
export const fetchAllArticles = createAsyncThunk(
  'allArticles/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const api = AllArticlesApi.getInstance();
      const articles = await api.getAllArticles();
      return articles;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Fetch all articles failed');
    }
  }
);

const allArticlesSlice = createSlice({
  name: 'allArticles',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 获取所有文章列表
      .addCase(fetchAllArticles.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchAllArticles.fulfilled, (state, action) => {
        state.loading = false;
        state.articles = action.payload;
      })
      .addCase(fetchAllArticles.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = allArticlesSlice.actions;
export default allArticlesSlice.reducer;

// 选择器
export const selectAllArticles = (state: any) => state.allArticles.articles;
export const selectAllArticlesLoading = (state: any) => state.allArticles.loading;
export const selectAllArticlesError = (state: any) => state.allArticles.error;

