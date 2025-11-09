import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';
import authReducer, { AuthState } from '@data/usecase/UserUseCase';
import articleReducer, { ArticleState } from '@data/usecase/ArticleUseCase';
import dailyLearningLogsReducer, { DailyLearningLogsState } from '@data/usecase/DailyLearningLogsUseCase';
import wordSearchReducer, { WordSearchState } from '@data/usecase/WordSearchUseCase';
import sentenceTranslationReducer, { SentenceTranslationState } from '@data/usecase/SentenceTranslationUseCase';

import sentenceFavoriteReducer, { SentenceFavoriteState } from '@data/usecase/SentenceFavouriteUseCase';
import savedArticlesReducer, { SavedArticlesState } from '@data/usecase/SavedArticlesUseCase';

// 启用Immer的MapSet插件
enableMapSet();

export const store = configureStore({
  reducer: {
    auth: authReducer,
    article: articleReducer,
    dailyLearningLogs: dailyLearningLogsReducer,
    wordSearch: wordSearchReducer,
    sentenceTranslation: sentenceTranslationReducer,

    sentenceFavorite: sentenceFavoriteReducer,
    savedArticles: savedArticlesReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: false,
    }),
});

export interface RootState {
  auth: AuthState;
  article: ArticleState;
  dailyLearningLogs: DailyLearningLogsState;
  wordSearch: WordSearchState;
  sentenceTranslation: SentenceTranslationState;

  sentenceFavorite: SentenceFavoriteState;
  savedArticles: SavedArticlesState;
}

export type AppDispatch = typeof store.dispatch;