import articleReducer, { ArticleState } from '@data/usecase/ArticleUseCase';
import dailyLearningLogsReducer, { DailyLearningLogsState } from '@data/usecase/DailyLearningLogsUseCase';
import sentenceTranslationReducer, { SentenceTranslationState } from '@data/usecase/SentenceTranslationUseCase';
import authReducer, { AuthState } from '@data/usecase/UserUseCase';
import wordSearchReducer, { WordSearchState } from '@data/usecase/WordSearchUseCase';
import { configureStore } from '@reduxjs/toolkit';
import { enableMapSet } from 'immer';

import allArticlesReducer, { AllArticlesState } from '@data/usecase/AllArticlesUseCase';
import savedArticlesReducer, { SavedArticlesState } from '@data/usecase/SavedArticlesUseCase';
import sentenceFavoriteReducer, { SentenceFavoriteState } from '@data/usecase/SentenceFavouriteUseCase';
import wordsWithCaijiReducer, { WordsWithCaijiState } from '@data/usecase/WordsWithCaijiUseCase';

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
    allArticles: allArticlesReducer,
    wordsWithCaiji: wordsWithCaijiReducer,
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
  allArticles: AllArticlesState;
  wordsWithCaiji: WordsWithCaijiState;
}

export type AppDispatch = typeof store.dispatch;