import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';

interface GroupedMonth {
  month: string;
  articleCount: number;
  sentenceCount: number;
}

interface FavouriteSentencesState {
  loading: boolean;
  error: string | null;
  grouped: GroupedMonth[];
  rawLogs: any[];
}

const initialState: FavouriteSentencesState = {
  loading: false,
  error: null,
  grouped: [],
  rawLogs: [],
};

// 创建一个简单的异步操作，返回空数据
export const fetchSavedPhrases = createAsyncThunk(
  'favouriteSentences/fetchSavedPhrases',
  async () => {
    // 返回符合原有接口的空数据
    return {
      grouped: [] as GroupedMonth[],
      rawLogs: [] as any[]
    };
  }
);

const favouriteSentencesSlice = createSlice({
  name: 'favouriteSentences',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchSavedPhrases.pending, state => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchSavedPhrases.fulfilled, (state, action: PayloadAction<{ grouped: GroupedMonth[]; rawLogs: any[] }>) => {
        state.loading = false;
        state.grouped = action.payload.grouped;
        state.rawLogs = action.payload.rawLogs;
      })
      .addCase(fetchSavedPhrases.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || null;
      });
  },
});

export default favouriteSentencesSlice.reducer;