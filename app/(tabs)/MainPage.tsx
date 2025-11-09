import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, TouchableOpacity, Dimensions, Platform, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@hooks/useTheme';
import { useRouter, useSegments } from 'expo-router';
import { useDailyLearningLogs } from '@hooks/useDailyLearningLogs';
import DailyProgressar from '../components/DailyProgressar';
import { Header } from '../components/Header';
import { DropdownMenu } from '../components/DropdownMenu';
import { useSelector } from 'react-redux';
import type { RootState } from '../../data/repository/store';
import { finishStudy } from '../../data/api/FinishStudyApi';
import CongratulationsBottomSheet from '../components/CongratulationsBottomSheet';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useFocusEffect } from '@react-navigation/native';
import DailyLearningLogsTest from '../components/DailyLearningLogsTest';
import { Button } from 'react-native-paper';

const { width, height } = Dimensions.get('window');

// Mock data for articles
const articles = [
  {
    id: '1',
    title: 'How Deep Learning Is Bringing Old Anime Back to Life in Stunning HD',
    subtitle: '深度学习如何让老动画高清重制？',
    image: Platform.select({
      web: { uri: 'https://picsum.photos/800/400' },
      default: require('../../assets/images/icon.png'),
    }),
    category: 'Technology',
  },
  {
    id: '2',
    title: 'Manchester United\'s Tactical DNA: From Ferguson to Ten Hag',
    subtitle: '曼联的战术 DNA：从弗格森到滕哈赫，战术演变全解析',
    image: Platform.select({
      web: { uri: 'https://picsum.photos/800/401' },
      default: require('../../assets/images/icon.png'),
    }),
    category: 'Sports',
  },
  {
    id: '3',
    title: 'What If Football Had a Skill Tree? Ranking the Most \'Game-Level\' Players',
    subtitle: '如果足球有技能树？盘点现实中的"游戏级"球员',
    image: Platform.select({
      web: { uri: 'https://picsum.photos/800/402' },
      default: require('../../assets/images/icon.png'),
    }),
    category: 'Sports',
  },
];

const MainPage = () => {
  const { theme } = useTheme();
  const router = useRouter();
  const segments = useSegments();
  // Debug: log when MainPage is mounted and what the current route segments are
  console.log('[MainPage] Component mounted. Segments:', segments);
  // Add back missing useState hooks for dropdown and button position
  const [showDropdown, setShowDropdown] = useState(false);
  const [buttonPosition, setButtonPosition] = useState({ x: 0, y: 0, width: 0, height: 0 });
  // State for the early finish confirmation modal
  const [showFinishConfirm, setShowFinishConfirm] = useState(false);
  const [showCongrats, setShowCongrats] = useState(false);

  // Use the new computed values from useDailyLearningLogs
  const {
    logs,
    isLoading,
    error,
    logsCount, // Number of articles to complete today (1/2/3)
    daily_goal, // User's daily goal (10/20/30)
    completedCount, // Number of finished articles (status === 'learned')
    progress, // Progress ratio for the progress bar
  } = useDailyLearningLogs(); // Add a log in the hook itself for even more clarity
  // Use typed selector for user
  const user = useSelector((state: RootState) => state.auth.user);
  // Track if finishStudy API has been called today to avoid duplicate calls
  const [finishStudyCalled, setFinishStudyCalled] = useState(false);
  // Local override for progress bar after early finish
  const [forceFullProgress, setForceFullProgress] = useState(false);

  // Its purpose is for testing, so these parts should be commented out before going live.
  const ONLY_SHOW_LOGS = true;

  // Function to call the finish study API (now using the utility)
  const callFinishStudyApi = async () => {
    if (!user?.id || finishStudyCalled) return;
    try {
      // Convert user.id to number for finishStudy API
      const data = await finishStudy(Number(user.id));
      console.log('[FinishStudy] Success:', data);
      setFinishStudyCalled(true);
      // 不在这里 setShowCongrats(true)
    } catch (err: any) {
      if (err.message === 'Learning_setting does not exist') {
        console.warn('[FinishStudy] Learning_setting does not exist');
      } else {
        console.error('[FinishStudy] API error:', err);
      }
      setFinishStudyCalled(true);
    }
  };

  // Handler for the '提前完成' button: show confirmation modal
  const handleFinishStudyEarly = () => {
    setShowFinishConfirm(true);
  };

  // Handler for confirming early finish
  const handleConfirmFinish = () => {
    setShowFinishConfirm(false);
    setForceFullProgress(true); // Immediately set progress bar to 100%
    setShowCongrats(true); // 立即弹窗
    callFinishStudyApi(); // 异步调用，不阻塞弹窗
  };

  // Handler for cancelling early finish
  const handleCancelFinish = () => {
    setShowFinishConfirm(false);
  };

  // Effect: If user completes all required articles, call finish study API automatically
  useEffect(() => {
    if (progress >= 1 && !finishStudyCalled) {
      callFinishStudyApi();
      // 不在这里自动弹出，只在用户确认提前完成或从 today-recap 返回时弹出
    }
  }, [progress, finishStudyCalled]);

  const handleHistoryPress = () => {
    console.log('[MainPage] History pressed');
    router.push('/history-articles');
  };

  const handleFavoritesPress = () => {
    console.log('[MainPage] Favorites pressed');
    router.push('/SavedArticles');
  };

  const handleNotesPress = () => {
    console.log('[MainPage] Notes pressed');
    router.push('/MyNotes');
  };

  const handleHamburgerPress = () => {
    // 计算汉堡菜单按钮的位置
    setButtonPosition({
      x: width - 50,
      y: 20,
      width: 40,
      height: 40
    });
    setShowDropdown(true);
  };
  const handleArticlePress = (articleId: string) => {
    console.log('[MainPage] Navigating to PassageMain with sessionId:', articleId);
    router.push({
      pathname: '/PassageMain',
      params: { sessionId: articleId }
    });
  };

  // Ensure logId is always a number
  const handleLogPress = (logId: number, _words: any[]) => {
    console.log('[MainPage] Navigating to WordPreview with logId:', logId);
    // Only pass the id; the target screen will read words from Redux
    router.push({
      pathname: '/debug/testblank',
      params: {
        logId: logId.toString(),
      }
    });
  };

  // Remove old calculation:
  // const logsCount = Array.isArray(logs) ? logs.length : 0;
  // const learningCount = Array.isArray(logs) ? logs.filter((log: any) => log.status === 'learning').length : 0;
  // const progress = logsCount > 0 ? learningCount / logsCount : 0;

  // Only show logs that are not yet learned (not completed)
  const unlearnedLogs = Array.isArray(logs) ? logs.filter((log: any) => log.status !== 'learned') : [];

  // Use forced progress if early finish was confirmed
  const displayProgress = forceFullProgress ? 1 : progress;

  useFocusEffect(
    React.useCallback(() => {
      // 检查是否需要弹出 CongratulationsBottomSheet
      // 只有在从 today-recap 返回时才弹出
      AsyncStorage.getItem('@show_congrats_on_mainpage').then((val: string | null) => {
        console.log('[MainPage] useFocusEffect - AsyncStorage value:', val);
        if (val === '1') {
          console.log('[MainPage] Showing congratulations bottom sheet');
          setShowCongrats(true);
          AsyncStorage.removeItem('@show_congrats_on_mainpage');
        }
      });
    }, [user?.id])
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <Header
        title="仝文馆"
        showMenuButton={false}
        showNotificationButton={false}
        showHamburgerMenu={false}
        onHamburgerPress={handleHamburgerPress}
      />
      {/* <Button
        mode="contained"
        style={{ marginVertical: 16, backgroundColor: '#007AFF' }}
        onPress={() => router.push('/debug/test-daily-log-request')}
      >
        Test Daily Log API
        
      </Button> */}
      {/* 今日目标进度条区域 */}
      <View style={styles.goalContainer}>
        {/* Left: 今日目标 above the target count, both left-aligned */}
        <View style={styles.goalLeft}>
          <Text style={styles.goalTitle}>今日目标</Text>
          <Text style={styles.goalCount}>{logsCount}篇</Text>
        </View>
        {/* Middle: Progress bar */}
        <View style={styles.goalProgressBarWrapper}>
          <DailyProgressar
            progress={displayProgress}
            height={16}
            backgroundColor={'#fff'}
            barColor={'#FC9B33'}
            borderRadius={8}
          />
        </View>
        {/* Right: Button for finishing early */}
        <TouchableOpacity style={styles.goalButton} onPress={handleFinishStudyEarly}>
          <Text style={styles.goalButtonText}>提前完成</Text>
        </TouchableOpacity>
      </View>
      <ScrollView style={styles.scrollView}>
        {/* Daily Learning Logs Section */}
        { Array.isArray(unlearnedLogs) && unlearnedLogs.length > 0 && (
          <View style={styles.dailyLogsSection}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Recommend for you</Text>
              <Text style={styles.sectionSubtitle}>今日推荐</Text>
            </View>

            {isLoading ? (
              <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>Loading today's articles...</Text>
              </View>
            ) : error ? (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>Error: {error}</Text>
              </View>
            ) : (
              unlearnedLogs.map((log: any) => (
                <TouchableOpacity
                  key={log.id}
                  style={styles.logCard}
                  // Ensure logId is a number for handleLogPress
                  onPress={() => handleLogPress(Number(log.id), log.daily_new_word)}
                >
                  <View style={styles.logContent}>
                    <Text style={styles.logTitle}>{log.english_title}</Text>
                    <Text style={styles.logSubtitle}>{log.chinese_title}</Text>
                    <View style={styles.logMeta}>
                      <Text style={styles.logTag}>{log.tag}</Text>
                      <Text style={styles.logCEFR}>CEFR: {log.CEFR}</Text>
                    </View>
                    <Text style={styles.logWords}>
                      {log.daily_new_words.length} new words
                    </Text>
                  </View>
                </TouchableOpacity>
              ))
            )}
          </View>
        )}
         {!ONLY_SHOW_LOGS && (
          <>
          {/* Recommended Banner */}
          <View style={styles.recommendationBanner}>
            <Text style={styles.recommendationTitle}>Today's Picks</Text>
            <Text style={styles.recommendationSubtitle}>今日推荐</Text>
          </View>

          {/* Article Cards */}
          {articles.map((article) => (
            <TouchableOpacity
              key={article.id}
              style={styles.articleCard}
              // article.id is string, handleArticlePress expects string
              onPress={() => handleArticlePress(article.id)}
            >
              <Image source={article.image} style={styles.articleImage} />
              <View style={styles.articleContent}>
                <Text style={styles.articleTitle}>{article.title}</Text>
                <Text style={styles.articleSubtitle}>{article.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}

          {/* Test Section */}
          {__DEV__ && (
            <View style={styles.testSection}>
              <TouchableOpacity
                style={styles.testButton}
                onPress={() => router.push('../../test')}
              >
                <Text style={styles.testButtonText}>🧪 Daily Learning Logs Test</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Feature Articles Section */}
          <View style={styles.featureSection}>
            <View style={styles.featureHeader}>
              <Text style={styles.featureTitle}>Feature Articles</Text>
              <Text style={styles.featureSubtitle}>话题文章</Text>
            </View>

            {/* Feature Articles */}
            {articles.map((article) => (
              <TouchableOpacity
                key={`feature-${article.id}`}
                style={styles.featureCard}
                onPress={() => handleArticlePress(article.id)}
              >
                <Image source={article.image} style={styles.featureImage} />
                <View style={styles.featureContent}>
                  <Text style={styles.featureCardTitle}>{article.title}</Text>
                  <Text style={styles.featureCardSubtitle}>{article.subtitle}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
          </>
        )}
        {/* {__DEV__ && (
          <View style={{ marginVertical: 16 }}>
            <DailyLearningLogsTest />
          </View>
        )} */}
      </ScrollView>

      {/* DropdownMenu */}
      <DropdownMenu
        visible={showDropdown}
        onClose={() => setShowDropdown(false)}
        onHistoryPress={handleHistoryPress}
        onFavoritesPress={handleFavoritesPress}
        onNotesPress={handleNotesPress}
        buttonPosition={buttonPosition}
      />
      {/* Early finish confirmation modal */}
      <Modal
        visible={showFinishConfirm}
        transparent
        animationType="fade"
        onRequestClose={handleCancelFinish}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: '#eee', borderRadius: 12, padding: 32, alignItems: 'center', minWidth: 260 }}>
            <Text style={{ fontSize: 16, color: '#333', marginBottom: 24 }}>是否确认提前完成今日学习</Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 24 }}>
              {/* Change the confirm button color to green */}
              <TouchableOpacity onPress={handleConfirmFinish} style={{ backgroundColor: '#4CAF50', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 24, marginHorizontal: 8 }}>
                <Text style={{ color: 'white', fontSize: 16 }}>是</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleCancelFinish} style={{ backgroundColor: '#bbb', borderRadius: 6, paddingVertical: 8, paddingHorizontal: 24, marginHorizontal: 8 }}>
                <Text style={{ color: 'white', fontSize: 16 }}>否</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
      <CongratulationsBottomSheet visible={showCongrats} onClose={() => setShowCongrats(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  menuButton: {
    padding: 8,
  },
  scrollView: {
    flex: 1,
  },
  recommendationBanner: {
    backgroundColor: '#FC9B33',
    padding: width * 0.04,
    margin: width * 0.04,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recommendationTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Iowan Old Style', android: 'serif' }),
    fontWeight: '700',
  },
  recommendationSubtitle: {
    color: 'white',
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '600',
  },
  articleCard: {
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    borderRadius: 5,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  articleImage: {
    width: '100%',
    height: height * 0.25,
    borderTopLeftRadius: 5,
    borderTopRightRadius: 5,
  },
  articleContent: {
    padding: width * 0.04,
  },
  articleTitle: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
    color: '#0C1A30',
    marginBottom: height * 0.01,
  },
  articleSubtitle: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
  },
  featureSection: {
    marginTop: height * 0.02,
  },
  featureHeader: {
    backgroundColor: '#FC9B33',
    padding: width * 0.04,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  featureTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Iowan Old Style', android: 'serif' }),
    fontWeight: '700',
  },
  featureSubtitle: {
    color: 'white',
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '600',
  },
  featureCard: {
    flexDirection: 'row',
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    backgroundColor: 'white',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    alignItems: 'center',
  },
  featureImage: {
    width: width * 0.1,
    height: width * 0.1,
    borderTopLeftRadius: 5,
    borderBottomLeftRadius: 5,
    margin: width * 0.02,
  },
  featureContent: {
    flex: 1,
    padding: width * 0.04,
    justifyContent: 'center',
  },
  featureCardTitle: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '600',
    color: '#0C1A30',
    marginBottom: height * 0.005,
  },
  featureCardSubtitle: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
  },
  dailyLogsSection: {
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.02,
  },
  sectionHeader: {
    backgroundColor: '#FC9B33',
    padding: width * 0.04,
    borderRadius: 5,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: height * 0.02,
  },
  sectionTitle: {
    color: 'white',
    fontSize: 18,
    fontFamily: Platform.select({ ios: 'Iowan Old Style', android: 'serif' }),
    fontWeight: '700',
  },
  sectionSubtitle: {
    color: 'white',
    fontSize: 15,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '600',
  },
  logCard: {
    backgroundColor: 'white',
    borderRadius: 5,
    padding: width * 0.04,
    marginBottom: height * 0.015,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  logContent: {
    flex: 1,
  },
  logTitle: {
    fontSize: 16,
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
    fontWeight: '700',
    color: '#0C1A30',
    marginBottom: height * 0.005,
  },
  logSubtitle: {
    fontSize: 14,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#838589',
    marginBottom: height * 0.01,
  },
  logMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: height * 0.005,
  },
  logTag: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#4CAF50',
    backgroundColor: '#E8F5E8',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  logCEFR: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#FF9800',
    backgroundColor: '#FFF3E0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
  },
  logWords: {
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    color: '#2196F3',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 3,
    alignSelf: 'flex-start',
  },
  loadingContainer: {
    padding: width * 0.04,
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  errorContainer: {
    padding: width * 0.04,
    alignItems: 'center',
  },
  errorText: {
    fontSize: 14,
    color: '#F44336',
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
  },
  testSection: {
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.02,
  },
  testButton: {
    backgroundColor: '#FF5722',
    padding: width * 0.04,
    borderRadius: 8,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  testButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: Platform.select({ ios: 'DM Sans', android: 'sans-serif' }),
  },
  goalContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: width * 0.04,
    paddingVertical: height * 0.015,
    backgroundColor: '#FFFBF8', // Match Header color
    borderRadius: 5,
    marginHorizontal: width * 0.04,
    marginBottom: height * 0.02,
    marginTop: 24, // Add space below Header
    // Shadow for iOS
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.10,
    shadowRadius: 8,
    // Elevation for Android
    elevation: 6,
  },
  goalLeft: {
    flexDirection: 'column', // Stack vertically
    alignItems: 'flex-start', // Left align
    justifyContent: 'center',
    minWidth: 60,
  },
  goalTitle: {
    color: 'black',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '600',
    marginBottom: 2,
  },
  goalCount: {
    color: '#FC9B33',
    fontSize: 24,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '500',
    flexDirection: 'row',
  },
  goalProgressBarWrapper: {
    flex: 1,
    marginHorizontal: width * 0.02,
  },
  goalButton: {
    backgroundColor: '#FC9B33',
    paddingVertical: height * 0.005,
    paddingHorizontal: width * 0.02,
    borderRadius: 5,
  },
  goalButtonText: {
    color: 'white',
    fontSize: 12,
    fontFamily: Platform.select({ ios: 'Inter', android: 'sans-serif' }),
    fontWeight: '600',
  },
});

export default MainPage;