import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { WordSearchApi, WordSearchResponse } from '@data/api/WordSearchApi';

// Types
export interface WordSearchState {
  currentWord: string | null;
  definition: string | null;
  review: 'oui' | 'none' | null;
  isLoading: boolean;
  error: string | null;
  showModal: boolean;
}

// Initial state
const initialState: WordSearchState = {
  currentWord: null,
  definition: null,
  review: null,
  isLoading: false,
  error: null,
  showModal: false,
};

// Async thunks
export const searchWord = createAsyncThunk(
  'wordSearch/searchWord',
  async ({ logId, word }: { logId: number; word: string }, { rejectWithValue }) => {
    // console.log('[WordSearchUseCase] searchWord thunk called with:', { logId, word });
    
    try {
      const wordSearchApi = WordSearchApi.getInstance();
      // console.log('[WordSearchUseCase] WordSearchApi instance obtained, calling searchWord...');
      
      const response = await wordSearchApi.searchWord(logId, word);
      // console.log('[WordSearchUseCase] Word search successful, response received');
      
      return response;
    } catch (error) {
      console.error('[WordSearchUseCase] Word search failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search word');
    }
  }
);

export const searchWordEnglish = createAsyncThunk(
  'wordSearch/searchWordEnglish',
  async ({ logId, word }: { logId: number; word: string }, { rejectWithValue }) => {
    // console.log('[WordSearchUseCase] searchWordEnglish thunk called with:', { logId, word });
    
    try {
      const wordSearchApi = WordSearchApi.getInstance();
      // console.log('[WordSearchUseCase] WordSearchApi instance obtained, calling searchWordEnglish...');
      
      const response = await wordSearchApi.searchWordEnglish(logId, word);
      // console.log('[WordSearchUseCase] English word search successful, response received');
      
      return response;
    } catch (error) {
      console.error('[WordSearchUseCase] English word search failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search English word');
    }
  }
);

// Slice
const wordSearchSlice = createSlice({
  name: 'wordSearch',
  initialState,
  reducers: {
    setCurrentWord: (state, action: PayloadAction<string>) => {
      // console.log('[WordSearchSlice] Setting current word:', action.payload);
      state.currentWord = action.payload;
    },
    clearCurrentWord: (state) => {
      // console.log('[WordSearchSlice] Clearing current word');
      state.currentWord = null;
      state.definition = null;
      state.review = null;
    },
    setShowModal: (state, action: PayloadAction<boolean>) => {
      // console.log('[WordSearchSlice] Setting show modal:', action.payload);
      state.showModal = action.payload;
    },
    clearError: (state) => {
      // console.log('[WordSearchSlice] Clearing error');
      state.error = null;
    },
    resetWordSearch: (state) => {
      // console.log('[WordSearchSlice] Resetting word search state');
      state.currentWord = null;
      state.definition = null;
      state.review = null;
      state.isLoading = false;
      state.error = null;
      state.showModal = false;
    },
  },
  extraReducers: (builder) => {
    builder
      // Search Word (Chinese)
      .addCase(searchWord.pending, (state) => {
        // console.log('[WordSearchSlice] searchWord.pending - Setting loading state');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchWord.fulfilled, (state, action) => {
        // console.log('[WordSearchSlice] searchWord.fulfilled - Word search completed:', {
        //   definition: action.payload.definition,
        //   review: action.payload.review
        // });
        
        state.isLoading = false;
        state.definition = action.payload.definition;
        state.review = action.payload.review;
        state.showModal = true;
      })
      .addCase(searchWord.rejected, (state, action) => {
        // console.error('[WordSearchSlice] searchWord.rejected - Error:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
        state.showModal = false;
      })
      // Search Word (English)
      .addCase(searchWordEnglish.pending, (state) => {
        // console.log('[WordSearchSlice] searchWordEnglish.pending - Setting loading state');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(searchWordEnglish.fulfilled, (state, action) => {
        // console.log('[WordSearchSlice] searchWordEnglish.fulfilled - English word search completed:', {
        //   definition: action.payload.definition,
        //   review: action.payload.review
        // });
        
        state.isLoading = false;
        state.definition = action.payload.definition;
        state.review = action.payload.review;
        state.showModal = true;
      })
      .addCase(searchWordEnglish.rejected, (state, action) => {
        // console.error('[WordSearchSlice] searchWordEnglish.rejected - Error:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
        state.showModal = false;
      });
  },
});

// Export actions
export const {
  setCurrentWord,
  clearCurrentWord,
  setShowModal,
  clearError,
  resetWordSearch,
} = wordSearchSlice.actions;

// Export reducer
export default wordSearchSlice.reducer;