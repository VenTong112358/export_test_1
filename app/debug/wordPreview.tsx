import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { WordPreview } from '../components/WordPreview';
import { Text } from 'react-native';
import { useTheme } from '@hooks/useTheme';
import { DailyNewWord } from '@data/model/WordPreview';
import { useSelector } from 'react-redux';
import { RootState } from '@data/repository/store';

export default function WordPreviewRoute() {
  const params = useLocalSearchParams();
  const { theme } = useTheme();
  const router = useRouter();
  const logId = parseInt(params.logId as string);
  // Derive words from Redux to avoid large navigation params
  const { logs } = useSelector((state: RootState) => state.dailyLearningLogs);
  const words: DailyNewWord[] = Array.isArray(logs)
    ? (logs.find((l: any) => Number(l.id) === logId)?.daily_new_words || [])
    : [];

  // Debug: Show if logId is invalid
  if (!logId || isNaN(logId)) {
    return (
      <SafeAreaView style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20, backgroundColor: theme.colors.background }}>
        <Text style={{ fontSize: 18, marginBottom: 20 }}>Debug: Invalid logId provided</Text>
        <Text style={{ fontSize: 14, color: 'gray' }}>Params: {JSON.stringify(params)}</Text>
      </SafeAreaView>
    );
  }

  // Render the WordPreview component and pass a custom onBackPress to Header
  return (
    <WordPreview 
      logId={logId} 
      words={words} 
      // Pass a custom onBackPress to Header so the back button always goes to MainPage
      onBackPress={() => router.replace('/(tabs)/MainPage')}
    />
  );
}