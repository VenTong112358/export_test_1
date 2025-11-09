import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { SentenceAnalysisRequest, SentenceTranslationApi, SentenceTranslationRequest } from '@data/api/SentenceTranslationApi';

// Types
export interface SentenceTranslationState {
  selectedSentence: string | null;
  explanation: string | null;
  isLoading: boolean;
  error: string | null;
  showModal: boolean;
  modalPosition: { x: number; y: number } | null;
}

// Initial state
const initialState: SentenceTranslationState = {
  selectedSentence: null,
  explanation: null,
  isLoading: false,
  error: null,
  showModal: false,
  modalPosition: null,
};

// Async thunks
export const getSentenceExplanation = createAsyncThunk(
  'sentenceTranslation/getSentenceExplanation',
  async ({ userId, request }: { userId: number; request: SentenceTranslationRequest }, { rejectWithValue }) => {
    console.log('[SentenceTranslationUseCase] getSentenceExplanation thunk called with:', { userId, content: request.content });
    
    try {
      const sentenceTranslationApi = SentenceTranslationApi.getInstance();
      console.log('[SentenceTranslationUseCase] SentenceTranslationApi instance obtained, calling getSentenceExplanation...');
      
      const response = await sentenceTranslationApi.getSentenceExplanation(userId, request);
      console.log('[SentenceTranslationUseCase] getSentenceExplanation response:', response);
      
      return response;
    } catch (error) {
      console.error('[SentenceTranslationUseCase] getSentenceExplanation error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const getSentenceTranslation = createAsyncThunk(
  'sentenceTranslation/getSentenceTranslation',
  async ({ category, request }: { category: string; request: SentenceAnalysisRequest }, { rejectWithValue }) => {
    console.log('[SentenceTranslationUseCase] getSentenceTranslation thunk called with:', { category, content: request.content });
    
    try {
      const sentenceTranslationApi = SentenceTranslationApi.getInstance();
      const response = await sentenceTranslationApi.getSentenceTranslation(category, request); 
      console.log('[SentenceTranslationUseCase] getSentenceTranslation response:', response);
      
      return response;
    } catch (error) {
      console.error('[SentenceTranslationUseCase] getSentenceTranslation error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// New streaming versions
export const getSentenceExplanationStream = createAsyncThunk(
  'sentenceTranslation/getSentenceExplanationStream',
  async ({ 
    userId, 
    request, 
    onChunk,
    abortController
  }: { 
    userId: number; 
    request: SentenceTranslationRequest; 
    onChunk: (chunk: string) => void;
    abortController?: AbortController;
  }, { rejectWithValue }) => {
    console.log('[SentenceTranslationUseCase] getSentenceExplanationStream thunk called with:', { userId, content: request.content });
    
    try {
      const sentenceTranslationApi = SentenceTranslationApi.getInstance();
      console.log('[SentenceTranslationUseCase] SentenceTranslationApi instance obtained, calling getSentenceExplanationStream...');
      
      const response = await sentenceTranslationApi.getSentenceExplanation(userId, request, onChunk, abortController);
      console.log('[SentenceTranslationUseCase] getSentenceExplanationStream response:', response);
      
      return response;
    } catch (error) {
      console.error('[SentenceTranslationUseCase] getSentenceExplanationStream error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

export const getSentenceTranslationStream = createAsyncThunk(
  'sentenceTranslation/getSentenceTranslationStream',
  async ({ 
    category, 
    request, 
    onChunk,
    abortController
  }: { 
    category: string; 
    request: SentenceAnalysisRequest; 
    onChunk: (chunk: string) => void;
    abortController?: AbortController;
  }, { rejectWithValue }) => {
    console.log('[SentenceTranslationUseCase] getSentenceTranslationStream thunk called with:', { category, content: request.content });
    
    try {
      const sentenceTranslationApi = SentenceTranslationApi.getInstance();
      const response = await sentenceTranslationApi.getSentenceTranslation(category, request, onChunk, abortController);
      console.log('[SentenceTranslationUseCase] getSentenceTranslationStream response:', response);
      
      return response;
    } catch (error) {
      console.error('[SentenceTranslationUseCase] getSentenceTranslationStream error:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Unknown error');
    }
  }
);

// Slice
const sentenceTranslationSlice = createSlice({
  name: 'sentenceTranslation',
  initialState,
  reducers: {
    setSelectedSentence: (state, action: PayloadAction<string>) => {
      console.log('[SentenceTranslationSlice] Setting selected sentence:', action.payload);
      state.selectedSentence = action.payload;
    },
    clearSelectedSentence: (state) => {
      console.log('[SentenceTranslationSlice] Clearing selected sentence');
      state.selectedSentence = null;
      state.explanation = null;
    },
    setShowModal: (state, action: PayloadAction<boolean>) => {
      console.log('[SentenceTranslationSlice] Setting show modal:', action.payload);
      state.showModal = action.payload;
    },
    setModalPosition: (state, action: PayloadAction<{ x: number; y: number }>) => {
      console.log('[SentenceTranslationSlice] Setting modal position:', action.payload);
      state.modalPosition = action.payload;
    },
    clearError: (state) => {
      console.log('[SentenceTranslationSlice] Clearing error');
      state.error = null;
    },
    resetSentenceTranslation: (state) => {
      console.log('[SentenceTranslationSlice] Resetting sentence translation state');
      state.selectedSentence = null;
      state.explanation = null;
      state.isLoading = false;
      state.error = null;
      state.showModal = false;
      state.modalPosition = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Get Sentence Explanation
      .addCase(getSentenceExplanation.pending, (state) => {
        console.log('[SentenceTranslationSlice] getSentenceExplanation.pending - Setting loading state');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(getSentenceExplanation.fulfilled, (state, action) => {
        console.log('[SentenceTranslationSlice] getSentenceExplanation.fulfilled - Explanation received:', {
          explanationLength: action.payload.length
        });
        
        state.isLoading = false;
        state.explanation = action.payload;
      })
      .addCase(getSentenceExplanation.rejected, (state, action) => {
        console.error('[SentenceTranslationSlice] getSentenceExplanation.rejected - Error:', action.payload);
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

// Export actions
export const {
  setSelectedSentence,
  clearSelectedSentence,
  setShowModal,
  setModalPosition,
  clearError,
  resetSentenceTranslation,
} = sentenceTranslationSlice.actions;

// Export reducer
export default sentenceTranslationSlice.reducer;