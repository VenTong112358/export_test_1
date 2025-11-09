import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DailyLearningLog } from '@data/model/DailyLearningLog';
import { DailyLearningLogsRepositoryImpl } from '@data/repository/DailyLearningLogsRepository';
import { RootState } from '@data/repository/store';

export const useDailyLearningLog = (logId: number | null) => {
  const [log, setLog] = useState<DailyLearningLog | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSelector((state: RootState) => state.auth);
  const { logs } = useSelector((state: RootState) => state.dailyLearningLogs);
  
  const repository = new DailyLearningLogsRepositoryImpl();

  useEffect(() => {
    const fetchLog = async () => {
      if (!logId) {
        setLog(null);
        return;
      }

      setIsLoading(true);
      setError(null);

      try {
        console.log('[useDailyLearningLog] Fetching log with ID:', logId);
        
        // 首先尝试从Redux state中查找
        const existingLog = logs.find(l => l.id === logId);
        if (existingLog) {
          console.log('[useDailyLearningLog] Found log in Redux state:', existingLog.id);
          setLog(existingLog);
          setIsLoading(false);
          return;
        }
        
        // 如果Redux中没有，尝试从repository获取
        console.log('[useDailyLearningLog] Log not found in Redux, fetching from repository');
        const fetchedLog = await repository.getLogById(logId);
        console.log('[useDailyLearningLog] fetchedLog+++++++++++++++++++++++++++++', fetchedLog);
        if (fetchedLog) {
          console.log('[useDailyLearningLog] Successfully fetched log from repository:', fetchedLog.id);
          setLog(fetchedLog);
        } else {
          console.log('[useDailyLearningLog] Log not found in repository');
          setError('Log not found in API');
        }
      } catch (err) {
        console.error('[useDailyLearningLog] Error:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch log');
      } finally {
        setIsLoading(false);
      }
    };

    fetchLog();
  }, [logId, logs, user?.id]);

  return {
    log,
    isLoading,
    error,
    newWords: log?.daily_new_words || [],
    // 新增的信息字段
    wordBook: log?.additional_information?.word_book || null,
    learningPlan: log?.additional_information?.learning_plan || null,
    userLearningStats: log?.additional_information?.user_learning_stats || null,
    // 便捷访问方法
    dailyGoal: log?.additional_information?.learning_plan?.daily_goal || 0,
    currentWordBook: log?.additional_information?.word_book?.name || '',
    totalWordsLearned: log?.additional_information?.user_learning_stats?.total_words_learned || 0,
    currentStreak: log?.additional_information?.user_learning_stats?.current_streak || 0,
    longestStreak: log?.additional_information?.user_learning_stats?.longest_streak || 0,
  };
}; 
export default useDailyLearningLog;