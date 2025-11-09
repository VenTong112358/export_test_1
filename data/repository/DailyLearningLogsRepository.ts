import { createSlice, PayloadAction, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { SafeJsonUtils } from '@/utils/SafeJsonUtils';
import { DailyLearningLogsApi } from '@data/api/DailyLearningLogsApi';
import { 
  DailyLearningLogsResponse, 
  DailyLearningLog, 
  DailyLearningLogsFilters 
} from '@data/model/DailyLearningLog';

// 缓存键名常量
const CACHE_KEYS = {
  DAILY_LOGS: '@daily_learning_logs',
  LAST_FETCHED: '@last_fetched_logs',
  CACHE_DURATION: '@cache_duration',
} as const;

// 缓存持续时间（24小时）
const CACHE_DURATION = 24 * 60 * 60 * 1000;

// Repository接口定义
export interface DailyLearningLogsRepository {
  fetchDailyLearningLogs(): Promise<DailyLearningLogsResponse>;
  fetchDailyLearningLogsByDate(date: string): Promise<DailyLearningLogsResponse>;
  fetchDailyLearningLogsByTag(tag: string): Promise<DailyLearningLogsResponse>;
  getLogById(logId: number): Promise<DailyLearningLog | null>;
  getLogsByDate(date: string): Promise<DailyLearningLog[]>;
  getCachedLogs(): Promise<DailyLearningLogsResponse | null>;
  cacheLogs(logs: DailyLearningLogsResponse): Promise<void>;
  clearCache(): Promise<void>;
  isCacheValid(): Promise<boolean>;
}

// Repository实现类
export class DailyLearningLogsRepositoryImpl implements DailyLearningLogsRepository {
  private api: DailyLearningLogsApi;

  constructor() {
    this.api = DailyLearningLogsApi.getInstance();
  }

  /**
   * 获取每日学习日志
   */
  async fetchDailyLearningLogs(): Promise<DailyLearningLogsResponse> {
    console.log('[Repository] 获取每日学习日志');
    
    try {
      // 首先检查缓存
      const cached = await this.getCachedLogs();
      const isCacheValid = await this.isCacheValid();
      
      if (cached && isCacheValid) {
        console.log('[Repository] 使用缓存数据');
        return cached;
      }
      
      // 从API获取数据
      const response = await this.api.fetchDailyLearningLogs();
      
      // 缓存数据
      await this.cacheLogs(response);
      
      console.log('[Repository] 成功获取并缓存日志');
      return response;
    } catch (error) {
      console.error('[Repository] 获取日志错误:', error);
      throw error;
    }
  }

  /**
   * 根据日期获取学习日志
   */
  async fetchDailyLearningLogsByDate(date: string): Promise<DailyLearningLogsResponse> {
    console.log('[Repository] 根据日期获取日志:', date);
    
    try {
      const response = await this.api.fetchDailyLearningLogsByDate(date);
      console.log('[Repository] 成功根据日期获取日志');
      return response;
    } catch (error) {
      console.error('[Repository] 根据日期获取日志错误:', error);
      throw error;
    }
  }

  /**
   * 根据标签获取学习日志
   */
  async fetchDailyLearningLogsByTag(tag: string): Promise<DailyLearningLogsResponse> {
    console.log('[Repository] 根据标签获取日志:', tag);
    
    try {
      const response = await this.api.fetchDailyLearningLogsByTag(tag);
      console.log('[Repository] 成功根据标签获取日志');
      return response;
    } catch (error) {
      console.error('[Repository] 根据标签获取日志错误:', error);
      throw error;
    }
  }

  /**
   * 根据ID获取单个日志
   */
  // 修复第117行和第148行的类型问题
  async getLogById(logId: number): Promise<DailyLearningLog | null> {
    console.log('[Repository] 根据ID获取日志:', logId);
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => key.startsWith(CACHE_KEYS.DAILY_LOGS));
      
      for (const key of logKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const data = SafeJsonUtils.safeParse(cached, { logs: [] }) as DailyLearningLogsResponse;
          // 确保logs是数组
          const logs = Array.isArray(data.logs) ? data.logs : [];
          const log = logs.find(l => l.id === logId);
          if (log) {
            console.log('[Repository] 根据ID找到日志:', logId);
            return log;
          }
        }
      }
      
      console.log('[Repository] 根据ID未找到日志:', logId);
      return null;
    } catch (error) {
      console.error('[Repository] 根据ID获取日志错误:', logId, error);
      return null;
    }
  }

  /**
   * 根据日期获取日志列表
   */
  async getLogsByDate(date: string): Promise<DailyLearningLog[]> {
    console.log('[Repository] 根据日期获取日志列表:', date);
    
    try {
      const keys = await AsyncStorage.getAllKeys();
      const logKeys = keys.filter(key => key.startsWith(CACHE_KEYS.DAILY_LOGS));
      const logs: DailyLearningLog[] = [];
      
      for (const key of logKeys) {
        const cached = await AsyncStorage.getItem(key);
        if (cached) {
          const data = SafeJsonUtils.safeParse(cached, { logs: [] }) as DailyLearningLogsResponse;
          // 确保logs是数组
          const dataLogs = Array.isArray(data.logs) ? data.logs : [];
          const dateLogs = dataLogs.filter(l => l.date === date);
          logs.push(...dateLogs);
        }
      }
      
      console.log('[Repository] 找到', logs.length, '条日期日志:', date);
      return logs;
    } catch (error) {
      console.error('[Repository] 根据日期获取日志错误:', date, error);
      return [];
    }
  }

  /**
   * 获取缓存的日志
   */
  async getCachedLogs(): Promise<DailyLearningLogsResponse | null> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.DAILY_LOGS);
      return SafeJsonUtils.safeParse<DailyLearningLogsResponse>(cached, null);
    } catch (error) {
      console.error('[Repository] 获取缓存日志错误:', error);
      // 清理损坏的缓存
      await AsyncStorage.removeItem(CACHE_KEYS.DAILY_LOGS);
      return null;
    }
  }

  /**
   * 缓存日志数据
   */
  async cacheLogs(logs: DailyLearningLogsResponse): Promise<void> {
    try {
      const jsonString = SafeJsonUtils.safeStringify(logs);
      await AsyncStorage.setItem(CACHE_KEYS.DAILY_LOGS, jsonString);
      await AsyncStorage.setItem(CACHE_KEYS.LAST_FETCHED, new Date().toISOString());
      console.log('[Repository] 成功缓存日志');
    } catch (error) {
      console.error('[Repository] 缓存日志错误:', error);
    }
  }

  /**
   * 检查缓存是否有效
   */
  async isCacheValid(): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(CACHE_KEYS.DAILY_LOGS);
      if (!cached) return false;
      
      const data = SafeJsonUtils.safeParse<DailyLearningLogsResponse>(cached, null);
      if (!data) return false;
      
      const today = new Date().toISOString().split('T')[0];
      const hasTodayLog = Array.isArray(data.logs) && data.logs.some(log => log.date === today);
      console.log('[Repository] 缓存有效性 - 有今日日志:', hasTodayLog);
      return hasTodayLog;
    } catch (error) {
      console.error('[Repository] 检查缓存有效性错误:', error);
      return false;
    }
  }
  
  /**
   * 清除缓存
   */
  async clearCache(): Promise<void> {
    try {
      await AsyncStorage.multiRemove([CACHE_KEYS.DAILY_LOGS, CACHE_KEYS.LAST_FETCHED]);
      console.log('[Repository] 成功清除缓存');
    } catch (error) {
      console.error('[Repository] 清除缓存错误:', error);
    }
  }
}

// Redux状态接口
interface DailyLearningLogsState {
  logs: DailyLearningLog[];
  loading: boolean;
  error: string | null;
  lastFetched: string | null;
  filters: DailyLearningLogsFilters;
}

// 初始状态
const initialState: DailyLearningLogsState = {
  logs: [],
  loading: false,
  error: null,
  lastFetched: null,
  filters: {},
};

// 异步操作：保存学习日志
export const saveDailyLearningLogAsync = createAsyncThunk(
  'dailyLearningLogs/save',
  async (log: DailyLearningLog, { rejectWithValue }) => {
    try {
      const existingLogsJson = await AsyncStorage.getItem('@daily_learning_logs');
      const existingLogs = SafeJsonUtils.safeParse<DailyLearningLog[]>(existingLogsJson, []) || [];
      
      // 检查是否已存在相同ID的日志
      const existingIndex = existingLogs.findIndex(l => l.id === log.id);
      if (existingIndex >= 0) {
        existingLogs[existingIndex] = log;
      } else {
        existingLogs.push(log);
      }
      
      await SafeJsonUtils.safeSetItem('@daily_learning_logs', existingLogs);
      return log;
    } catch (error: any) {
      console.error('保存学习日志失败:', error);
      return rejectWithValue(error.message || '保存失败');
    }
  }
);

// 异步操作：加载学习日志
export const loadDailyLearningLogsAsync = createAsyncThunk(
  'dailyLearningLogs/load',
  async (_, { rejectWithValue }) => {
    try {
      const logsJson = await AsyncStorage.getItem('@daily_learning_logs');
      return SafeJsonUtils.safeParse<DailyLearningLog[]>(logsJson, []) || [];
    } catch (error: any) {
      console.error('加载学习日志失败:', error);
      return rejectWithValue(error.message || '加载失败');
    }
  }
);

// 异步操作：从API获取日志
export const fetchDailyLearningLogsAsync = createAsyncThunk(
  'dailyLearningLogs/fetch',
  async (filters: DailyLearningLogsFilters = {}, { rejectWithValue }) => {
    try {
      const repository = new DailyLearningLogsRepositoryImpl();
      
      if (filters?.date) {
        return await repository.fetchDailyLearningLogsByDate(filters.date);
      } else if (filters?.tag) {
        return await repository.fetchDailyLearningLogsByTag(filters.tag);
      } else {
        return await repository.fetchDailyLearningLogs();
      }
    } catch (error: any) {
      console.error('获取学习日志失败:', error);
      return rejectWithValue(error.message || '获取失败');
    }
  }
);

// Redux Slice
const dailyLearningLogsSlice = createSlice({
  name: 'dailyLearningLogs',
  initialState,
  reducers: {
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    setLogs: (state, action: PayloadAction<DailyLearningLog[]>) => {
      state.logs = action.payload;
      state.lastFetched = new Date().toISOString();
    },
    addLog: (state, action: PayloadAction<DailyLearningLog>) => {
      const existingIndex = state.logs.findIndex(log => log.id === action.payload.id);
      if (existingIndex >= 0) {
        state.logs[existingIndex] = action.payload;
      } else {
        state.logs.push(action.payload);
      }
    },
    removeLog: (state, action: PayloadAction<number>) => {
      state.logs = state.logs.filter(log => log.id !== action.payload);
    },
    updateLog: (state, action: PayloadAction<DailyLearningLog>) => {
      const index = state.logs.findIndex(log => log.id === action.payload.id);
      if (index >= 0) {
        state.logs[index] = action.payload;
      }
    },
    setFilters: (state, action: PayloadAction<DailyLearningLogsFilters>) => {
      state.filters = action.payload;
    },
    clearLogs: (state) => {
      state.logs = [];
      state.error = null;
      state.lastFetched = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // 保存日志
      .addCase(saveDailyLearningLogAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveDailyLearningLogAsync.fulfilled, (state, action) => {
        state.loading = false;
        const existingIndex = state.logs.findIndex(log => log.id === action.payload.id);
        if (existingIndex >= 0) {
          state.logs[existingIndex] = action.payload;
        } else {
          state.logs.push(action.payload);
        }
      })
      .addCase(saveDailyLearningLogAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 加载日志
      .addCase(loadDailyLearningLogsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadDailyLearningLogsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(loadDailyLearningLogsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // 从API获取日志
      .addCase(fetchDailyLearningLogsAsync.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchDailyLearningLogsAsync.fulfilled, (state, action) => {
        state.loading = false;
        state.logs = action.payload.logs;
        state.lastFetched = new Date().toISOString();
      })
      .addCase(fetchDailyLearningLogsAsync.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

// 导出actions和reducer
export const { 
  setLoading, 
  setError, 
  setLogs, 
  addLog, 
  removeLog, 
  updateLog, 
  setFilters, 
  clearLogs 
} = dailyLearningLogsSlice.actions;

export default dailyLearningLogsSlice.reducer;

// 工具函数：保存学习日志（向后兼容）
export const saveDailyLearningLog = async (log: DailyLearningLog): Promise<void> => {
  try {
    const existingLogsJson = await AsyncStorage.getItem('@daily_learning_logs');
    const existingLogs = SafeJsonUtils.safeParse<DailyLearningLog[]>(existingLogsJson, []) || [];
    
    const existingIndex = existingLogs.findIndex(l => l.id === log.id);
    if (existingIndex >= 0) {
      existingLogs[existingIndex] = log;
    } else {
      existingLogs.push(log);
    }
    
    await SafeJsonUtils.safeSetItem('@daily_learning_logs', existingLogs);
  } catch (error: any) {
    console.error('保存学习日志失败:', error);
    throw error;
  }
};

// 工具函数：加载学习日志（向后兼容）
export const loadDailyLearningLogs = async (): Promise<DailyLearningLog[]> => {
  try {
    const logsJson = await AsyncStorage.getItem('@daily_learning_logs');
    return SafeJsonUtils.safeParse<DailyLearningLog[]>(logsJson, []) || [];
  } catch (error: any) {
    console.error('加载学习日志失败:', error);
    return [];
  }
};