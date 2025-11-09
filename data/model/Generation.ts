// Data models for article generation

export interface GenerationRequest {
  logId: number;
}

export interface GenerationResponse {
  success: boolean;
  error?: string;
  content?: string;
}

export interface ArticleContent {
  id: string;
  title: string;
  content: string;
  logId: number;
  generatedAt: string;
}

export interface GenerationState {
  isGenerating: boolean;
  content: string;
  error: string | null;
  currentLogId: number | null;
}

// Error types for generation
export enum GenerationError {
  LOG_NOT_FOUND = 'Learning log does not exist',
  LOG_NOT_BOUND = 'This log is not bound to daily new words',
  NETWORK_ERROR = 'Network error occurred',
  TIMEOUT_ERROR = 'Generation timeout',
  UNKNOWN_ERROR = 'Unknown error occurred',
} 