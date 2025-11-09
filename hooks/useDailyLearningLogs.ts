import { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  fetchDailyLearningLogs,
  fetchDailyLearningLogsByDate,
  fetchDailyLearningLogsByTag,
  clearDailyLearningLogsCache,
  setCurrentLog,
  clearCurrentLog,
  clearError,
  resetLogs,
  setFilters,
  clearFilters
} from '@data/usecase/DailyLearningLogsUseCase';
import { RootState, AppDispatch } from '@data/repository/store';

export const useDailyLearningLogs = () => {
  // Debug: log when the hook is called
  console.log('[useDailyLearningLogs] Hook called');
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useSelector((state: RootState) => state.auth);
  const {
    logs,
    currentLog,
    isLoading,
    error,
    lastFetched,
    selectedFilters,
    additional_information
  } = useSelector((state: RootState) => state.dailyLearningLogs);

  // Automatically fetch daily learning logs when user is present and logs are empty
  useEffect(() => {
    if (user && Array.isArray(logs) && logs.length === 0) {
      dispatch(fetchDailyLearningLogs());
    }
  }, [user, logs, dispatch]);

  // Actions (userId is not needed for any API call)
  const fetchLogs = () => {
    dispatch(fetchDailyLearningLogs());
  };

  const fetchLogsByDate = (date: string) => {
    dispatch(fetchDailyLearningLogsByDate({ date }));
  };

  const fetchLogsByTag = (tag: string) => {
    dispatch(fetchDailyLearningLogsByTag({ tag }));
  };

  const clearCache = () => {
    dispatch(clearDailyLearningLogsCache());
  };

  const selectLog = (log: any) => {
    dispatch(setCurrentLog(log));
  };

  const clearSelectedLog = () => {
    dispatch(clearCurrentLog());
  };

  const clearErrorState = () => {
    dispatch(clearError());
  };

  const resetState = () => {
    dispatch(resetLogs());
  };

  const updateFilters = (filters: { date?: string; tag?: string; CEFR?: string }) => {
    dispatch(setFilters(filters));
  };

  const clearFilterState = () => {
    dispatch(clearFilters());
  };

  return {
    // State
    logs,
    currentLog,
    isLoading,
    error,
    lastFetched,
    selectedFilters,
    additional_information,

    // Actions
    fetchLogs,
    fetchLogsByDate,
    fetchLogsByTag,
    clearCache,
    selectLog,
    clearSelectedLog,
    clearErrorState,
    resetState,
    updateFilters,
    clearFilterState,

    // Computed values
    hasLogs: Array.isArray(logs) && logs.length > 0,
    totalWords: Array.isArray(logs) ? logs.reduce((total, log) => total + log.daily_new_words.length, 0) : 0,
    uniqueTags: Array.isArray(logs) ? [...new Set(logs.map(log => log.tag))] : [],
    uniqueCEFR: Array.isArray(logs) ? [...new Set(logs.map(log => log.CEFR))] : [],
    hasUserInfo: !!additional_information,
    hasWordBook: !!additional_information?.word_book,
    hasLearningPlan: !!additional_information?.learning_plan,
    hasUserStats: !!additional_information?.user_learning_stats,

    // Progress Bar Related
    daily_goal: additional_information?.daily_goal || 10,
    logsCount: (() => {
      const goal = additional_information?.daily_goal || 10;
      if (goal === 10) return 1;
      if (goal === 20) return 2;
      if (goal === 30) return 3;
      return 1;
    })(),
    completedCount: Array.isArray(logs) ? logs.filter(log => log.status === 'learned').length : 0,
    progress: (() => {
      const goal = additional_information?.daily_goal || 10;
      let logsCount = 1;
      if (goal === 10) logsCount = 1;
      else if (goal === 20) logsCount = 2;
      else if (goal === 30) logsCount = 3;
      const completed = Array.isArray(logs) ? logs.filter(log => log.status === 'learned').length : 0;
      return logsCount > 0 ? Math.min(completed / logsCount, 1) : 0;
    })(),
  };
};