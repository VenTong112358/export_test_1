import { createAsyncThunk, createSlice, PayloadAction } from '@reduxjs/toolkit';
import { DailyLearningLogsRepositoryImpl } from '@data/repository/DailyLearningLogsRepository';
import { DailyLearningLogsResponse, DailyLearningLog, AdditionalInformation } from '@data/model/DailyLearningLog';

// State类型定义
export interface DailyLearningLogsState {
  logs: DailyLearningLog[];
  currentLog: DailyLearningLog | null;
  isLoading: boolean;
  error: string | null;
  lastFetched: string | null;
  selectedFilters: {
    date?: string;
    tag?: string;
    CEFR?: string;
  };
  additional_information?: AdditionalInformation;
}

// 初始状态
const initialState: DailyLearningLogsState = {
  logs: [],
  currentLog: null,
  isLoading: false,
  error: null,
  lastFetched: null,
  selectedFilters: {},
  additional_information: undefined,
};

// Repository实例
const repository = new DailyLearningLogsRepositoryImpl();

// Async Thunks
export const fetchDailyLearningLogs = createAsyncThunk(
  'dailyLearningLogs/fetchLogs',
  async (userName: string, { rejectWithValue }) => {
    console.log('[UseCase] Fetching daily learning logs for userName:', userName);
    
    try {
      // 实际上后端会从 access_token 里取 userId，不需要参数
      const response = await repository.fetchDailyLearningLogs();
      console.log('[UseCase] Successfully fetched logs:', {
        count: response.logs.length,
        firstLogTitle: response.logs[0]?.english_title,
        hasAdditionalInfo: !!response.additional_information
      });
      return response;
    } catch (error) {
      console.error('[UseCase] Failed to fetch logs:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch logs');
    }
  }
);

export const fetchDailyLearningLogsByDate = createAsyncThunk(
  'dailyLearningLogs/fetchLogsByDate',
  async ({ userId, date }: { userId: number; date: string }, { rejectWithValue }) => {
    console.log('[UseCase] Fetching daily learning logs for user:', userId, 'date:', date);
    
    try {
      const response = await repository.fetchDailyLearningLogsByDate(userId, date);
      console.log('[UseCase] Successfully fetched logs by date:', {
        count: response.logs.length,
        date,
        hasAdditionalInfo: !!response.additional_information
      });
      return response;
    } catch (error) {
      console.error('[UseCase] Failed to fetch logs by date:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch logs by date');
    }
  }
);

export const fetchDailyLearningLogsByTag = createAsyncThunk(
  'dailyLearningLogs/fetchLogsByTag',
  async ({ userId, tag }: { userId: number; tag: string }, { rejectWithValue }) => {
    console.log('[UseCase] Fetching daily learning logs for user:', userId, 'tag:', tag);
    
    try {
      const response = await repository.fetchDailyLearningLogsByTag(userId, tag);
      console.log('[UseCase] Successfully fetched logs by tag:', {
        count: response.logs.length,
        tag,
        hasAdditionalInfo: !!response.additional_information
      });
      return response;
    } catch (error) {
      console.error('[UseCase] Failed to fetch logs by tag:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to fetch logs by tag');
    }
  }
);

export const clearDailyLearningLogsCache = createAsyncThunk(
  'dailyLearningLogs/clearCache',
  async (userId: number, { rejectWithValue }) => {
    console.log('[UseCase] Clearing cache for user:', userId);
    
    try {
      await repository.clearCache(userId);
      console.log('[UseCase] Successfully cleared cache for user:', userId);
      return { userId };
    } catch (error) {
      console.error('[UseCase] Failed to clear cache:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to clear cache');
    }
  }
);

// Slice
const dailyLearningLogsSlice = createSlice({
  name: 'dailyLearningLogs',
  initialState,
  reducers: {
    setCurrentLog: (state, action: PayloadAction<DailyLearningLog>) => {
      console.log('[DailyLearningLogsSlice] Setting current log:', action.payload.id);
      state.currentLog = action.payload;
    },
    clearCurrentLog: (state) => {
      console.log('[DailyLearningLogsSlice] Clearing current log');
      state.currentLog = null;
    },
    clearError: (state) => {
      console.log('[DailyLearningLogsSlice] Clearing error');
      state.error = null;
    },
    resetLogs: (state) => {
      console.log('[DailyLearningLogsSlice] Resetting logs state');
      state.logs = [];
      state.currentLog = null;
      state.error = null;
      state.lastFetched = null;
      state.selectedFilters = {};
      state.additional_information = undefined;
    },
    setFilters: (state, action: PayloadAction<{ date?: string; tag?: string; CEFR?: string }>) => {
      console.log('[DailyLearningLogsSlice] Setting filters:', action.payload);
      state.selectedFilters = { ...state.selectedFilters, ...action.payload };
    },
    clearFilters: (state) => {
      console.log('[DailyLearningLogsSlice] Clearing filters');
      state.selectedFilters = {};
    },
    updateLogStatus: (state, action: PayloadAction<{ logId: number; status: 'unlearned' | 'learning' | 'learned' }>) => {
      console.log('[DailyLearningLogsSlice] Updating log status:', action.payload.logId, action.payload.status);
      console.log('[DailyLearningLogsSlice] state.logs+++++++++++++++++++++++++++++', state.logs);
      console.log('[DailyLearningLogsSlice] action.payload+++++++++++++++++++++++++++++', action.payload);
      state.logs = state.logs.map(log => ({
        ...log,
        status: log.id === action.payload.logId ? action.payload.status : log.status
      }));
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Daily Learning Logs
      .addCase(fetchDailyLearningLogs.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyLearningLogs.fulfilled, (state, action) => {
        state.isLoading = false;
        state.logs = action.payload.logs
        state.additional_information = action.payload.additional_information;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDailyLearningLogs.rejected, (state, action) => {
        console.log('[DailyLearningLogsSlice] fetchDailyLearningLogs.rejected');
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Daily Learning Logs By Date
      .addCase(fetchDailyLearningLogsByDate.pending, (state) => {
        console.log('[DailyLearningLogsSlice] fetchDailyLearningLogsByDate.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyLearningLogsByDate.fulfilled, (state, action) => {
        console.log('[DailyLearningLogsSlice] fetchDailyLearningLogsByDate.fulfilled');
        state.isLoading = false;
        state.logs = action.payload.logs;
        state.additional_information = action.payload.additional_information;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDailyLearningLogsByDate.rejected, (state, action) => {
        console.log('[DailyLearningLogsSlice] fetchDailyLearningLogsByDate.rejected');
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Fetch Daily Learning Logs By Tag
      .addCase(fetchDailyLearningLogsByTag.pending, (state) => {
        console.log('[DailyLearningLogsSlice] fetchDailyLearningLogsByTag.pending');
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchDailyLearningLogsByTag.fulfilled, (state, action) => {
        console.log('[DailyLearningLogsSlice] fetchDailyLearningLogsByTag.fulfilled');
        state.isLoading = false;
        state.logs = action.payload.logs;
        state.additional_information = action.payload.additional_information;
        state.lastFetched = new Date().toISOString();
        state.error = null;
      })
      .addCase(fetchDailyLearningLogsByTag.rejected, (state, action) => {
        console.log('[DailyLearningLogsSlice] fetchDailyLearningLogsByTag.rejected');
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // Clear Cache
      .addCase(clearDailyLearningLogsCache.fulfilled, (state) => {
        console.log('[DailyLearningLogsSlice] clearDailyLearningLogsCache.fulfilled');
        // 可以选择是否重置状态
        // state.logs = [];
        // state.lastFetched = null;
      });
  },
});

// Export actions and reducer
export const {
  setCurrentLog,
  clearCurrentLog,
  clearError,
  resetLogs,
  setFilters,
  clearFilters,
  updateLogStatus,
} = dailyLearningLogsSlice.actions;

export default dailyLearningLogsSlice.reducer; 