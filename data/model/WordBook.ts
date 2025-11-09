// 单词本信息模型
export interface WordBook {
  id: number;
  name: string;
  description?: string;
  total_words: number;
  difficulty_level?: string;
  created_at?: string;
  updated_at?: string;
  is_active?: boolean;
  category?: string;
  target_audience?: string;
  estimated_completion_time?: number; // 预计完成时间（天）
}

// 单词本列表响应
export interface WordBookListResponse {
  word_books: WordBook[];
  total_count: number;
  current_page: number;
  total_pages: number;
}

// 单词本详情响应
export interface WordBookDetailResponse {
  word_book: WordBook;
  word_list?: WordBookWord[];
  statistics?: WordBookStatistics;
}

// 单词本中的单词
export interface WordBookWord {
  id: number;
  word: string;
  definition: string;
  phonetic: string;
  CEFR: string;
  part_of_speech?: string;
  example_sentence?: string;
  difficulty_score?: number;
  frequency_rank?: number;
}

// 单词本统计信息
export interface WordBookStatistics {
  total_words: number;
  learned_words: number;
  learning_words: number;
  unlearned_words: number;
  completion_percentage: number;
  average_difficulty: number;
  estimated_remaining_time: number; // 预计剩余时间（天）
}

// 用户单词本关联
export interface UserWordBook {
  user_id: number;
  word_book_id: number;
  started_at: string;
  current_progression: number;
  is_active: boolean;
  daily_goal: number;
  last_studied_at?: string;
  completion_rate: number;
}

// 单词本选择请求
export interface SelectWordBookRequest {
  user_id: number;
  word_book_id: number;
  daily_goal: number;
}

// 单词本更新请求
export interface UpdateWordBookRequest {
  daily_goal?: number;
  is_active?: boolean;
}

// ==================== 单词本数据 ====================

// 临时单词本数据
export const wordBooks: WordBook[] = [
  { 
    id: 3, 
    name: '四级', 
    difficulty_level: 'college',
    total_words: 4430,
    description: '大学英语四级考试词汇',
    category: 'college',
    target_audience: '大学生',
    estimated_completion_time: 90
  },
  { 
    id: 4, 
    name: '六级', 
    difficulty_level: 'college',
    total_words: 2996,
    description: '大学英语六级考试词汇',
    category: 'college',
    target_audience: '大学生',
    estimated_completion_time: 120
  },
  { 
    id: 2, 
    name: '高中', 
    difficulty_level: 'highschool',
    total_words: 3406,
    description: '高中英语词汇',
    category: 'highschool',
    target_audience: '高中生',
    estimated_completion_time: 70
  },
  { 
    id: 1, 
    name: '初中', 
    difficulty_level: 'midschool',
    total_words: 2000,
    description: '初中英语词汇',
    category: 'midschool',
    target_audience: '初中生',
    estimated_completion_time: 40
  },
  { 
    id: 8, 
    name: '雅思', 
    difficulty_level: 'studyabroad',
    total_words: 4318,
    description: '雅思考试词汇',
    category: 'studyabroad',
    target_audience: '留学考生',
    estimated_completion_time: 150
  },
  { 
    id: 7, 
    name: '考研', 
    difficulty_level: 'college',
    total_words: 5197,
    description: '研究生入学考试词汇',
    category: 'college',
    target_audience: '考研学生',
    estimated_completion_time: 180
  },
  { 
    id: 5, 
    name: '专四', 
    difficulty_level: 'college',
    total_words: 8000,
    description: '英语专业四级考试词汇',
    category: 'college',
    target_audience: '英语专业学生',
    estimated_completion_time: 200
  },
  { 
    id: 6, 
    name: '专八', 
    difficulty_level: 'college',
    total_words: 4011,
    description: '英语专业八级考试词汇',
    category: 'college',
    target_audience: '英语专业学生',
    estimated_completion_time: 250
  },
  { 
    id: 9, 
    name: '托福', 
    difficulty_level: 'studyabroad',
    total_words: 6500,
    description: '托福考试词汇',
    category: 'studyabroad',
    target_audience: '留学考生',
    estimated_completion_time: 160
  },
];

// 工具函数
export const getWordBookById = (id: number): WordBook | undefined => {
  return wordBooks.find(book => book.id === id);
};

export const getWordBooksByCategory = (category: string): WordBook[] => {
  return wordBooks.filter(book => book.category === category);
};

export const getCategories = (): string[] => {
  return [...new Set(wordBooks.map(book => book.category).filter((category): category is string => !!category))];
};

export const getAllWordBooks = (): WordBook[] => {
  return wordBooks;
}; 