import { WordBook } from './WordBook';

// 定义API返回的数据结构
export interface DailyNewWord {
  id: number;
  word: string;
  definition: string;
  CEFR: string;
  phonetic: string;
  l_tags: Array<{ name: string }>;
  l_word_statuss: Array<{
    status: 'unlearned' | 'learning' | 'learned';
    learning_factor: number;
  }>;
}

// 学习进度和设置信息
export interface AdditionalInformation {
  word_book: WordBook;
  learning_plan: LearningPlan;
  user_learning_stats: UserLearningStats;
  // 保留原有字段以保持向后兼容
  word_book_id?: number;
  daily_goal?: number;
  learning_proportion?: number;
  learned_proportion?: number;
  progression?: number;
  total?: number;
}

export interface DailyLearningLog {
  id: number;
  user_id: number;
  date: string;
  tag: string;
  CEFR: string;
  english_title: string;
  chinese_title: string;
  outline: string;
  daily_new_words: DailyNewWord[];
  additional_information?: AdditionalInformation;
  status?: 'unlearned' | 'learning' | 'learned';
}

export interface DailyLearningLogsResponse {
  logs: DailyLearningLog[];
  additional_information?: AdditionalInformation;
}

// 辅助类型定义
export interface WordStatus {
  status: 'unlearned' | 'learning' | 'learned';
  learning_factor: number;
}

export interface WordTag {
  name: string;
}

// 用于过滤和搜索的类型
export interface DailyLearningLogsFilters {
  date?: string;
  tag?: string;
  CEFR?: string;
  userId?: number;
}

// 学习计划设置
export interface LearningPlan {
  word_book_id: number;
  daily_goal: number;
  current_progression: number;
  total_words: number;
  learning_proportion: number;
  learned_proportion: number;
}

// 用户学习统计
export interface UserLearningStats {
  total_words_learned: number;
  current_streak: number;
  longest_streak: number;
  average_daily_words: number;
  completion_rate: number;
} 