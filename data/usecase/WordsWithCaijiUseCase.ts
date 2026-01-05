import { WordsWithCaijiApi, WordsWithCaijiResponse } from '@data/api/WordsWithCaijiApi';
import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';

// Types
export interface WordsWithCaijiState {
  data: WordsWithCaijiResponse | null;
  isLoading: boolean;
  error: string | null;
}

// Initial state
const initialState: WordsWithCaijiState = {
  data: null,
  isLoading: false,
  error: null,
};

// Async thunk
/**
 * GET /test/words_with_caiji
 * Fetch recent learned words and their learning factor
 * Should be called when user clicks "word" page to see learning progress
 */
export const getWordsWithCaiji = createAsyncThunk(
  'wordsWithCaiji/getWordsWithCaiji',
  async (_, { rejectWithValue }) => {
    try {
      console.log('[WordsWithCaijiUseCase] Starting getWordsWithCaiji thunk');
      const wordsWithCaijiApi = WordsWithCaijiApi.getInstance();
      const response = await wordsWithCaijiApi.getWordsWithCaiji();
      console.log('[WordsWithCaijiUseCase] getWordsWithCaiji completed successfully, response:', response);
      return response;
    } catch (error) {
      console.error('[WordsWithCaijiUseCase] Failed to get words with caiji:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to get words with caiji');
    }
  }
);

// Slice
const wordsWithCaijiSlice = createSlice({
  name: 'wordsWithCaiji',
  initialState,
  reducers: {
    clearData: (state) => {
      state.data = null;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    resetWordsWithCaiji: (state) => {
      state.data = null;
      state.isLoading = false;
      state.error = null;
    },
    setData: (state, action: PayloadAction<WordsWithCaijiResponse>) => {
      state.data = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Words With Caiji
      .addCase(getWordsWithCaiji.pending, (state) => {
        console.log('[WordsWithCaijiUseCase] getWordsWithCaiji.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getWordsWithCaiji.fulfilled, (state, action) => {
        console.log('[WordsWithCaijiUseCase] getWordsWithCaiji.fulfilled, payload:', action.payload);
        state.isLoading = false;
        state.data = action.payload;
      })
      .addCase(getWordsWithCaiji.rejected, (state, action) => {
        console.error('[WordsWithCaijiUseCase] getWordsWithCaiji.rejected, error:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  clearData,
  clearError,
  resetWordsWithCaiji,
  setData,
} = wordsWithCaijiSlice.actions;

// Export reducer
export default wordsWithCaijiSlice.reducer;

