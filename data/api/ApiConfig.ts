export const API_CONFIG = {
  // 统一API路径格式
  BASE_URL: 'https://masterwordai.com/test',
  // BASE_URL: 'http://10.0.2.2:8000/test',
  WS_BASE_URL: 'wss://masterwordai.com/test/generation2',
  // WS_BASE_URL: 'ws://10.0.2.2:8000/test/generation2',
  TIMEOUT: 30000, // 从10秒增加到30秒
  REFRESH_TIMEOUT: 5000,
  HEADERS: {
    'Content-Type': 'application/json',
  },
};

/**
 * Helper to set authorization token in API_CONFIG headers
 * @param token The access token
 */
export function setApiAuthToken(token: string): void {
  (API_CONFIG as any).HEADERS.Authorization = `Bearer ${token}`;
}

/**
 * Helper to get authorization token from API_CONFIG headers
 * @returns The access token or null
 */
export function getApiAuthToken(): string | null {
  const auth = (API_CONFIG as any)?.HEADERS?.Authorization;
  if (!auth || typeof auth !== "string") return null;
  return auth.toLowerCase().startsWith("bearer ") ? auth.slice(7) : auth;
}

/**
 * Helper to clear authorization token
 */
export function clearApiAuthToken(): void {
  delete (API_CONFIG as any).HEADERS?.Authorization;
}

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: '/logintest',
    REGISTER: '/register',
    SMS_REGISTER: '/register', // 修改为 /register
    PASSWORD_RECOVERY: '/password_recovery',
    REFRESH: '/refresh', // 用于刷新access_token和refresh_token
    CHANGE_PHONE: '/change_phone_number',
    // SMS验证码端点
    SEND_CODE: '/auth/send_code',
    // VERIFY_CODE: '/auth/verify_code',
  },
  VERSION: '/version',
  /**
   * Initiates the daily learning pipeline for the user (JWT required).
   * POST /test/account_initiation/{word_book_id}/{daily_goal}
   * Returns: { date, log_ids, daily_new_word_ids, daily_review_word_ids, outlines_saved }
   */
  ACCOUNT_INITIATION: (wordBookId: number, dailyGoal: number) => `/account_initiation/${wordBookId}/${dailyGoal}`,
  SET_DAILY_GOAL: (goal: number) => `/set_daily_goal/${goal}`,
  
  // Dashboard & Learning Logs
  DAILY_LEARNING_LOGS: '/daily_learning_logs', // JWT版本会自动推断用户ID
  
  // Generation & Content
  GENERATION_STREAM: (logId: number) => `/generation/${logId}`,
  CHECK_LOG_STATUS: (logId: number) => `/check_log_status/${logId}`,
  
  // Word Search & Management
  WORD_SEARCH: (logId: number, word: string) => `/word_search/${logId}/${word}`,
  WORD_UNSEARCH: (logId: number, word: string) => `/word_unsearch/${logId}/${word}`,
  ENGLISH_WORD_SEARCH: (logId: number, word: string) => `/english_word_search/${logId}/${word}`,
  WORD_LEARNING_HISTORY: (wordId: number) => `/word_learning_history/${wordId}`, // JWT版本会自动推断用户ID
  
  // Content & Translation
  CONTENT_SEARCH: (category: string) => `/content_search/${category}`,
  PHRASE_EXPLANATION: `/phrase_explanation`,
  SENTENCE_TRANSLATION: (category: string) => `/content_search/${category}`,
  
  // Saved Phrases (新增)
  SAVE_PHRASE: '/save_phrase',
  SAVE_PHRASE_NOTE: '/save_phrase_note',
  UNSAVE_PHRASE: '/unsave_phrase',
  SAVED_PHRASES: '/saved_phrases', // JWT版本会自动推断用户ID
  
  // Articles Library (新增)
  // 确保这些端点存在
  SAVE_ARTICLE: (logId: number) => `/save_article/${logId}`,
  UNSAVE_ARTICLE: (logId: number) => `/unsave_article/${logId}`,
// 由于上方已有同名属性，此处删除重复的 ENGLISH_WORD_SEARCH 定义
  SAVED_ARTICLE: '/saved_article', // JWT版本会自动推断用户ID
  ALL_ARTICLE: '/all_article', // JWT版本会自动推断用户ID
  LEARNING_LOGS_FEEDBACK: (logId: number) => `/learning_logs_feedback/${logId}`,
  
  // Study Flow (新增)
  FINISH_READING: (logId: number) => `/finish_reading/${logId}`,
  FINISH_STUDY: '/finish_study', // JWT版本会自动推断用户ID
  APPRECIATION: (logId: number, level: number) => `/appreciation/${logId}/${level}`,
  
  // Word Definition Test (新增)
  DEFINITION: (wordId: number) => `/definition/${wordId}`,
  
  // Text-to-Speech (新增)
  SPEAK: '/speak',
  
  // Words API
  WORDS: {
    LIST: '/words/analyze',
    DETAIL: (word: string) => `/words/${word}`,
  },
  
  // Words with Caiji API
  WORDS_WITH_CAIJI: '/words_with_caiji',
  
  // Articles API
  ARTICLES: {
    PROGRESS: '/articles/progress',
    RATE: '/articles/rate',
  },
};
