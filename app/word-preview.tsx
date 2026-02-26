import { DailyNewWord } from '@data/model/WordPreview';
import { RootState } from '@data/repository/store';
import { useTheme } from '@hooks/useTheme';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StyleSheet, Text } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { designTokensColors, spacing, typography } from '../constants/designTokens';
import { WordPreview } from './components/WordPreview';

const c = designTokensColors;
const s = spacing;
const t = typography;

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
      <SafeAreaView style={[styles.errorContainer, { backgroundColor: theme.colors.background }]}>
        <Text style={styles.errorTitle}>Debug: Invalid logId provided</Text>
        <Text style={styles.errorParams}>Params: {JSON.stringify(params)}</Text>
      </SafeAreaView>
    );
  }

  // Render the WordPreview component and pass a custom onBackPress to Header
  return (
    <WordPreview
      logId={logId}
      words={words}
      onBackPress={() => router.replace('/(tabs)/MainPage')}
    />
  );
}

const styles = StyleSheet.create({
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: s.cardPadding,
  },
  errorTitle: {
    fontSize: t.fontSize.cardTitle,
    marginBottom: s.cardGap,
    color: c.textMain,
    fontFamily: t.fontFamily.body,
    fontWeight: t.fontWeight.bold,
  },
  errorParams: {
    fontSize: t.fontSize.bodyMeta,
    color: c.textMuted,
    fontFamily: t.fontFamily.body,
  },
});

