// Data models for word preview functionality

export interface WordPreviewState {
  words: DailyNewWord[];
  hiddenWords: Set<number>;
  showEnglish: boolean;
  showChinese: boolean;
  isLoading: boolean;
  error: string | null;
}

export interface WordPreviewProps {
  logId: number;
  words: DailyNewWord[];
  onStartLearning: (logId: number) => void;
}

// Re-export DailyNewWord from DailyLearningLog for convenience
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