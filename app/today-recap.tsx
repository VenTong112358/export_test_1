import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useSelector } from 'react-redux';
import { RootState } from '@data/repository/store';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useDailyLearningLogs } from '@hooks/useDailyLearningLogs';

const { width, height } = Dimensions.get('window');

export default function TodayRecapPage() {
  const { theme } = useTheme();
  const router = useRouter();
  const params = useLocalSearchParams();
  
  // Get the specific logId from route params
  const logId = params.logId ? parseInt(params.logId as string) : null;
  
  // Get today's learning data from Redux
  const { logs } = useSelector((state: RootState) => state.dailyLearningLogs);
  
  // Filter logs to only show the specific article if logId is provided
  const filteredLogs = logId ? logs.filter(log => log.id === logId) : logs;
  
  // Calculate today's word count (only for the specific article if logId is provided)
  const todayWords = filteredLogs.reduce((total, log) => {
    return total + (log.daily_new_words?.length || 0);
  }, 0);

  const { logsCount, completedCount } = useDailyLearningLogs();

  const handleBackPress = () => {
    router.back();
  };

  const handleReturnHome = async () => {
    if (completedCount >= logsCount && logsCount > 0) {
      console.log('[TodayRecap] Setting congratulations flag - completedCount:', completedCount, 'logsCount:', logsCount);
      await AsyncStorage.setItem('@show_congrats_on_mainpage', '1');
    } else {
      console.log('[TodayRecap] Not setting congratulations flag - completedCount:', completedCount, 'logsCount:', logsCount);
    }
    router.push('/');
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Today's Recap</Text>
          <Text style={styles.headerSubtitle}>今日学习总结</Text>
        </View>
        <View style={styles.headerRight}>
          <Ionicons name="checkmark-circle" size={24} color="#FC9B33" />
        </View>
      </View>

      <ScrollView style={styles.scrollView}>
        {/* Upper Section - Word Count */}
        <View style={styles.wordCountSection}>
          <View style={styles.wordCountCard}>
            <Text style={styles.wordCountLabel}>今日学习单词</Text>
            <Text style={styles.wordCountNumber}>+{todayWords}</Text>
            <Text style={styles.wordCountSubtitle}>个新单词</Text>
          </View>
        </View>

        {/* Lower Section - New Words List */}
        <View style={styles.newWordsSection}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>今日生词列表</Text>
            <Text style={styles.sectionSubtitle}>Today's New Words</Text>
          </View>
          
          {filteredLogs.length > 0 ? (
            filteredLogs.map((log) => (
              <View key={log.id} style={styles.logCard}>
                <View style={styles.logHeader}>
                  <Text style={styles.logTitle}>{log.english_title}</Text>
                  <Text style={styles.logSubtitle}>{log.chinese_title}</Text>
                </View>
                
                {log.daily_new_words && log.daily_new_words.length > 0 && (
                  <View style={styles.wordsList}>
                    {log.daily_new_words.map((word: any) => (
                      <View key={word.id} style={styles.wordItem}>
                        <View style={styles.wordInfo}>
                          <Text style={styles.wordText}>{word.word}</Text>
                          <Text style={styles.wordPhonetic}>[{word.phonetic}]</Text>
                        </View>
                        <Text style={styles.wordDefinition}>{word.definition}</Text>
                      </View>
                    ))}
                  </View>
                )}
              </View>
            ))
          ) : (
            <View style={styles.emptyState}>
              <Ionicons name="book-outline" size={48} color="#ccc" />
              <Text style={styles.emptyText}>暂无学习记录</Text>
              <Text style={styles.emptySubtext}>开始你的学习之旅吧！</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Orange "返回主页" button */}
      <TouchableOpacity
        style={styles.returnHomeButton}
        onPress={handleReturnHome}
      >
        <Ionicons name="home" size={24} color="white" />
        <Text style={styles.returnHomeButtonText}>返回主页</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.02,
    backgroundColor: '#FFFBF8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0C1A30',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  headerRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  // Upper Section - Word Count
  wordCountSection: {
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.03,
  },
  wordCountCard: {
    backgroundColor: '#FC9B33',
    borderRadius: 16,
    padding: width * 0.06,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  wordCountLabel: {
    fontSize: 16,
    color: 'white',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    marginBottom: height * 0.01,
  },
  wordCountNumber: {
    fontSize: 48,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    marginBottom: height * 0.005,
  },
  wordCountSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  // Lower Section - New Words List
  newWordsSection: {
    paddingHorizontal: width * 0.04,
    paddingBottom: height * 0.03,
  },
  sectionHeader: {
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0C1A30',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    marginBottom: height * 0.005,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  logCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: width * 0.04,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logHeader: {
    marginBottom: height * 0.015,
    paddingBottom: height * 0.015,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  logTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0C1A30',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    marginBottom: height * 0.005,
  },
  logSubtitle: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  wordsList: {
    gap: height * 0.01,
  },
  wordItem: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    padding: width * 0.03,
    borderLeftWidth: 3,
    borderLeftColor: '#FC9B33',
  },
  wordInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: height * 0.005,
  },
  wordText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#0C1A30',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    marginRight: width * 0.02,
  },
  wordPhonetic: {
    fontSize: 12,
    color: '#666',
    fontStyle: 'italic',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  wordDefinition: {
    fontSize: 13,
    color: '#333',
    lineHeight: 18,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: height * 0.1,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    marginTop: height * 0.02,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    marginTop: height * 0.01,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  returnHomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FC9B33',
    paddingVertical: height * 0.02,
    paddingHorizontal: width * 0.04,
    borderRadius: 12,
    marginHorizontal: width * 0.04,
    marginTop: height * 0.02,
    marginBottom: height * 0.02,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  returnHomeButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: width * 0.02,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
});